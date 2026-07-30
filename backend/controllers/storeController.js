const storeService = require('../services/storeService');

exports.getAllStores = async (req, res) => {
  try {
    const stores = await storeService.getAllStores(req.query);
    res.json(stores);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi server khi lấy danh sách gian hàng!' });
  }
};

exports.getStoreBySlug = async (req, res) => {
  try {
    const store = await storeService.getStoreBySlug(req.params.slug);
    res.json(store);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi server khi lấy thông tin gian hàng!' });
  }
};

exports.getStoreProducts = async (req, res) => {
  try {
    const store = await storeService.getStoreBySlug(req.params.slug);
    const result = await storeService.getStoreProducts(store.id, req.query);
    res.json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi server khi lấy sản phẩm gian hàng!' });
  }
};

exports.createStore = async (req, res) => {
  try {
    const ownerId = req.user?.id || req.body.owner_id;
    const store = await storeService.createStore(ownerId, req.body);
    res.status(201).json({ message: 'Tạo Gian Hàng thành công!', store });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi tạo gian hàng!' });
  }
};

exports.updateStore = async (req, res) => {
  try {
    const store = await storeService.updateStore(req.params.id, req.body);
    res.json({ message: 'Cập nhật Gian Hàng thành công!', store });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi cập nhật gian hàng!' });
  }
};
