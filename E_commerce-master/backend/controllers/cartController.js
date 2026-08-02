const cartService = require('../services/cartService');

exports.getCart = async (req, res) => {
  try {
    const cartItems = await cartService.getCart(req.user.id);
    res.json(cartItems);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi server!' });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const result = await cartService.addToCart(req.user.id, product_id, quantity);
    res.json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi server khi thêm vào giỏ!' });
  }
};

exports.updateQuantity = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const result = await cartService.updateQuantity(req.user.id, product_id, quantity);
    res.json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi server!' });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const result = await cartService.removeFromCart(req.user.id, req.params.product_id);
    res.json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi server!' });
  }
};
