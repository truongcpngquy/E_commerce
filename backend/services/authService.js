const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

class AuthService {
  /**
   * Đăng ký người dùng mới & Khởi tạo Profile
   */
  async signupUser({ username, password, email, role, full_name, city }) {
    if (!username || !password || !email) {
      const err = new Error('Vui lòng điền đầy đủ username, email và password!');
      err.statusCode = 400;
      throw err;
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Kiểm tra xem username hoặc email đã tồn tại chưa
      const [existing] = await connection.query(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existing.length > 0) {
        const err = new Error('Username hoặc Email đã được sử dụng!');
        err.statusCode = 400;
        throw err;
      }

      // Mã hóa mật khẩu
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const userRole = role === 'seller' ? 'seller' : 'customer';

      // Insert vào bảng users
      const [userResult] = await connection.query(
        'INSERT INTO users (username, password, email, role, status) VALUES (?, ?, ?, ?, "active")',
        [username, passwordHash, email, userRole]
      );
      const userId = userResult.insertId;

      // Insert profile mặc định vào user_profiles
      const displayName = full_name || username;
      await connection.query(
        'INSERT INTO user_profiles (user_id, full_name, city, preferred_categories, price_sensitivity) VALUES (?, ?, ?, ?, ?)',
        [userId, displayName, city || 'Hà Nội', JSON.stringify([]), 'mid-range']
      );

      await connection.commit();

      return {
        userId,
        user: {
          id: userId,
          username,
          email,
          role: userRole,
          full_name: displayName
        }
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Đăng nhập người dùng & Tạo JWT token
   */
  async loginUser({ username, password }) {
    if (!username || !password) {
      const err = new Error('Vui lòng nhập đầy đủ username và mật khẩu!');
      err.statusCode = 400;
      throw err;
    }

    const [users] = await db.query(
      `SELECT u.id, u.username, u.password, u.email, u.role, u.status,
              up.full_name, up.gender, up.phone, up.avatar_url, up.city, up.preferred_categories, up.price_sensitivity
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.username = ? OR u.email = ?`,
      [username, username]
    );

    if (users.length === 0) {
      const err = new Error('Tài khoản không tồn tại!');
      err.statusCode = 400;
      throw err;
    }

    const user = users[0];

    if (user.status === 'suspended') {
      const err = new Error('Tài khoản của bạn đã bị khóa!');
      err.statusCode = 403;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error('Mật khẩu không chính xác!');
      err.statusCode = 400;
      throw err;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'shopee_clone_secret_key_12345',
      { expiresIn: '7d' }
    );

    let prefCats = [];
    try {
      prefCats = typeof user.preferred_categories === 'string'
        ? JSON.parse(user.preferred_categories)
        : (user.preferred_categories || []);
    } catch (e) {
      prefCats = [];
    }

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name || user.username,
        avatar_url: user.avatar_url,
        city: user.city,
        gender: user.gender,
        preferred_categories: prefCats,
        price_sensitivity: user.price_sensitivity
      }
    };
  }

  /**
   * Lấy thông tin user hiện tại qua userId
   */
  async getUserById(userId) {
    const [users] = await db.query(
      `SELECT u.id, u.username, u.email, u.role, u.status, u.created_at,
              up.full_name, up.gender, up.date_of_birth, up.phone, up.avatar_url,
              up.city, up.district, up.preferred_categories, up.price_sensitivity
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      const err = new Error('Không tìm thấy thông tin người dùng!');
      err.statusCode = 404;
      throw err;
    }

    const user = users[0];
    let prefCats = [];
    try {
      prefCats = typeof user.preferred_categories === 'string'
        ? JSON.parse(user.preferred_categories)
        : (user.preferred_categories || []);
    } catch (e) {
      prefCats = [];
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      full_name: user.full_name || user.username,
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      phone: user.phone,
      avatar_url: user.avatar_url,
      city: user.city,
      district: user.district,
      preferred_categories: prefCats,
      price_sensitivity: user.price_sensitivity
    };
  }

  /**
   * Refresh JWT token
   */
  refreshToken(userPayload) {
    return jwt.sign(
      { id: userPayload.id, username: userPayload.username, role: userPayload.role },
      process.env.JWT_SECRET || 'shopee_clone_secret_key_12345',
      { expiresIn: '7d' }
    );
  }
}

module.exports = new AuthService();
