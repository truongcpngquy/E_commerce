const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');

router.get('/', productController.getAllProducts);
router.get('/categories', productController.getCategories);
router.get('/brands', productController.getBrands);
router.get('/search/suggest', productController.searchSuggest);
router.get('/search', productController.searchProducts);
router.get('/:id', productController.getProductById);
router.post('/', authMiddleware, productController.createProduct);

module.exports = router;
