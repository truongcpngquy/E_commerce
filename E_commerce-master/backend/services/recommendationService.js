const db = require('../config/db');
const recoEngine = require('../utils/recommendationEngine');
const userRepository = require('../repositories/userRepository');
const productRepository = require('../repositories/productRepository');
const cfEngine = require('../utils/collaborativeFiltering');

const ACTION_WEIGHTS = {
  search_click:    2,
  product_view:    1,
  view:            1,
  dwell_time_high: 2,
  wishlist_add:    3,
  like:            3,
  cart_add:        4,
  cart:            4,
  cart_remove:    -2,
  checkout_start:  4,
  purchase:        5,
  feed_view:       1,
  share:           3,
};

const ACTION_MAP = {
  view: 'product_view',
  like: 'wishlist_add',
  cart: 'cart_add',
  purchase: 'purchase'
};

class RecommendationService {
  /**
   * Ghi nhận vết tương tác hành vi người dùng (Implicit Feedback)
   */
  async trackUserBehavior(userId, trackingData) {
    const { product_id, interaction_type, action_type, dwell_seconds = 0, session_id } = trackingData;
    const rawAction = action_type || interaction_type;

    if (!product_id || !rawAction) {
      const err = new Error('Thiếu ID sản phẩm hoặc loại tương tác!');
      err.statusCode = 400;
      throw err;
    }

    const finalAction = ACTION_MAP[rawAction] || rawAction;
    const weight = ACTION_WEIGHTS[rawAction] || ACTION_WEIGHTS[finalAction] || 1;
    const sessId = session_id || `sess_${Date.now()}`;

    await userRepository.insertBehaviorLog(userId, sessId, product_id, finalAction, weight, dwell_seconds);

    return { success: true, message: 'Đã ghi nhận vết tương tác thành công!' };
  }

  /**
   * Gợi ý sản phẩm cá nhân hóa cho User (Hybrid: Content-Based + Collaborative Filtering)
   */
  async getPersonalizedRecommendations(userId, limit = 6) {
    const allProducts = await productRepository.findProducts("WHERE p.status = 'active'", []);
    const userBehaviorLogs = await userRepository.findUserBehaviorLogs(userId, 50);

    // 1. Lấy kết quả từ Content-Based Filtering
    const cbRecommendations = recoEngine.getPersonalizedRecommendations(
      userBehaviorLogs,
      allProducts,
      limit * 2 // Lấy dư để hybrid
    );

    // 2. Lấy kết quả từ Collaborative Filtering
    // Để CF chạy chính xác cần ma trận của tất cả users, nhưng vì là real-time api, ta lấy 2000 logs gần nhất để tối ưu
    const [allLogs] = await db.query(`SELECT user_id, product_id, action_type, weight FROM user_behavior_logs ORDER BY id DESC LIMIT 2000`);
    const itemSimilarities = cfEngine.buildItemSimilarities(allLogs);
    const cfRecommendations = cfEngine.getCFRecommendations(userBehaviorLogs, itemSimilarities, allProducts, limit * 2);

    // 3. Hybrid: Kết hợp điểm (Weighted Hybrid: 50% CB + 50% CF)
    const hybridScores = {};
    const maxCbScore = Math.max(...cbRecommendations.map(p => p.recommendationScore || 0), 1);
    const maxCfScore = Math.max(...cfRecommendations.map(p => p.cfScore || 0), 1);

    cbRecommendations.forEach(p => {
      hybridScores[p.id] = (hybridScores[p.id] || 0) + (p.recommendationScore / maxCbScore) * 0.5;
    });

    cfRecommendations.forEach(p => {
      hybridScores[p.id] = (hybridScores[p.id] || 0) + (p.cfScore / maxCfScore) * 0.5;
    });

    // 4. Sinh kết quả Hybrid
    const hybridRecommendations = allProducts
      .filter(p => hybridScores[p.id] > 0)
      .map(p => ({
        ...p,
        hybridScore: hybridScores[p.id]
      }))
      .sort((a, b) => b.hybridScore - a.hybridScore)
      .slice(0, limit);

    // 5. Fallback nếu không đủ dữ liệu cho Hybrid thì điền đầy bằng CBF
    if (hybridRecommendations.length < limit) {
      const existingIds = new Set(hybridRecommendations.map(p => p.id));
      const backfill = cbRecommendations.filter(p => !existingIds.has(p.id)).slice(0, limit - hybridRecommendations.length);
      return [...hybridRecommendations, ...backfill];
    }

    return hybridRecommendations;
  }

  /**
   * Gợi ý sản phẩm tương tự dựa trên Cosine Similarity (Similar Products)
   */
  async getSimilarProducts(productId, limit = 5) {
    const allProducts = await productRepository.findProducts("WHERE p.status = 'active'", []);

    return recoEngine.getSimilarProducts(
      Number(productId),
      allProducts,
      limit
    );
  }

  /**
   * Lấy sản phẩm xu hướng / nổi bật (Trending Products)
   */
  async getTrendingProducts(limit = 10) {
    return productRepository.findProducts("WHERE p.status = 'active' ORDER BY pm.popularity_score DESC, p.id DESC LIMIT ?", [limit]);
  }

  /**
   * Gợi ý dựa trên ngữ cảnh lịch sử tìm kiếm gần đây
   */
  async getSearchBasedRecommendations(userId, limit = 6) {
    const [searchLogs] = await db.query(
      `SELECT query_text, normalized_query
       FROM search_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );

    if (searchLogs.length === 0) {
      return this.getTrendingProducts(limit);
    }

    const searchKeywords = searchLogs.map(l => l.query_text).join(' ');
    const tokens = recoEngine.tokenize(searchKeywords);

    const allProducts = await productRepository.findProducts("WHERE p.status = 'active'", []);

    const scoredProducts = allProducts.map(p => {
      const content = `${p.name} ${p.description || ''} ${p.tags || ''} ${p.category_name || ''}`.toLowerCase();
      let matchCount = 0;
      tokens.forEach(t => {
        if (content.includes(t)) matchCount++;
      });
      return { ...p, searchMatchScore: matchCount };
    })
    .filter(p => p.searchMatchScore > 0)
    .sort((a, b) => b.searchMatchScore - a.searchMatchScore);

    return scoredProducts.slice(0, limit);
  }
}

module.exports = new RecommendationService();
