const orderService = require('../services/orderService');

exports.createOrder = async (req, res) => {
  try {
    const result = await orderService.createOrder(req.user.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    const status = err.statusCode || 400;
    res.status(status).json({ message: err.message || 'Lỗi khi tiến hành đặt hàng!' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await orderService.getOrders(req.user.id);
    res.json(orders);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi server khi lấy lịch sử đơn hàng!' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.user.id, req.params.id);
    res.json(order);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Lỗi server!' });
  }
};
