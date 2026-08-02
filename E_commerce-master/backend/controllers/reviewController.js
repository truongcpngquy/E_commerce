const reviewService = require('../services/reviewService');

exports.createReview = async (req, res) => {
  try {
    const result = await reviewService.createReview(req.user.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi khi gửi đánh giá!' });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await reviewService.getProductReviews(req.params.productId);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy đánh giá!', error: err.message });
  }
};
