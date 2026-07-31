const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');

router.get('/', productController.getAllProducts);
router.get('/categories', productController.getCategories);
router.get('/categories/suggest', productController.predictCategory);
router.get('/brands', productController.getBrands);
router.get('/tags/popular', productController.getPopularTags);
router.get('/tags/by-category', productController.getTagsByCategory);
router.get('/seller/list', authMiddleware, productController.getSellerProducts);
router.get('/search/suggest', productController.searchSuggest);
router.get('/search', productController.searchProducts);
router.get('/:id', productController.getProductById);
router.post('/', authMiddleware, productController.createProduct);
router.put('/:id', authMiddleware, productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);

module.exports = router;
