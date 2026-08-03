const db = require('../config/db');

// Lấy danh sách sản phẩm (có hỗ trợ lọc theo danh mục, tìm kiếm và phân trang Lazy Loading)
exports.getAllProducts = async (req, res) => {
  const { category, search, limit = 20, offset = 0, paginated = false } = req.query;

  try {
    let query = `
      SELECT p.*, c.name as category_name, COALESCE(s.name, 'SmartTech Official Store') as store_name
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN stores s ON p.store_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'all') {
      query += ' AND p.category_id = ?';
      params.push(category);
    }

    if (search && search.trim()) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)';
      const searchParam = `%${search.trim()}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    // Đếm tổng số lượng sản phẩm để tính hasMore
    const countQuery = `
      SELECT COUNT(*) as total FROM products p 
      WHERE 1=1
      ${category && category !== 'all' ? 'AND p.category_id = ?' : ''}
      ${search && search.trim() ? 'AND (p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)' : ''}
    `;
    const countParams = [...params];

    const numLimit = Number(limit);
    const numOffset = Number(offset);

    query += ' ORDER BY p.id DESC LIMIT ? OFFSET ?';
    params.push(numLimit, numOffset);

    const [products] = await db.query(query, params);
    const [[countRow]] = await db.query(countQuery, countParams);

    const total = countRow ? countRow.total : 0;
    const page = req.query.page ? Math.max(1, Number(req.query.page)) : Math.floor(numOffset / numLimit) + 1;
    const totalPages = Math.ceil(total / numLimit) || 1;
    const hasMore = numOffset + products.length < total;

    if (paginated === 'true' || paginated === true || req.query.page) {
      return res.json({
        products,
        total,
        page,
        limit: numLimit,
        offset: numOffset,
        totalPages,
        hasMore
      });
    }

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

// Gợi ý tìm kiếm tự động (Auto-complete Live Suggestions)
exports.searchSuggest = async (req, res) => {
  const q = req.query.q || '';
  if (!q.trim()) {
    return res.json({ suggestions: [], products: [] });
  }

  const cleanQuery = q.trim();
  const searchStart = `${cleanQuery}%`;
  const searchContains = `%${cleanQuery}%`;

  try {
    const [products] = await db.query(
      `SELECT p.id, p.name, p.price, p.image_url, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE (p.name LIKE ? OR p.tags LIKE ? OR c.name LIKE ?)
       ORDER BY 
         CASE 
           WHEN p.name LIKE ? THEN 1
           WHEN p.name LIKE ? THEN 2
           WHEN c.name LIKE ? THEN 3
           ELSE 4
         END ASC, p.id DESC
       LIMIT 5`,
      [searchContains, searchContains, searchContains, searchStart, searchContains, searchContains]
    );

    const [catRows] = await db.query(
      `SELECT name FROM categories WHERE name LIKE ? LIMIT 3`,
      [searchContains]
    );

    const suggestions = catRows.map(c => c.name);

    res.json({
      query: cleanQuery,
      suggestions,
      products
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy gợi ý tìm kiếm!', error: err.message });
  }
};

// Thêm mới sản phẩm (Dành cho Seller)
exports.createProduct = async (req, res) => {
  const { name, description, price, original_price, stock, image_url, category_id, tags, store_id } = req.body;

  if (!name || !price || !category_id) {
    return res.status(400).json({ message: 'Vui lòng nhập tên, giá và danh mục sản phẩm!' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO products (store_id, name, description, price, original_price, stock, image_url, category_id, tags) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [store_id || 1, name, description, price, original_price || price, stock || 0, image_url, category_id, tags]
    );

    res.status(201).json({
      message: 'Thêm sản phẩm thành công!',
      productId: result.insertId
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server!', error: err.message });
  }
};

// Cập nhật sản phẩm (Dành cho Seller)
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, original_price, stock, image_url, category_id, tags, status, store_id } = req.body;

  if (!name || !price || !category_id) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tên, giá và danh mục sản phẩm!' });
  }

  try {
    await db.query(
      `UPDATE products 
       SET name = ?, description = ?, price = ?, original_price = ?, stock = ?, image_url = ?, category_id = ?, tags = ?, status = COALESCE(?, status), store_id = COALESCE(?, store_id)
       WHERE id = ?`,
      [name, description, price, original_price || price, stock || 0, image_url, category_id, tags, status, store_id, id]
    );

    res.json({ message: 'Cập nhật sản phẩm thành công!', id });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật sản phẩm!', error: err.message });
  }
};

// Xóa/lưu trữ sản phẩm
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('UPDATE products SET status = "archived" WHERE id = ?', [id]);
    res.json({ message: 'Đã ngừng bán sản phẩm thành công!', id });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi xóa sản phẩm!', error: err.message });
  }
};
