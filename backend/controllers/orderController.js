const db = require('../config/db');

// Đặt hàng từ giỏ hàng
exports.createOrder = async (req, res) => {
  const userId = req.user.id;
  const { shipping_address } = req.body;

  if (!shipping_address) {
    return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ giao hàng!' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Lấy thông tin giỏ hàng của user
    const [cartItems] = await connection.query(
      `SELECT c.product_id, c.quantity, p.price, p.stock, p.name
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [userId]
    );

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng của bạn đang trống!' });
    }

    // 2. Kiểm tra tồn kho cho tất cả sản phẩm
    let totalAmount = 0;
    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        throw new Error(`Sản phẩm '${item.name}' không đủ số lượng trong kho!`);
      }
      totalAmount += item.price * item.quantity;
    }

    // 3. Tạo đơn hàng (Order)
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_amount, shipping_address, status) VALUES (?, ?, ?, ?)',
      [userId, totalAmount, shipping_address, 'pending']
    );
    const orderId = orderResult.insertId;

    // 4. Tạo chi tiết đơn hàng (Order Items) & Cập nhật tồn kho (Stock) & Lưu vết tương tác (Purchase)
    const orderItemsValues = [];
    const interactionValues = [];

    for (const item of cartItems) {
      // Chi tiết đơn hàng
      orderItemsValues.push([orderId, item.product_id, item.quantity, item.price]);

      // Trừ tồn kho sản phẩm
      const newStock = item.stock - item.quantity;
      await connection.query(
        'UPDATE products SET stock = ? WHERE id = ?',
        [newStock, item.product_id]
      );

      // Lưu vết tương tác: Mua hàng (weight = 5)
      interactionValues.push([userId, item.product_id, 'purchase', 5]);
    }

    // Insert chi tiết đơn hàng
    await connection.query(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?',
      [orderItemsValues]
    );

    // Insert vết tương tác mua hàng phục vụ gợi ý
    await connection.query(
      'INSERT INTO user_interactions (user_id, product_id, interaction_type, weight) VALUES ?',
      [interactionValues]
    );

    // 5. Xóa sạch giỏ hàng của user
    await connection.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

    await connection.commit();
    res.status(201).json({
      message: 'Đặt hàng thành công!',
      orderId: orderId,
      totalAmount: totalAmount
    });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ message: err.message || 'Lỗi khi đặt hàng!' });
  } finally {
    connection.release();
  }
};

// Lấy lịch sử đơn hàng của user
exports.getOrders = async (req, res) => {
  const userId = req.user.id;

  try {
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );

    // Lấy chi tiết của từng đơn hàng
    const ordersWithDetails = [];
    for (const order of orders) {
      const [items] = await db.query(
        `SELECT oi.id, oi.product_id, oi.quantity, oi.price, p.name, p.image_url
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      ordersWithDetails.push({
        ...order,
        items: items
      });
    }

    res.json(ordersWithDetails);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server!', error: err.message });
  }
};
