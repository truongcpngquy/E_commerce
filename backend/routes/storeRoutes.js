const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

router.get('/', storeController.getStores);
router.get('/:id', storeController.getPublicStoreById);
router.get('/:id/products', storeController.getPublicStoreProducts);

module.exports = router;
