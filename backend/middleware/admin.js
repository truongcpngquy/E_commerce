module.exports = function(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Không tìm thấy thông tin xác thực!' });
  }

  // Hỗ trợ kiểm tra cả user.role và user.roles
  const roles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.role];
  const isAdmin = roles.includes('admin') || req.user.role === 'admin';

  if (!isAdmin) {
    return res.status(403).json({ message: 'Quyền truy cập bị từ chối! Bạn không phải là Admin.' });
  }

  next();
};
