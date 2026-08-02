const adminService = require('../services/adminService');

exports.getStats = async (req, res) => {
  try {
    const stats = await adminService.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy số liệu thống kê!', error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await adminService.getUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách người dùng!', error: err.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const result = await adminService.updateUserRole(req.params.id, role);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật vai trò người dùng!', error: err.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await adminService.updateUserStatus(req.params.id, status);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái tài khoản!', error: err.message });
  }
};

exports.getStores = async (req, res) => {
  try {
    const stores = await adminService.getStores();
    res.json({ success: true, data: stores });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách gian hàng!', error: err.message });
  }
};

exports.updateStoreStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await adminService.updateStoreStatus(req.params.id, status);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái cửa hàng!', error: err.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await adminService.getProducts();
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách sản phẩm!', error: err.message });
  }
};

exports.archiveProduct = async (req, res) => {
  try {
    const result = await adminService.archiveProduct(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi khóa sản phẩm!', error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await adminService.getOrders();
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách đơn hàng!', error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await adminService.updateOrderStatus(req.params.id, status);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái đơn hàng!', error: err.message });
  }
};
