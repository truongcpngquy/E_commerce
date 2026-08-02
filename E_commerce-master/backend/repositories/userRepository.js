const db = require('../config/db');

class UserRepository {
  /**
   * Tìm user theo ID
   */
  async findUserById(id) {
    const [users] = await db.query('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [id]);
    return users[0] || null;
  }

  /**
   * Tìm user theo Username
   */
  async findUserByUsername(username) {
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    return users[0] || null;
  }

  /**
   * Tìm user theo Email
   */
  async findUserByEmail(email) {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return users[0] || null;
  }

  /**
   * Lấy profile thông tin cá nhân
   */
  async findUserProfile(userId) {
    const [profiles] = await db.query(
      `SELECT u.id, u.username, u.email, u.role, u.created_at,
              p.full_name, p.gender, p.date_of_birth, p.phone, p.avatar_url, p.address, p.city, p.district, p.preferred_categories, p.price_sensitivity
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [userId]
    );
    return profiles[0] || null;
  }

  /**
   * Lấy lịch sử hành vi người dùng (User Behavior Logs) cho AI Recommendation Engine
   */
  async findUserBehaviorLogs(userId, limit = 50) {
    const [behaviorLogs] = await db.query(
      `SELECT product_id, weight, created_at
       FROM user_behavior_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit]
    );
    return behaviorLogs;
  }

  /**
   * Ghi vết tương tác hành vi người dùng (Implicit Feedback)
   */
  async insertBehaviorLog(userId, sessionId, productId, actionType, weight, dwellSeconds) {
    if (userId) {
      await db.query(
        `INSERT INTO user_behavior_logs (user_id, session_id, product_id, action_type, weight, dwell_seconds)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, sessionId, productId, actionType, weight, dwellSeconds]
      );
    }

    db.query(
      `INSERT INTO product_metrics (product_id, views_count, popularity_score)
       VALUES (?, 1, ?)
       ON DUPLICATE KEY UPDATE
         views_count = views_count + IF(? = 'product_view', 1, 0),
         popularity_score = popularity_score + ?`,
      [productId, weight, actionType, weight]
    ).catch(e => console.error('Lỗi cập nhật metrics:', e.message));

    return true;
  }
}

module.exports = new UserRepository();
