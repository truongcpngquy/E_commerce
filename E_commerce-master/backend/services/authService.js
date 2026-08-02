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

      // Tìm role_id trong bảng roles và chèn vào bảng trung gian user_roles
      const [roleRows] = await connection.query('SELECT id FROM roles WHERE name = ?', [userRole]);
      const roleId = roleRows.length > 0 ? roleRows[0].id : 1;
      await connection.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleId]);

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
          roles: [userRole],
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
      `SELECT u.id, u.username, u.password, u.email, u.role as primary_role, u.status,
              up.full_name, up.gender, up.phone, up.avatar_url, up.city, up.preferred_categories, up.price_sensitivity,
              GROUP_CONCAT(r.name) as user_roles_str
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.username = ? OR u.email = ?
       GROUP BY u.id`,
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

    const rolesList = user.user_roles_str ? user.user_roles_str.split(',') : [user.primary_role || 'customer'];
    const activeRole = rolesList[0] || user.primary_role || 'customer';

    const token = jwt.sign(
      { id: user.id, username: user.username, role: activeRole, roles: rolesList },
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
        role: activeRole,
        roles: rolesList,
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
      `SELECT u.id, u.username, u.email, u.role as primary_role, u.status, u.created_at,
              up.full_name, up.gender, up.date_of_birth, up.phone, up.avatar_url,
              up.city, up.district, up.preferred_categories, up.price_sensitivity,
              GROUP_CONCAT(r.name) as user_roles_str
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = ?
       GROUP BY u.id`,
      [userId]
    );

    if (users.length === 0) {
      const err = new Error('Không tìm thấy thông tin người dùng!');
      err.statusCode = 404;
      throw err;
    }

    const user = users[0];
    const rolesList = user.user_roles_str ? user.user_roles_str.split(',') : [user.primary_role || 'customer'];
    const activeRole = rolesList[0] || user.primary_role || 'customer';

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
      role: activeRole,
      roles: rolesList,
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
