const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/products', sellerController.getSellerProducts);
router.post('/products', productController.createProduct);
router.put('/products/:id', sellerController.updateSellerProduct);
router.delete('/products/:id', sellerController.deleteSellerProduct);
router.get('/analytics', sellerController.getSellerAnalytics);

module.exports = router;
