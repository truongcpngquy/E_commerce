const authService = require('../services/authService');

exports.signup = async (req, res) => {
  try {
    const result = await authService.signupUser(req.body);
    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      ...result
    });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi server khi đăng ký!' });
  }
};

exports.login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);
    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      ...result
    });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi server khi đăng nhập!' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);
    res.json(user);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi server!' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const token = authService.refreshToken(req.user);
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi làm mới token!', error: err.message });
  }
};

exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Đăng xuất thành công!' });
};
