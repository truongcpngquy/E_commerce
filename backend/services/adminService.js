const db = require('../config/db');

class AdminService {
  /**
   * Lấy số liệu thống kê tổng quan hệ thống
   */
  async getStats() {
    const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
    const [sellerCount] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "seller"');
    const [customerCount] = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "customer"');
    const [storeCount] = await db.query('SELECT COUNT(*) as count FROM stores');
    const [productCount] = await db.query('SELECT COUNT(*) as count FROM products');
    const [orderCount] = await db.query('SELECT COUNT(*) as count FROM orders');
    const [revenueRes] = await db.query('SELECT SUM(total_amount) as total FROM orders WHERE status = "completed"');

    // Thống kê đơn hàng theo trạng thái
    const [orderStatusStats] = await db.query(
      'SELECT status, COUNT(*) as count, SUM(total_amount) as amount FROM orders GROUP BY status'
    );

    return {
      users: {
        total: userCount[0].count,
        sellers: sellerCount[0].count,
        customers: customerCount[0].count,
      },
      stores: storeCount[0].count,
      products: productCount[0].count,
      orders: {
        total: orderCount[0].count,
        completedRevenue: parseFloat(revenueRes[0].total || 0),
        statusStats: orderStatusStats,
      }
    };
  }

  /**
   * Quản lý người dùng: Lấy danh sách toàn bộ người dùng
   */
  async getUsers() {
    const [users] = await db.query(
      `SELECT u.id, u.username, u.email, u.role, u.status, u.created_at,
              up.full_name, up.phone, up.city, up.district
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       ORDER BY u.created_at DESC`
    );
    return users;
  }

  /**
   * Quản lý người dùng: Cập nhật vai trò người dùng (customer / seller / admin)
   */
  async updateUserRole(userId, newRole) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Cập nhật role chính trong bảng users
      await connection.query('UPDATE users SET role = ? WHERE id = ?', [newRole, userId]);

      // 2. Đồng bộ trong bảng trung gian user_roles
      // Lấy id của role mới
      const [roles] = await connection.query('SELECT id FROM roles WHERE name = ?', [newRole]);
      if (roles.length > 0) {
        const roleId = roles[0].id;
        // Xóa các role cũ
        await connection.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
        // Insert role mới
        await connection.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleId]);
      }

      // 3. Nếu là seller, tự động tạo Store mặc định nếu chưa có
      if (newRole === 'seller') {
        const [existingStore] = await connection.query('SELECT id FROM stores WHERE owner_id = ?', [userId]);
        if (existingStore.length === 0) {
          const [userRows] = await connection.query('SELECT username FROM users WHERE id = ?', [userId]);
          const username = userRows[0]?.username || `user_${userId}`;
          const storeName = `${username} Store`;
          const storeSlug = `${username.toLowerCase()}-store-${userId}`;

          await connection.query(
            `INSERT INTO stores (owner_id, name, slug, description, is_official, status)
             VALUES (?, ?, ?, ?, 0, 'active')`,
            [userId, storeName, storeSlug, `Gian hàng của người bán ${username}`]
          );
        }
      }

      await connection.commit();
      return { success: true, message: `Cập nhật vai trò của người dùng thành ${newRole} thành công!` };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Quản lý người dùng: Cập nhật trạng thái người dùng (active / suspended)
   */
  async updateUserStatus(userId, status) {
    await db.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
    return { success: true, message: `Cập nhật trạng thái người dùng thành ${status} thành công!` };
  }

  /**
   * Quản lý cửa hàng: Lấy danh sách toàn bộ cửa hàng
   */
  async getStores() {
    const [stores] = await db.query(
      `SELECT s.*, u.username as owner_username, u.email as owner_email
       FROM stores s
       JOIN users u ON s.owner_id = u.id
       ORDER BY s.created_at DESC`
    );
    return stores;
  }

  /**
   * Quản lý cửa hàng: Cập nhật trạng thái hoạt động của cửa hàng (active / suspended / pending)
   */
  async updateStoreStatus(storeId, status) {
    await db.query('UPDATE stores SET status = ? WHERE id = ?', [status, storeId]);
    return { success: true, message: `Cập nhật trạng thái cửa hàng thành ${status} thành công!` };
  }

  /**
   * Quản lý sản phẩm: Lấy danh sách sản phẩm trên hệ thống
   */
  async getProducts() {
    const [products] = await db.query(
      `SELECT p.id, p.name, p.price, p.original_price, p.stock, p.image_url, p.status, p.created_at,
              s.name as store_name, c.name as category_name
       FROM products p
       LEFT JOIN stores s ON p.store_id = s.id
       LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY p.created_at DESC`
    );
    return products;
  }

  /**
   * Quản lý sản phẩm: Khóa/Gỡ sản phẩm (Đổi status thành archived)
   */
  async archiveProduct(productId) {
    await db.query('UPDATE products SET status = "archived" WHERE id = ?', [productId]);
    return { success: true, message: 'Đã gỡ bỏ sản phẩm thành công!' };
  }

  /**
   * Quản lý đơn hàng: Lấy danh sách tất cả các đơn hàng hệ thống
   */
  async getOrders() {
    const [orders] = await db.query(
      `SELECT o.id, o.user_id, o.total_amount, o.status, o.payment_method, o.shipping_address, o.created_at,
              u.username as customer_username, up.full_name as customer_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       ORDER BY o.created_at DESC`
    );
    return orders;
  }

  /**
   * Quản lý đơn hàng: Cập nhật trạng thái đơn hàng (Admin can overwrite status)
   */
  async updateOrderStatus(orderId, status) {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    return { success: true, message: `Cập nhật trạng thái đơn hàng thành ${status} thành công!` };
  }
}

module.exports = new AdminService();
