const db = require('../config/db');

// Lấy danh sách sản phẩm (có hỗ trợ lọc theo danh mục, tìm kiếm và phân trang)
exports.getAllProducts = async (req, res) => {
  const { category, search, limit = 20, offset = 0 } = req.query;

  try {
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += ' AND p.category_id = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY p.id DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [products] = await db.query(query, params);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server!', error: err.message });
  }
};

// Lấy chi tiết sản phẩm
exports.getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const [products] = await db.query(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm!' });
    }

    res.json(products[0]);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server!', error: err.message });
  }
};

// Lấy tất cả categories
exports.getCategories = async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM categories');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server!', error: err.message });
  }
};

// Thêm mới sản phẩm (Dành cho Seller)
exports.createProduct = async (req, res) => {
  const { name, description, price, stock, image_url, category_id, tags } = req.body;

  if (!name || !price || !category_id) {
    return res.status(400).json({ message: 'Vui lòng nhập tên, giá và danh mục sản phẩm!' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO products (name, description, price, stock, image_url, category_id, tags) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description, price, stock || 0, image_url, category_id, tags]
    );

    res.status(201).json({
      message: 'Thêm sản phẩm thành công!',
      productId: result.insertId
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server!', error: err.message });
  }
};
