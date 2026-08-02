const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Tất cả các routes admin đều phải đăng nhập và có quyền Admin
router.use(authMiddleware, adminMiddleware);

// Thống kê hệ thống
router.get('/stats', adminController.getStats);

// Quản lý người dùng
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/status', adminController.updateUserStatus);

// Quản lý gian hàng (Stores)
router.get('/stores', adminController.getStores);
router.put('/stores/:id/status', adminController.updateStoreStatus);

// Quản lý sản phẩm (Products)
router.get('/products', adminController.getProducts);
router.delete('/products/:id', adminController.archiveProduct);

// Quản lý đơn hàng (Orders)
router.get('/orders', adminController.getOrders);
router.put('/orders/:id/status', adminController.updateOrderStatus);

module.exports = router;
