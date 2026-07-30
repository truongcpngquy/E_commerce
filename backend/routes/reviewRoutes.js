const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/auth');

router.get('/product/:productId', reviewController.getProductReviews);
router.post('/', authMiddleware, reviewController.createReview);

module.exports = router;
