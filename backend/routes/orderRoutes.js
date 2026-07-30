const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');

// Yêu cầu xác thực cho tất cả các hành động liên quan đến đơn hàng
router.use(authMiddleware);

router.post('/', orderController.createOrder);
router.get('/', orderController.getOrders);

module.exports = router;
