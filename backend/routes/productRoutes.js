const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');

router.get('/', productController.getAllProducts);
router.get('/categories', productController.getCategories);
router.get('/search/suggest', productController.searchSuggest);
router.get('/:id', productController.getProductById);

// Chỉ seller hoặc admin mới được tạo sản phẩm (authMiddleware xác thực)
router.post('/', authMiddleware, productController.createProduct);

module.exports = router;
