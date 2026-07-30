const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const authMiddleware = require('../middleware/auth');

router.post('/track', authMiddleware, recommendationController.trackInteraction);
router.get('/personalized', authMiddleware, recommendationController.getPersonalized);
router.get('/similar/:productId', recommendationController.getSimilar);
router.get('/trending', recommendationController.getTrending);
router.get('/search-based', authMiddleware, recommendationController.getSearchBased);

module.exports = router;
