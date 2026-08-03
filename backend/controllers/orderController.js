const db = require('../config/db');

// Đặt hàng từ giỏ hàng (Phân tách đơn hàng theo từng Gian Hàng / Shop - Sub-Order Architecture)
exports.createOrder = async (req, res) => {
  const userId = req.user.id;
  const { shipping_address, payment_method = 'cod', note = '' } = req.body;

  if (!shipping_address) {
    return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ giao hàng!' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Lấy thông tin giỏ hàng của user kèm thông tin store_id của sản phẩm
    const [cartItems] = await connection.query(
      `SELECT c.product_id, c.quantity, p.price, p.stock, p.name, COALESCE(p.store_id, 1) as store_id
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [userId]
    );

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng của bạn đang trống!' });
    }

    // 2. Kiểm tra tồn kho cho tất cả sản phẩm
    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        throw new Error(`Sản phẩm '${item.name}' không đủ số lượng trong kho!`);
      }
    }

    // 3. NÓI KHÔNG VỚI LỖI TRỘN ĐƠN HÀNG: Nhóm sản phẩm theo store_id (Mỗi Store 1 Đơn Hàng Riêng)
    const itemsByStore = {};
    for (const item of cartItems) {
      const sId = item.store_id;
      if (!itemsByStore[sId]) itemsByStore[sId] = [];
      itemsByStore[sId].push(item);
    }

    const createdOrderIds = [];
    let grandTotal = 0;
    const behaviorValues = [];

    // 4. Tạo từng Đơn Hàng Phân Nhóm theo Gian Hàng (Store Sub-Orders)
    for (const storeIdStr of Object.keys(itemsByStore)) {
      const storeId = Number(storeIdStr);
      const storeItems = itemsByStore[storeIdStr];

      // Tính tổng tiền đơn hàng của riêng Gian hàng này
      let storeTotalAmount = 0;
      storeItems.forEach(item => {
        storeTotalAmount += item.price * item.quantity;
      });
      grandTotal += storeTotalAmount;

      // Tạo record Đơn Hàng cho riêng Gian Hàng này
      const [orderResult] = await connection.query(
        'INSERT INTO orders (user_id, store_id, total_amount, shipping_address, payment_method, note, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, storeId, storeTotalAmount, shipping_address, payment_method, note, 'pending']
      );
      const orderId = orderResult.insertId;
      createdOrderIds.push(orderId);

      // Thêm chi tiết các sản phẩm thuộc đơn hàng này
      const orderItemsValues = [];
      for (const item of storeItems) {
        orderItemsValues.push([orderId, item.product_id, item.name, item.quantity, item.price]);

        // Trừ tồn kho sản phẩm
        const newStock = item.stock - item.quantity;
        await connection.query(
          'UPDATE products SET stock = ? WHERE id = ?',
          [newStock, item.product_id]
        );

        // Ghi vết tương tác mua hàng (weight = 5) cho AI Recommendation Engine
        behaviorValues.push([userId, item.product_id, 'purchase', 5]);
      }

      await connection.query(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES ?',
        [orderItemsValues]
      );
    }

    // Insert vết tương tác mua hàng
    if (behaviorValues.length > 0) {
      await connection.query(
        'INSERT INTO user_behavior_logs (user_id, product_id, action_type, weight) VALUES ?',
        [behaviorValues]
      );
    }

    // 5. Xóa sạch giỏ hàng của user
    await connection.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

    await connection.commit();
    res.status(201).json({
      message: 'Đặt hàng thành công!',
      orderIds: createdOrderIds,
      totalAmount: grandTotal
    });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ message: err.message || 'Lỗi khi đặt hàng!' });
  } finally {
    connection.release();
  }
};

// Lấy lịch sử đơn hàng của user (Có kèm tên shop và logo gian hàng)
exports.getOrders = async (req, res) => {
  const userId = req.user.id;

  try {
    const [orders] = await db.query(
      `SELECT o.*, COALESCE(s.name, 'Gian hàng Shopee') as store_name, s.logo_url as store_logo
       FROM orders o
       LEFT JOIN stores s ON o.store_id = s.id
       WHERE o.user_id = ?
       ORDER BY o.id DESC`,
      [userId]
    );

    // Lấy chi tiết của từng đơn hàng
    const ordersWithDetails = [];
    for (const order of orders) {
      const [items] = await db.query(
        `SELECT oi.id, oi.product_id, oi.quantity, oi.unit_price as price, COALESCE(oi.product_name, p.name) as name, p.image_url
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
