const db = require('../config/db');
const recoEngine = require('../utils/recommendationEngine');

// Lưu vết tương tác người dùng (view, like, cart)
exports.trackInteraction = async (req, res) => {
  const userId = req.user.id;
  const { product_id, interaction_type } = req.body;

  if (!product_id || !interaction_type) {
    return res.status(400).json({ message: 'Thiếu ID sản phẩm hoặc loại tương tác!' });
  }

  // Phân bổ trọng số tương ứng
  const weights = {
    view: 1,
    like: 2,
    cart: 3,
    purchase: 5
  };

  const weight = weights[interaction_type] || 1;

  try {
    // Để tránh lưu quá nhiều tương tác lặp lại vô ích trong database mẫu,
    // ta kiểm tra xem user đã có tương tác tương tự trong ngày chưa
    const [existing] = await db.query(
      `SELECT id FROM user_interactions 
       WHERE user_id = ? AND product_id = ? AND interaction_type = ?
       LIMIT 1`,
      [userId, product_id, interaction_type]
    );

    if (existing.length === 0) {
      await db.query(
        'INSERT INTO user_interactions (user_id, product_id, interaction_type, weight) VALUES (?, ?, ?, ?)',
        [userId, product_id, interaction_type, weight]
      );
    }
    
    res.json({ message: 'Đã lưu vết tương tác thành công!' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lưu tương tác!', error: err.message });
  }
};

// Lấy gợi ý sản phẩm cá nhân hóa
exports.getPersonalized = async (req, res) => {
  const userId = req.user.id;
  const limit = req.query.limit ? Number(req.query.limit) : 6;

  try {
    // 1. Lấy tất cả sản phẩm trong database kèm theo tên danh mục
    const [allProducts] = await db.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id`
    );

    // 2. Lấy toàn bộ tương tác của user hiện tại
    const [interactions] = await db.query(
      `SELECT product_id, weight 
       FROM user_interactions 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    // 3. Chạy thuật toán gợi ý cá nhân hóa
    const recommendations = recoEngine.getPersonalizedRecommendations(
      interactions,
      allProducts,
      limit
    );

    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy gợi ý cá nhân hóa!', error: err.message });
  }
};

// Lấy danh sách sản phẩm tương tự
exports.getSimilar = async (req, res) => {
  const { productId } = req.params;
  const limit = req.query.limit ? Number(req.query.limit) : 5;

  try {
    // 1. Lấy tất cả sản phẩm trong database kèm tên danh mục
    const [allProducts] = await db.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id`
    );

    // 2. Chạy thuật toán gợi ý sản phẩm tương tự
    const similarProducts = recoEngine.getSimilarProducts(
      Number(productId),
      allProducts,
      limit
    );

    res.json(similarProducts);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy sản phẩm tương tự!', error: err.message });
  }
};
