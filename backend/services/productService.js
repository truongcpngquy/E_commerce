const db = require('../config/db');

function normalizeQuery(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function slugify(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

class ProductService {
  /**
   * Lấy danh sách sản phẩm với bộ lọc đa chiều & chuẩn 3NF Tag Filter
   */
  async getAllProducts(filters = {}) {
    const { category, brand, tag, search, sort = 'newest', min_price, max_price } = filters;
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 8);
    const offset = (page - 1) * limit;

    let baseWhere = ` WHERE p.status = 'active'`;
    const whereParams = [];

    if (category) {
      baseWhere += ' AND (p.category_id = ? OR c.parent_id = ?)';
      whereParams.push(category, category);
    }

    if (brand) {
      baseWhere += ' AND p.brand_id = ?';
      whereParams.push(brand);
    }

    if (min_price) {
      baseWhere += ' AND p.price >= ?';
      whereParams.push(Number(min_price));
    }

    if (max_price) {
      baseWhere += ' AND p.price <= ?';
      whereParams.push(Number(max_price));
    }

    if (search) {
      baseWhere += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)';
      const searchParam = `%${search}%`;
      whereParams.push(searchParam, searchParam, searchParam);
    }

    if (tag) {
      baseWhere += ` AND p.id IN (
        SELECT pt.product_id
        FROM product_tags pt
        JOIN tags t ON pt.tag_id = t.id
        WHERE t.name LIKE ? OR t.slug LIKE ?
      )`;
      const tagParam = `%${tag}%`;
      const tagSlugParam = `%${slugify(tag)}%`;
      whereParams.push(tagParam, tagSlugParam);
    }

    // 1. Đếm tổng số bản ghi thỏa điều kiện
    const countSql = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ${baseWhere}
    `;
    const [[countRow]] = await db.query(countSql, whereParams);
    const total = countRow ? Number(countRow.total) : 0;

    // 2. Truy vấn danh sách sản phẩm theo phân trang
    let query = `
      SELECT p.*,
             c.name as category_name, c.slug as category_slug,
             b.name as brand_name, b.logo_url as brand_logo,
             st.name as store_name, st.logo_url as store_logo, st.slug as store_slug, st.is_official as store_is_official,
             pm.views_count, pm.carts_count, pm.purchases_count,
             pm.rating_avg, pm.rating_count, pm.popularity_score
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN stores st ON p.store_id = st.id
      LEFT JOIN product_metrics pm ON p.id = pm.product_id
      ${baseWhere}
    `;
    const queryParams = [...whereParams];

    switch (sort) {
      case 'popularity':
        query += ' ORDER BY pm.popularity_score DESC, p.id DESC';
        break;
      case 'price_asc':
        query += ' ORDER BY p.price ASC';
        break;
      case 'price_desc':
        query += ' ORDER BY p.price DESC';
        break;
      case 'rating':
        query += ' ORDER BY pm.rating_avg DESC, pm.rating_count DESC';
        break;
      case 'newest':
      default:
        query += ' ORDER BY p.id DESC';
        break;
    }

    query += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [products] = await db.query(query, queryParams);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasMore: (page * limit) < total
      }
    };
  }

  /**
   * Lấy chi tiết 1 sản phẩm kèm thuộc tính EAV & thông tin Cửa Hàng
   */
  async getProductById(id) {
    const [products] = await db.query(
      `SELECT p.*,
              c.name as category_name, c.slug as category_slug,
              b.name as brand_name, b.logo_url as brand_logo,
              st.id as store_id, st.name as store_name, st.logo_url as store_logo, st.slug as store_slug,
              st.description as store_description, st.rating_avg as store_rating_avg,
              st.followers_count as store_followers_count, st.response_rate as store_response_rate,
              st.response_time as store_response_time, st.is_official as store_is_official,
              pm.views_count, pm.carts_count, pm.purchases_count,
              pm.rating_avg, pm.rating_count, pm.popularity_score
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN stores st ON p.store_id = st.id
       LEFT JOIN product_metrics pm ON p.id = pm.product_id
       WHERE p.id = ?`,
      [id]
    );

    if (products.length === 0) {
      const err = new Error('Không tìm thấy sản phẩm!');
      err.statusCode = 404;
      throw err;
    }

    const product = products[0];

    const [attributes] = await db.query(
      'SELECT attribute_key, attribute_value FROM product_attributes WHERE product_id = ?',
      [id]
    );
    product.attributes = attributes;

    const [tagRows] = await db.query(
      `SELECT t.name, t.slug, t.type FROM tags t JOIN product_tags pt ON t.id = pt.tag_id WHERE pt.product_id = ?`,
      [id]
    );
    product.tag_list = tagRows;

    // Tăng lượt xem ngầm
    db.query(
      `INSERT INTO product_metrics (product_id, views_count, popularity_score)
       VALUES (?, 1, 1.00)
       ON DUPLICATE KEY UPDATE
         views_count = views_count + 1,
         popularity_score = popularity_score + 1.00`,
      [id]
    ).catch(e => console.error('Lỗi tăng views_count:', e.message));

    return product;
  }

  /**
   * Lấy danh sách thẻ Tags phổ biến (phân loại theo Type: Style, Tech, Usage, Segment)
   */
  async getPopularTags() {
    const [tags] = await db.query(
      `SELECT id, name, slug, type, usage_count, is_trending
       FROM tags
       ORDER BY is_trending DESC, usage_count DESC, id ASC
       LIMIT 20`
    );
    return tags;
  }

  /**
   * Lấy danh mục 2 cấp
   */
  async getCategories() {
    const [categories] = await db.query(`
      SELECT c.*,
        (
          SELECT COUNT(*)
          FROM products p
          WHERE p.status = 'active'
            AND (p.category_id = c.id OR p.category_id IN (SELECT id FROM categories WHERE parent_id = c.id))
        ) as product_count
      FROM categories c
      ORDER BY c.level ASC, c.sort_order ASC, c.id ASC
    `);
    return categories;
  }

  /**
   * Lấy danh sách thương hiệu
   */
  async getBrands() {
    const [brands] = await db.query('SELECT * FROM brands ORDER BY name ASC');
    return brands;
  }

  /**
   * Smart Auto-complete Suggestions API
   */
  async searchSuggest(q) {
    if (!q || q.trim().length === 0) {
      return { suggestions: [], products: [] };
    }

    const searchTerm = `%${q.trim()}%`;

    const [products] = await db.query(
      `SELECT p.id, p.name, p.price, p.image_url, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.status = 'active' AND (p.name LIKE ? OR p.tags LIKE ?)
       LIMIT 5`,
      [searchTerm, searchTerm]
    );

    const [popularQueries] = await db.query(
      `SELECT query_text, COUNT(*) as cnt
       FROM search_logs
       WHERE query_text LIKE ?
       GROUP BY query_text
       ORDER BY cnt DESC
       LIMIT 5`,
      [searchTerm]
    );

    return {
      query: q,
      suggestions: popularQueries.map(i => i.query_text),
      products
    };
  }

  /**
   * Smart Search API & Tự động ghi log search_logs
   */
  async searchProducts(params = {}, userId = null) {
    const searchStr = params.q || params.search || params.query || '';
    const { category, brand, tag, min_price, max_price } = params;
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 8);
    const offset = (page - 1) * limit;

    if (!searchStr.trim() && !tag && !category && !brand) {
      return { products: [], pagination: { total: 0, page: 1, limit, totalPages: 1, hasMore: false } };
    }

    let baseWhere = ` WHERE p.status = 'active'`;
    const sqlParams = [];

    if (searchStr.trim()) {
      baseWhere += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)';
      const searchTerm = `%${searchStr.trim()}%`;
      sqlParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      baseWhere += ' AND (p.category_id = ? OR c.parent_id = ?)';
      sqlParams.push(category, category);
    }
    if (brand) {
      baseWhere += ' AND p.brand_id = ?';
      sqlParams.push(brand);
    }
    if (tag) {
      baseWhere += ` AND p.id IN (
        SELECT pt.product_id
        FROM product_tags pt
        JOIN tags t ON pt.tag_id = t.id
        WHERE t.name LIKE ? OR t.slug LIKE ?
      )`;
      const tagParam = `%${tag}%`;
      const tagSlugParam = `%${slugify(tag)}%`;
      sqlParams.push(tagParam, tagSlugParam);
    }

    // Đếm tổng số bản ghi
    const countSql = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ${baseWhere}
    `;
    const [[countRow]] = await db.query(countSql, sqlParams);
    const total = countRow ? Number(countRow.total) : 0;

    let query = `
      SELECT p.*,
             c.name as category_name,
             b.name as brand_name,
             pm.rating_avg, pm.rating_count, pm.popularity_score
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_metrics pm ON p.id = pm.product_id
      ${baseWhere}
      ORDER BY pm.popularity_score DESC LIMIT ? OFFSET ?
    `;
    const queryParams = [...sqlParams, limit, offset];
    const [products] = await db.query(query, queryParams);

    let fallbackProducts = [];
    if (products.length === 0) {
      const [fProducts] = await db.query(`
        SELECT p.*,
               c.name as category_name,
               b.name as brand_name,
               pm.rating_avg, pm.rating_count, pm.popularity_score
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_metrics pm ON p.id = pm.product_id
        WHERE p.status = 'active'
        ORDER BY pm.popularity_score DESC, pm.purchases_count DESC
        LIMIT 8
      `);
      fallbackProducts = fProducts;
    }

    // Ghi nhật ký async vào search_logs & tăng search_count cho tags
    if (searchStr.trim()) {
      const normalized = normalizeQuery(searchStr);
      db.query(
        `INSERT INTO search_logs (user_id, session_id, query_text, normalized_query, filters_applied, results_count, clicked_product_id)
         VALUES (?, ?, ?, ?, ?, ?, NULL)`,
        [
          userId,
          `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          searchStr.trim(),
          normalized,
          JSON.stringify({ category, brand, tag }),
          total
        ]
      ).catch(e => console.error('Lỗi ghi search log:', e.message));

      db.query(
        `UPDATE tags SET search_count = search_count + 1 WHERE name LIKE ? OR slug LIKE ?`,
        [`%${searchStr.trim()}%`, `%${slugify(searchStr.trim())}%`]
      ).catch(e => console.error('Lỗi tăng tag search_count:', e.message));
    }

    return {
      products,
      fallbackProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasMore: (page * limit) < total
      }
    };
  }

  /**
   * Thêm sản phẩm mới kèm gán Tag chuẩn 3NF vào product_tags
   */
  async createProduct(sellerId, productData) {
    const { name, description, price, original_price, stock, image_url, category_id, brand_id, tags, attributes } = productData;

    if (!name || !price || !category_id) {
      const err = new Error('Vui lòng nhập tên, giá và chọn danh mục sản phẩm!');
      err.statusCode = 400;
      throw err;
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const sku = `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const origPrice = original_price || price;
      const discount = origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : 0;
      const tagsStr = Array.isArray(tags) ? tags.join(', ') : (tags || '');

      const [result] = await connection.query(
        `INSERT INTO products (seller_id, brand_id, category_id, sku, name, description, original_price, discount_percent, price, stock, image_url, tags, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [sellerId, brand_id || null, category_id, sku, name, description || '', origPrice, discount, price, stock || 0, image_url || '', tagsStr]
      );

      const productId = result.insertId;

      await connection.query(
        'INSERT INTO product_metrics (product_id, views_count, popularity_score) VALUES (?, 0, 0)',
        [productId]
      );

      // Thêm thuộc tính EAV
      if (attributes && Array.isArray(attributes) && attributes.length > 0) {
        const attrValues = attributes.map(a => [productId, a.key || a.attribute_key, a.value || a.attribute_value]);
        await connection.query(
          'INSERT INTO product_attributes (product_id, attribute_key, attribute_value) VALUES ?',
          [attrValues]
        );
      }

      // Xử lý chèn vào Bảng chuẩn tags & product_tags
      if (tagsStr) {
        const tagList = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
        for (const tagName of tagList) {
          const tagSlug = slugify(tagName);
          await connection.query(
            `INSERT INTO tags (name, slug, usage_count)
             VALUES (?, ?, 1)
             ON DUPLICATE KEY UPDATE usage_count = usage_count + 1`,
            [tagName, tagSlug]
          );
          const [tagRow] = await connection.query('SELECT id FROM tags WHERE slug = ?', [tagSlug]);
          if (tagRow.length > 0) {
            await connection.query(
              'INSERT IGNORE INTO product_tags (product_id, tag_id) VALUES (?, ?)',
              [productId, tagRow[0].id]
            );
          }
        }
      }

      await connection.commit();
      return { success: true, message: 'Thêm sản phẩm thành công!', productId };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

module.exports = new ProductService();
