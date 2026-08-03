const db = require('../config/db');

// Lấy danh sách gian hàng nổi bật
exports.getStores = async (req, res) => {
  try {
    const [stores] = await db.query(`
      SELECT s.*, u.username as owner_username,
             (SELECT COUNT(*) FROM products p WHERE p.store_id = s.id AND p.status = 'active') as product_count
      FROM stores s
      LEFT JOIN users u ON s.owner_id = u.id
      ORDER BY s.is_official DESC, s.id ASC
    `);
    res.json(stores);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách gian hàng!', error: err.message });
  }
};

// Lấy chi tiết thông tin công khai của gian hàng theo ID
exports.getPublicStoreById = async (req, res) => {
  const { id } = req.params;

  try {
    const [stores] = await db.query(`
      SELECT s.*, u.username as owner_username, u.email as owner_email,
             (SELECT COUNT(*) FROM products p WHERE p.store_id = s.id AND p.status = 'active') as product_count,
             (SELECT COALESCE(AVG(pm.rating_avg), 4.9) 
              FROM products p 
              JOIN product_metrics pm ON p.id = pm.product_id 
              WHERE p.store_id = s.id) as calculated_rating
      FROM stores s
      LEFT JOIN users u ON s.owner_id = u.id
      WHERE s.id = ?
    `, [id]);

    if (stores.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy gian hàng!' });
    }

    const store = stores[0];
    store.rating_avg = Number(store.calculated_rating || store.rating_avg || 4.9).toFixed(1);
    store.followers_count = Math.floor(1250 + store.id * 840); // Giả lập lượt theo dõi sống động
    store.response_rate = '99%';
    store.join_date = '2 năm trước';

    res.json(store);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết gian hàng!', error: err.message });
  }
};

// Lấy sản phẩm thuộc gian hàng (hỗ trợ phân trang Lazy Loading & Lọc & Tìm kiếm nội bộ)
exports.getPublicStoreProducts = async (req, res) => {
  const { id } = req.params;
  const { category, q, sort = 'newest', limit = 8, offset = 0 } = req.query;

  try {
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.store_id = ? AND p.status = 'active'
    `;
    const params = [id];

    if (category && category !== 'all') {
      query += ' AND p.category_id = ?';
      params.push(category);
    }

    if (q && q.trim()) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)';
      const searchParam = `%${q.trim()}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    // Sắp xếp
    if (sort === 'price_asc') {
      query += ' ORDER BY p.price ASC';
    } else if (sort === 'price_desc') {
      query += ' ORDER BY p.price DESC';
    } else if (sort === 'popular') {
      query += ' ORDER BY p.discount_percent DESC, p.id DESC';
    } else {
      query += ' ORDER BY p.id DESC';
    }

    // Đếm tổng số sản phẩm thỏa điều kiện (phục vụ Lazy Loading / HasMore check)
    const countQuery = `
      SELECT COUNT(*) as total FROM products p 
      WHERE p.store_id = ? AND p.status = 'active'
      ${category && category !== 'all' ? 'AND p.category_id = ?' : ''}
      ${q && q.trim() ? 'AND (p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)' : ''}
    `;
    const countParams = [...params];

    // Thêm phân trang LIMIT & OFFSET
    const numLimit = Number(limit);
    const numOffset = Number(offset);
    query += ' LIMIT ? OFFSET ?';
    params.push(numLimit, numOffset);

    const [products] = await db.query(query, params);
    const [[countRow]] = await db.query(countQuery, countParams);

    const total = countRow ? countRow.total : 0;
    const hasMore = numOffset + products.length < total;

    res.json({
      products,
      total,
      limit: numLimit,
      offset: numOffset,
      hasMore
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi lấy sản phẩm gian hàng!', error: err.message });
  }
};
