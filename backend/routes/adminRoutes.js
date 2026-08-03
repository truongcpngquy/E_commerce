const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

// Middleware xác thực Admin
const adminOnlyMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Quyền truy cập bị từ chối! Chỉ Admin hệ thống mới có quyền truy cập.' });
  }
  next();
};

router.use(authMiddleware);
router.use(adminOnlyMiddleware);

// Admin Stats
router.get('/stats', adminController.getAdminStats);

// User Management & Seller Approval
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
