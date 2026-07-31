const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Stores (1 Seller -> Many Stores)
router.get('/stores', sellerController.getSellerStores);
router.post('/stores', sellerController.createSellerStore);
router.put('/stores/:id', sellerController.updateSellerStore);
router.put('/store', sellerController.updateSellerStore); // Fallback for backward compatibility

// Products
router.get('/products', sellerController.getSellerProducts);
router.post('/products', productController.createProduct);
router.put('/products/:id', sellerController.updateSellerProduct);
router.delete('/products/:id', sellerController.deleteSellerProduct);

// Analytics
router.get('/analytics', sellerController.getSellerAnalytics);

// Seller Orders
router.get('/orders', sellerController.getSellerOrders);
router.put('/orders/:id/status', sellerController.updateSellerOrderStatus);

module.exports = router;
