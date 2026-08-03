const db = require('../config/db');
const sellerService = require('../services/sellerService');
const productController = require('./productController');

exports.getSellerAnalytics = async (req, res) => {
  try {
    const storeId = req.query.store_id || null;
    const stats = await sellerService.getSellerAnalytics(req.user.id, storeId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy thống kê người bán!', error: err.message });
  }
};

exports.getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const isUserAdmin = req.user.role === 'admin';
    const storeId = req.query.store_id || null;

    let sql = `
      SELECT p.*, c.name as category_name, COALESCE(s.name, 'Gian Hàng Chăm Sóc') as store_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN stores s ON p.store_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (!isUserAdmin) {
      sql += ' AND (s.owner_id = ? OR p.store_id IS NULL OR p.store_id IN (SELECT id FROM stores WHERE owner_id = ?))';
      params.push(sellerId, sellerId);
    }

    if (storeId && storeId !== 'all') {
      sql += ' AND p.store_id = ?';
      params.push(Number(storeId));
    }

    sql += ' ORDER BY p.id DESC';
    let [products] = await db.query(sql, params);

    // Nếu người bán chưa có sản phẩm riêng, trả về tất cả sản phẩm hệ thống để thử nghiệm quản lý
    if (products.length === 0 && !isUserAdmin) {
      const [fallback] = await db.query(`
        SELECT p.*, c.name as category_name, COALESCE(s.name, 'SmartTech Official Store') as store_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN stores s ON p.store_id = s.id
        ORDER BY p.id DESC
      `);
      products = fallback;
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy sản phẩm người bán!', error: err.message });
  }
};

exports.getSellerOrders = async (req, res) => {
  try {
    const storeId = req.query.store_id || null;
    const orders = await sellerService.getSellerOrders(req.user.id, storeId);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy đơn hàng người bán!', error: err.message });
  }
};

exports.updateSellerOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await sellerService.updateSellerOrderStatus(req.user.id, req.params.id, status);
    res.json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi khi cập nhật trạng thái đơn hàng!' });
  }
};

exports.getSellerStores = async (req, res) => {
  try {
    const stores = await sellerService.getSellerStores(req.user.id);
    res.json(stores);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy gian hàng!', error: err.message });
  }
};

exports.createSellerStore = async (req, res) => {
  try {
    const store = await sellerService.createSellerStore(req.user.id, req.body);
    res.status(201).json(store);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi khi tạo gian hàng!' });
  }
};

exports.updateSellerStore = async (req, res) => {
  try {
    const store = await sellerService.updateSellerStore(req.user.id, req.params.id, req.body);
    res.json(store);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi khi cập nhật gian hàng!' });
  }
};
