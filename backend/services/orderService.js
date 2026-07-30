const db = require('../config/db');

class OrderService {
  /**
   * Đặt hàng từ giỏ hàng (Transaction)
   */
  async createOrder(userId, orderData) {
    const { shipping_address, payment_method = 'cod', note } = orderData;

    if (!shipping_address) {
      const err = new Error('Vui lòng cung cấp địa chỉ giao hàng!');
      err.statusCode = 400;
      throw err;
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Lấy thông tin giỏ hàng
      const [cartItems] = await connection.query(
        `SELECT c.product_id, c.quantity, p.price, p.stock, p.name
         FROM cart_items c
         JOIN products p ON c.product_id = p.id
         WHERE c.user_id = ?`,
        [userId]
      );

      if (cartItems.length === 0) {
        const err = new Error('Giỏ hàng của bạn đang trống!');
        err.statusCode = 400;
        throw err;
      }

      // 2. Kiểm tra tồn kho & tính tổng tiền
      let totalAmount = 0;
      for (const item of cartItems) {
        if (item.stock < item.quantity) {
          const err = new Error(`Sản phẩm '${item.name}' không đủ số lượng trong kho!`);
          err.statusCode = 400;
          throw err;
        }
        totalAmount += Number(item.price) * Number(item.quantity);
      }

      // 3. Tạo đơn hàng mới
      const [orderResult] = await connection.query(
        `INSERT INTO orders (user_id, total_amount, shipping_address, status, payment_method, note)
         VALUES (?, ?, ?, 'pending', ?, ?)`,
        [userId, totalAmount, shipping_address, payment_method, note || '']
      );
      const orderId = orderResult.insertId;

      // 4. Tạo chi tiết đơn hàng, trừ tồn kho & lưu vết tương tác purchase
      for (const item of cartItems) {
        await connection.query(
          `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, item.product_id, item.name, item.quantity, item.price]
        );

        const newStock = item.stock - item.quantity;
        await connection.query(
          'UPDATE products SET stock = ? WHERE id = ?',
          [newStock, item.product_id]
        );

        await connection.query(
          `INSERT INTO user_behavior_logs (user_id, session_id, product_id, action_type, weight, dwell_seconds)
           VALUES (?, ?, ?, 'purchase', 5, 0)`,
          [userId, `sess_${Date.now()}`, item.product_id]
        );

        await connection.query(
          `INSERT INTO product_metrics (product_id, purchases_count, popularity_score)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE
             purchases_count = purchases_count + VALUES(purchases_count),
             popularity_score = popularity_score + (VALUES(purchases_count) * 5.00)`,
          [item.product_id, item.quantity, item.quantity * 5]
        );
      }

      // 5. Dọn giỏ hàng
      await connection.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

      await connection.commit();

      return {
        success: true,
        message: 'Đặt hàng thành công!',
        orderId,
        totalAmount
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Lấy lịch sử đơn hàng của user
   */
  async getOrders(userId) {
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );

    const ordersWithItems = [];
    for (const order of orders) {
      const [items] = await db.query(
        `SELECT oi.id, oi.product_id, oi.product_name, oi.quantity, oi.unit_price as price, p.image_url
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      ordersWithItems.push({
        ...order,
        items
      });
    }

    return ordersWithItems;
  }

  /**
   * Lấy chi tiết 1 đơn hàng
   */
  async getOrderById(userId, orderId) {
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      const err = new Error('Không tìm thấy đơn hàng!');
      err.statusCode = 404;
      throw err;
    }

    const order = orders[0];
    const [items] = await db.query(
      `SELECT oi.id, oi.product_id, oi.product_name, oi.quantity, oi.unit_price as price, p.image_url
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    order.items = items;
    return order;
  }
}

module.exports = new OrderService();
