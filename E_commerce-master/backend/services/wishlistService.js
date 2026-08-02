const db = require('../config/db');

class WishlistService {
  /**
   * Lấy danh sách Wishlist của người dùng
   */
  async getWishlist(userId) {
    const [wishlistItems] = await db.query(
      `SELECT w.id as wishlist_id, w.created_at as added_at,
              p.*, c.name as category_name, b.name as brand_name,
              pm.rating_avg, pm.rating_count
       FROM user_wishlist w
       JOIN products p ON w.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN product_metrics pm ON p.id = pm.product_id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [userId]
    );
    return wishlistItems;
  }

  /**
   * Thêm sản phẩm vào Wishlist & Log tương tác AI
   */
  async addToWishlist(userId, productId) {
    const [existing] = await db.query(
      'SELECT id FROM user_wishlist WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (existing.length === 0) {
      await db.query(
        'INSERT INTO user_wishlist (user_id, product_id) VALUES (?, ?)',
        [userId, productId]
      );
    }

    db.query(
      `INSERT INTO user_behavior_logs (user_id, session_id, product_id, action_type, weight, dwell_seconds)
       VALUES (?, ?, ?, 'wishlist_add', 3, 0)`,
      [userId, `sess_${Date.now()}`, productId]
    ).catch(e => console.error('Lỗi lưu behavior log (wishlist_add):', e.message));

    db.query(
      `INSERT INTO product_metrics (product_id, wishlist_count, popularity_score)
       VALUES (?, 1, 3.00)
       ON DUPLICATE KEY UPDATE
         wishlist_count = wishlist_count + 1,
         popularity_score = popularity_score + 3.00`,
      [productId]
    ).catch(e => console.error('Lỗi cập nhật metrics:', e.message));

    return { success: true, message: 'Đã thêm sản phẩm vào danh sách yêu thích!' };
  }

  /**
   * Xóa khỏi Wishlist
   */
  async removeFromWishlist(userId, productId) {
    await db.query(
      'DELETE FROM user_wishlist WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
    return { success: true, message: 'Đã xóa khỏi danh sách yêu thích!' };
  }
}

module.exports = new WishlistService();
