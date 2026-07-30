const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const authMiddleware = require('../middleware/auth');

// Lưu vết tương tác (yêu cầu đăng nhập)
router.post('/track', authMiddleware, recommendationController.trackInteraction);

// Lấy sản phẩm gợi ý cá nhân hóa (yêu cầu đăng nhập)
router.get('/personalized', authMiddleware, recommendationController.getPersonalized);

// Lấy sản phẩm tương tự (không yêu cầu đăng nhập, chỉ cần productId)
router.get('/similar/:productId', recommendationController.getSimilar);

module.exports = router;
