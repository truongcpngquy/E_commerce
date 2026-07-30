const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
  // Lấy token từ header Authorization (dạng 'Bearer token_value')
  const authHeader = req.header('Authorization');
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // Nếu không có token
  if (!token) {
    return res.status(401).json({ message: 'Không có token, quyền truy cập bị từ chối!' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shopee_clone_secret_key_12345');
    req.user = decoded; // Lưu thông tin user đã giải mã vào req (gồm id, username, role)
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token không hợp lệ!' });
  }
};
