const recommendationService = require('../services/recommendationService');

exports.trackInteraction = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const result = await recommendationService.trackUserBehavior(userId, req.body);
    res.json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi khi lưu tương tác!' });
  }
};

exports.getPersonalized = async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 6;
    const recommendations = await recommendationService.getPersonalizedRecommendations(req.user.id, limit);
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy gợi ý cá nhân hóa!', error: err.message });
  }
};

exports.getSimilar = async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 5;
    const similarProducts = await recommendationService.getSimilarProducts(req.params.productId, limit);
    res.json(similarProducts);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy sản phẩm tương tự!', error: err.message });
  }
};

exports.getTrending = async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const trendingProducts = await recommendationService.getTrendingProducts(limit);
    res.json(trendingProducts);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách xu hướng!', error: err.message });
  }
};

exports.getSearchBased = async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 6;
    const searchRecommendations = await recommendationService.getSearchBasedRecommendations(req.user.id, limit);
    res.json(searchRecommendations);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi gợi ý dựa trên tìm kiếm!', error: err.message });
  }
};
