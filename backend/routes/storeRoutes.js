const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

router.get('/', storeController.getAllStores);
router.get('/:slug', storeController.getStoreBySlug);
router.get('/:slug/products', storeController.getStoreProducts);
router.post('/', storeController.createStore);
router.put('/:id', storeController.updateStore);

module.exports = router;
