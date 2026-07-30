const sellerService = require('../services/sellerService');

exports.getSellerProducts = async (req, res) => {
  try {
    const products = await sellerService.getSellerProducts(req.user.id);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy sản phẩm của người bán!', error: err.message });
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
    const stats = await sellerService.getSellerAnalytics(req.user.id);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi lấy thống kê!', error: err.message });
  }
};
