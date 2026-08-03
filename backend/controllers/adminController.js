const db = require('../config/db');

// Lấy chỉ số tổng quan hệ thống Admin
exports.getAdminStats = async (req, res) => {
  try {
    const [[{ total_users }]] = await db.query('SELECT COUNT(*) as total_users FROM users');
    const [[{ pending_sellers }]] = await db.query('SELECT COUNT(*) as pending_sellers FROM users WHERE role = "seller" AND status = "pending"');
    const [[{ total_sellers }]] = await db.query('SELECT COUNT(*) as total_sellers FROM users WHERE role = "seller"');
    const [[{ total_customers }]] = await db.query('SELECT COUNT(*) as total_customers FROM users WHERE role = "customer"');
    const [[{ total_stores }]] = await db.query('SELECT COUNT(*) as total_stores FROM stores');
    const [[{ total_products }]] = await db.query('SELECT COUNT(*) as total_products FROM products');
    const [[{ total_orders }]] = await db.query('SELECT COUNT(*) as total_orders FROM orders');
    const [[{ total_revenue }]] = await db.query('SELECT SUM(total_amount) as total_revenue FROM orders WHERE status != "cancelled"');

    res.json({
      totalUsers: total_users || 0,
      pendingSellers: pending_sellers || 0,
      totalSellers: total_sellers || 0,
      totalCustomers: total_customers || 0,
      totalStores: total_stores || 0,
      totalProducts: total_products || 0,
      totalOrders: total_orders || 0,
      totalRevenue: total_revenue || 0
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy chỉ số Admin!', error: err.message });
  }
};

// Lấy danh sách người dùng (có hỗ trợ lọc theo role & status)
exports.getUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;

    let sql = `
      SELECT u.id, u.username, u.email, u.role, u.status, u.created_at,
             up.full_name, up.phone, up.city
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE 1=1
    `;
    const params = [];

    if (role && role !== 'all') {
      sql += ' AND u.role = ?';
      params.push(role);
    }

    if (status && status !== 'all') {
      sql += ' AND u.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (u.username LIKE ? OR u.email LIKE ? OR up.full_name LIKE ?)';
      const sParam = `%${search}%`;
      params.push(sParam, sParam, sParam);
    }

    sql += ' ORDER BY u.id DESC';
    const [users] = await db.query(sql, params);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách người dùng!', error: err.message });
  }
};

// Phê duyệt hoặc cập nhật trạng thái người dùng (active, pending, suspended)
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // active | pending | suspended

    if (!['active', 'pending', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ!' });
    }

    await db.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: `Đã cập nhật trạng thái tài khoản ID #${id} thành "${status}"!` });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái người dùng!', error: err.message });
  }
};

// Cập nhật vai trò người dùng (customer, seller, admin)
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // customer | seller | admin

    if (!['customer', 'seller', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Vai trò không hợp lệ!' });
    }

    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ success: true, message: `Đã cập nhật vai trò tài khoản ID #${id} thành "${role}"!` });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi cập nhật vai trò người dùng!', error: err.message });
  }
};

// Xóa người dùng
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (Number(id) === req.user.id) {
      return res.status(400).json({ message: 'Bạn không thể tự xóa tài khoản Admin đang đăng nhập!' });
    }

    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: `Đã xóa tài khoản ID #${id} thành công!` });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi xóa người dùng!', error: err.message });
  }
};
