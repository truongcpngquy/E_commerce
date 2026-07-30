const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.post('/refresh-token', authMiddleware, authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
