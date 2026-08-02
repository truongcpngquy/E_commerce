const db = require('../config/db');

class CartService {
  /**
   * Lấy danh sách sản phẩm trong giỏ hàng
   */
  async getCart(userId) {
    const [cartItems] = await db.query(
      `SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.image_url, p.stock
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?
       ORDER BY c.updated_at DESC`,
      [userId]
    );
    return cartItems;
  }

  /**
   * Thêm sản phẩm vào giỏ hàng & Tự động ghi vết behavior log cart_add
   */
  async addToCart(userId, productId, quantity = 1) {
    if (!productId) {
      const err = new Error('Thiếu ID sản phẩm!');
      err.statusCode = 400;
      throw err;
    }

    const [products] = await db.query('SELECT stock, name FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      const err = new Error('Sản phẩm không tồn tại!');
      err.statusCode = 404;
      throw err;
    }

    const stock = products[0].stock;
    if (stock < quantity) {
      const err = new Error('Số lượng sản phẩm trong kho không đủ!');
      err.statusCode = 400;
      throw err;
    }

    const [existing] = await db.query(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (existing.length > 0) {
      const newQty = existing[0].quantity + Number(quantity);
      if (stock < newQty) {
        const err = new Error('Tổng số lượng trong giỏ vượt quá tồn kho!');
        err.statusCode = 400;
        throw err;
      }
      await db.query(
        'UPDATE cart_items SET quantity = ? WHERE id = ?',
        [newQty, existing[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, productId, quantity]
      );
    }

    // Ghi vết tương tác cart_add (weight = 4)
    db.query(
      `INSERT INTO user_behavior_logs (user_id, session_id, product_id, action_type, weight, dwell_seconds)
       VALUES (?, ?, ?, 'cart_add', 4, 0)`,
      [userId, `sess_${Date.now()}`, productId]
    ).catch(e => console.error('Lỗi lưu behavior log (cart_add):', e.message));

    // Cập nhật product_metrics
    db.query(
      `INSERT INTO product_metrics (product_id, carts_count, popularity_score)
       VALUES (?, 1, 4.00)
       ON DUPLICATE KEY UPDATE
         carts_count = carts_count + 1,
         popularity_score = popularity_score + 4.00`,
      [productId]
    ).catch(e => console.error('Lỗi cập nhật metrics:', e.message));

    return { success: true, message: 'Đã thêm sản phẩm vào giỏ hàng thành công!' };
  }

  /**
   * Cập nhật số lượng sản phẩm trong giỏ
   */
  async updateQuantity(userId, productId, quantity) {
    if (!productId || quantity === undefined || quantity <= 0) {
      const err = new Error('Thông tin số lượng không hợp lệ!');
      err.statusCode = 400;
      throw err;
    }

    const [products] = await db.query('SELECT stock FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      const err = new Error('Sản phẩm không tồn tại!');
      err.statusCode = 404;
      throw err;
    }

    if (products[0].stock < quantity) {
      const err = new Error('Số lượng yêu cầu vượt quá tồn kho!');
      err.statusCode = 400;
      throw err;
    }

    await db.query(
      'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
      [quantity, userId, productId]
    );

    return { success: true, message: 'Cập nhật số lượng giỏ hàng thành công!' };
  }

  /**
   * Xóa sản phẩm khỏi giỏ hàng & Ghi log cart_remove
   */
  async removeFromCart(userId, productId) {
    await db.query(
      'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    db.query(
      `INSERT INTO user_behavior_logs (user_id, session_id, product_id, action_type, weight, dwell_seconds)
       VALUES (?, ?, ?, 'cart_remove', -2, 0)`,
      [userId, `sess_${Date.now()}`, productId]
    ).catch(e => console.error('Lỗi lưu behavior log (cart_remove):', e.message));

    return { success: true, message: 'Đã xóa sản phẩm khỏi giỏ hàng!' };
  }
}

module.exports = new CartService();
