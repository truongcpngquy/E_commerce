const db = require('../config/db');
const recoEngine = require('../utils/recommendationEngine');

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

    if (userId) {
      await db.query(
        `INSERT INTO user_behavior_logs (user_id, session_id, product_id, action_type, weight, dwell_seconds)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, sessId, product_id, finalAction, weight, dwell_seconds]
      );
    }

    // Cập nhật metrics ngầm
    db.query(
      `INSERT INTO product_metrics (product_id, views_count, popularity_score)
       VALUES (?, 1, ?)
       ON DUPLICATE KEY UPDATE
         views_count = views_count + IF(? = 'product_view', 1, 0),
         popularity_score = popularity_score + ?`,
      [product_id, weight, finalAction, weight]
    ).catch(e => console.error('Lỗi cập nhật metrics:', e.message));

    return { success: true, message: 'Đã ghi nhận vết tương tác thành công!' };
  }

  /**
   * Gợi ý sản phẩm cá nhân hóa cho User (Personalized AI Feed)
   */
  async getPersonalizedRecommendations(userId, limit = 6) {
    const [allProducts] = await db.query(
      `SELECT p.*, c.name as category_name, b.name as brand_name,
              pm.rating_avg, pm.rating_count, pm.popularity_score
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN product_metrics pm ON p.id = pm.product_id
       WHERE p.status = 'active'`
    );

    const [behaviorLogs] = await db.query(
      `SELECT product_id, weight, created_at
       FROM user_behavior_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    return recoEngine.getPersonalizedRecommendations(
      behaviorLogs,
      allProducts,
      limit
    );
  }

  /**
   * Gợi ý sản phẩm tương tự dựa trên Cosine Similarity (Similar Products)
   */
  async getSimilarProducts(productId, limit = 5) {
    const [allProducts] = await db.query(
      `SELECT p.*, c.name as category_name, b.name as brand_name,
              pm.rating_avg, pm.rating_count, pm.popularity_score
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN product_metrics pm ON p.id = pm.product_id
       WHERE p.status = 'active'`
    );

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
    const [products] = await db.query(
      `SELECT p.*, c.name as category_name, b.name as brand_name,
              pm.rating_avg, pm.rating_count, pm.popularity_score
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN product_metrics pm ON p.id = pm.product_id
       WHERE p.status = 'active'
       ORDER BY pm.popularity_score DESC, p.id DESC
       LIMIT ?`,
      [limit]
    );
    return products;
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

    const [allProducts] = await db.query(
      `SELECT p.*, c.name as category_name, b.name as brand_name,
              pm.rating_avg, pm.rating_count, pm.popularity_score
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN product_metrics pm ON p.id = pm.product_id
       WHERE p.status = 'active'`
    );

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
