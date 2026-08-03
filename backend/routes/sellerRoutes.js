const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Analytics
router.get('/analytics', sellerController.getSellerAnalytics);

// Products
router.get('/products', sellerController.getSellerProducts);
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

// Orders
router.get('/orders', sellerController.getSellerOrders);
router.put('/orders/:id/status', sellerController.updateSellerOrderStatus);

// Stores
router.get('/stores', sellerController.getSellerStores);
router.post('/stores', sellerController.createSellerStore);
router.put('/stores/:id', sellerController.updateSellerStore);

module.exports = router;
