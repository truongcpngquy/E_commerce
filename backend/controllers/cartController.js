const db = require('../config/db');

// Lấy danh sách sản phẩm trong giỏ hàng
exports.getCart = async (req, res) => {
  const userId = req.user.id;

  try {
    const [cartItems] = await db.query(
      `SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.image_url, p.stock
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [userId]
    );

    res.json(cartItems);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server!', error: err.message });
  }
};

// Thêm sản phẩm vào giỏ hàng
exports.addToCart = async (req, res) => {
  const userId = req.user.id;
  const { product_id, quantity = 1 } = req.body;

  if (!product_id) {
    return res.status(400).json({ message: 'Thiếu ID sản phẩm!' });
  }

  try {
    // Kiểm tra sản phẩm có tồn tại và còn hàng không
    const [products] = await db.query('SELECT stock FROM products WHERE id = ?', [product_id]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại!' });
    }

    const stock = products[0].stock;
    if (stock < quantity) {
      return res.status(400).json({ message: 'Số lượng sản phẩm trong kho không đủ!' });
    }

    // Thêm hoặc cập nhật số lượng trong giỏ hàng
    const [existing] = await db.query(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );

    if (existing.length > 0) {
      const newQty = existing[0].quantity + Number(quantity);
      if (stock < newQty) {
        return res.status(400).json({ message: 'Tổng số lượng trong giỏ vượt quá số lượng trong kho!' });
      }
      await db.query(
        'UPDATE cart_items SET quantity = ? WHERE id = ?',
        [newQty, existing[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, product_id, quantity]
      );
    }

    res.json({ message: 'Đã thêm vào giỏ hàng thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server!', error: err.message });
  }
};

// Cập nhật số lượng sản phẩm trong giỏ
exports.updateQuantity = async (req, res) => {
  const userId = req.user.id;
  const { product_id, quantity } = req.body;

  if (!product_id || quantity === undefined || quantity <= 0) {
    return res.status(400).json({ message: 'Thông tin không hợp lệ!' });
  }

  try {
    // Kiểm tra tồn kho
    const [products] = await db.query('SELECT stock FROM products WHERE id = ?', [product_id]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại!' });
    }

    if (products[0].stock < quantity) {
      return res.status(400).json({ message: 'Số lượng yêu cầu vượt quá tồn kho!' });
    }

    await db.query(
      'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
      [quantity, userId, product_id]
    );

    res.json({ message: 'Cập nhật số lượng thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server!', error: err.message });
  }
};

// Xóa sản phẩm khỏi giỏ hàng
exports.removeFromCart = async (req, res) => {
  const userId = req.user.id;
  const { product_id } = req.params;

  try {
    await db.query(
      'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );
    res.json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server!', error: err.message });
  }
};
