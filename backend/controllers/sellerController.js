const sellerService = require('../services/sellerService');

exports.getSellerStores = async (req, res) => {
  try {
    const stores = await sellerService.getSellerStores(req.user.id);
    res.json(stores);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách gian hàng!', error: err.message });
  }
};

exports.createSellerStore = async (req, res) => {
  try {
    const store = await sellerService.createSellerStore(req.user.id, req.body);
    res.status(201).json(store);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi khi tạo gian hàng mới!' });
  }
};

exports.updateSellerStore = async (req, res) => {
  try {
    const storeId = req.params.id || req.body.id;
    const store = await sellerService.updateSellerStore(req.user.id, storeId, req.body);
    res.json(store);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi khi cập nhật gian hàng!' });
  }
};

exports.getSellerProducts = async (req, res) => {
  try {
    const storeId = req.query.store_id || null;
    const products = await sellerService.getSellerProducts(req.user.id, storeId);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy sản phẩm người bán!', error: err.message });
  }
};

exports.updateSellerProduct = async (req, res) => {
  try {
    const result = await sellerService.updateSellerProduct(req.user.id, req.params.id, req.body);
    res.json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi server khi cập nhật sản phẩm!' });
  }
};

exports.deleteSellerProduct = async (req, res) => {
  try {
    const result = await sellerService.deleteSellerProduct(req.user.id, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi ngừng bán sản phẩm!', error: err.message });
  }
};

exports.getSellerAnalytics = async (req, res) => {
  try {
    const storeId = req.query.store_id || null;
    const stats = await sellerService.getSellerAnalytics(req.user.id, storeId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi lấy thống kê!', error: err.message });
  }
};

exports.getSellerOrders = async (req, res) => {
  try {
    const storeId = req.query.store_id || null;
    const orders = await sellerService.getSellerOrders(req.user.id, storeId);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đơn hàng người bán!', error: err.message });
  }
};

exports.updateSellerOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await sellerService.updateSellerOrderStatus(req.user.id, req.params.id, status);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái đơn hàng!', error: err.message });
  }
};
