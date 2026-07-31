const db = require('../config/db');

const { extractSearchTokens } = require('../utils/searchTokenizer');

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
      const cleanSearch = search.trim().toLowerCase();
      const searchParam = `%${cleanSearch}%`;
      // Nếu từ khóa tìm kiếm ngắn (<= 3 ký tự như "áo", "váy"), ưu tiên lọc theo Tên, Thẻ Tag hoặc Danh mục chuẩn
      if (cleanSearch.length <= 3) {
        baseWhere += ' AND (LOWER(p.name) COLLATE utf8mb4_bin LIKE ? OR LOWER(p.tags) COLLATE utf8mb4_bin LIKE ? OR LOWER(c.name) COLLATE utf8mb4_bin LIKE ?)';
        whereParams.push(searchParam, searchParam, searchParam);
      } else {
        baseWhere += ' AND (LOWER(p.name) COLLATE utf8mb4_bin LIKE ? OR LOWER(p.tags) COLLATE utf8mb4_bin LIKE ? OR LOWER(c.name) COLLATE utf8mb4_bin LIKE ? OR LOWER(p.description) COLLATE utf8mb4_bin LIKE ?)';
        whereParams.push(searchParam, searchParam, searchParam, searchParam);
      }
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

    // Xử lý thứ tự sắp xếp (Nếu có từ khóa tìm kiếm -> Ưu tiên tuyệt đối sản phẩm đúng Tên trước)
    if (search) {
      const cleanSearch = search.trim().toLowerCase();
      const searchExact = `${cleanSearch}%`;
      const searchContains = `%${cleanSearch}%`;
      query += ` ORDER BY 
        CASE 
          WHEN LOWER(p.name) COLLATE utf8mb4_bin LIKE ? THEN 1
          WHEN LOWER(p.name) COLLATE utf8mb4_bin LIKE ? THEN 2
          WHEN LOWER(c.name) COLLATE utf8mb4_bin LIKE ? THEN 3
          WHEN LOWER(p.tags) COLLATE utf8mb4_bin LIKE ? THEN 4
          ELSE 5 
        END ASC, pm.popularity_score DESC, p.id DESC`;
      queryParams.push(searchExact, searchContains, searchContains, searchContains);
    } else {
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
    }

    query += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [products] = await db.query(query, queryParams);

    // Nếu tìm kiếm cụm từ không có kết quả -> Tự động chuyển sang NLP Token Matching (Tách từ & Lọc từ dừng)
    if (products.length === 0 && search && search.trim().length > 0) {
      const { filteredTokens } = extractSearchTokens(search);

      if (filteredTokens.length > 0) {
        const tokenConditions = filteredTokens
          .map(() => `(LOWER(p.name) COLLATE utf8mb4_bin LIKE ? OR LOWER(p.tags) COLLATE utf8mb4_bin LIKE ? OR LOWER(c.name) COLLATE utf8mb4_bin LIKE ? OR LOWER(p.description) COLLATE utf8mb4_bin LIKE ?)`)
          .join(' OR ');

        const tokenScoreExpr = filteredTokens
          .map(() => `(IF(LOWER(p.name) COLLATE utf8mb4_bin LIKE ?, 10, 0) + IF(LOWER(c.name) COLLATE utf8mb4_bin LIKE ?, 5, 0) + IF(LOWER(p.tags) COLLATE utf8mb4_bin LIKE ?, 4, 0) + IF(LOWER(p.description) COLLATE utf8mb4_bin LIKE ?, 1, 0))`)
          .join(' + ');

        const tokenQueryParams = [];
        filteredTokens.forEach(t => {
          const tp = `%${t}%`;
          tokenQueryParams.push(tp, tp, tp, tp);
        });

        filteredTokens.forEach(t => {
          const tp = `%${t}%`;
          tokenQueryParams.push(tp, tp, tp, tp);
        });

        const fallbackSql = `
          SELECT p.*,
                 c.name as category_name, c.slug as category_slug,
                 b.name as brand_name, b.logo_url as brand_logo,
                 st.name as store_name, st.logo_url as store_logo, st.slug as store_slug, st.is_official as store_is_official,
                 pm.views_count, pm.carts_count, pm.purchases_count,
                 pm.rating_avg, pm.rating_count, pm.popularity_score,
                 (${tokenScoreExpr}) as token_match_score
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN brands b ON p.brand_id = b.id
          LEFT JOIN stores st ON p.store_id = st.id
          LEFT JOIN product_metrics pm ON p.id = pm.product_id
          WHERE p.status = 'active' AND (${tokenConditions})
          ORDER BY token_match_score DESC, pm.popularity_score DESC, p.id DESC
          LIMIT ? OFFSET ?
        `;

        tokenQueryParams.push(limit, offset);
        const [fallbackProducts] = await db.query(fallbackSql, tokenQueryParams);

        if (fallbackProducts.length > 0) {
          return {
            products: fallbackProducts,
            isFallback: true,
            searchTokens: filteredTokens,
            pagination: {
              total: fallbackProducts.length,
              page,
              limit,
              totalPages: Math.ceil(fallbackProducts.length / limit) || 1,
              hasMore: (page * limit) < fallbackProducts.length
            }
          };
        }
      }
    }

    return {
      products,
      isFallback: false,
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
   * Lấy danh sách Thẻ Tags theo Danh Mục (Category-aware Tag Cloud)
   */
  async getTagsByCategory(categoryId) {
    if (!categoryId) {
      return this.getPopularTags();
    }

    const [rows] = await db.query(
      `SELECT p.tags, t.name as tag_name, t.slug as tag_slug, t.type as tag_type
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN product_tags pt ON p.id = pt.product_id
       LEFT JOIN tags t ON pt.tag_id = t.id
       WHERE p.status = 'active' AND (p.category_id = ? OR c.parent_id = ?)`,
      [categoryId, categoryId]
    );

    const tagCounts = {};
    const tagDetails = {};

    rows.forEach(row => {
      if (row.tag_name) {
        const key = row.tag_name.toLowerCase().trim();
        tagCounts[key] = (tagCounts[key] || 0) + 1;
        tagDetails[key] = {
          name: row.tag_name,
          slug: row.tag_slug || key,
          type: row.tag_type || 'tech'
        };
      }
      if (row.tags) {
        const parts = row.tags.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        parts.forEach(p => {
          tagCounts[p] = (tagCounts[p] || 0) + 1;
          if (!tagDetails[p]) {
            tagDetails[p] = { name: p, slug: p, type: 'tech' };
          }
        });
      }
    });

    const result = Object.keys(tagCounts)
      .map(key => ({
        id: key,
        name: tagDetails[key].name,
        slug: tagDetails[key].slug,
        type: tagDetails[key].type,
        usage_count: tagCounts[key]
      }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 15);

    if (result.length === 0) {
      return this.getPopularTags();
    }

    return result;
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
   * Smart Auto-complete Suggestions API (NLP Tokenized & Binary Collation Priority)
   */
  async searchSuggest(q) {
    if (!q || q.trim().length === 0) {
      return { suggestions: [], products: [] };
    }

    const cleanQuery = q.trim().toLowerCase();
    const searchStart = `${cleanQuery}%`;
    const searchContains = `%${cleanQuery}%`;

    // 1. Tìm sản phẩm gợi ý khớp từ khóa với ưu tiên tuyệt đối Tên sản phẩm trước (utf8mb4_bin)
    let [products] = await db.query(
      `SELECT p.id, p.name, p.price, p.image_url, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.status = 'active' AND (
         LOWER(p.name) COLLATE utf8mb4_bin LIKE ? OR 
         LOWER(p.tags) COLLATE utf8mb4_bin LIKE ? OR 
         LOWER(c.name) COLLATE utf8mb4_bin LIKE ?
       )
       ORDER BY 
         CASE 
           WHEN LOWER(p.name) COLLATE utf8mb4_bin LIKE ? THEN 1
           WHEN LOWER(p.name) COLLATE utf8mb4_bin LIKE ? THEN 2
           WHEN LOWER(c.name) COLLATE utf8mb4_bin LIKE ? THEN 3
           WHEN LOWER(p.tags) COLLATE utf8mb4_bin LIKE ? THEN 4
           ELSE 5 
         END ASC, p.id DESC
       LIMIT 5`,
      [searchContains, searchContains, searchContains, searchStart, searchContains, searchContains, searchContains]
    );

    // 2. Nếu tìm cụm từ chính xác = 0 sản phẩm -> Kích hoạt NLP Token Fallback ngay trên Thanh Tìm Kiếm
    let isFallback = false;
    let tokens = [];
    if (products.length === 0) {
      const tokenRes = extractSearchTokens(cleanQuery);
      tokens = tokenRes.filteredTokens;
      if (tokens.length > 0) {
        const tokenConditions = tokens
          .map(() => `(LOWER(p.name) COLLATE utf8mb4_bin LIKE ? OR LOWER(p.tags) COLLATE utf8mb4_bin LIKE ? OR LOWER(c.name) COLLATE utf8mb4_bin LIKE ?)`)
          .join(' OR ');

        const tokenScoreExpr = tokens
          .map(() => `(IF(LOWER(p.name) COLLATE utf8mb4_bin LIKE ?, 10, 0) + IF(LOWER(c.name) COLLATE utf8mb4_bin LIKE ?, 5, 0) + IF(LOWER(p.tags) COLLATE utf8mb4_bin LIKE ?, 4, 0))`)
          .join(' + ');

        const tokenParams = [];
        tokens.forEach(t => { const tp = `%${t}%`; tokenParams.push(tp, tp, tp); });
        tokens.forEach(t => { const tp = `%${t}%`; tokenParams.push(tp, tp, tp); });

        const [fallbackProds] = await db.query(
          `SELECT p.id, p.name, p.price, p.image_url, c.name as category_name, (${tokenScoreExpr}) as score
           FROM products p
           LEFT JOIN categories c ON p.category_id = c.id
           WHERE p.status = 'active' AND (${tokenConditions})
           ORDER BY score DESC, p.id DESC
           LIMIT 5`,
          tokenParams
        );
        if (fallbackProds.length > 0) {
          products = fallbackProds;
          isFallback = true;
        }
      }
    }

    // 3. Lấy từ khóa xu hướng từ lịch sử search_logs
    const [popularQueries] = await db.query(
      `SELECT query_text, COUNT(*) as cnt
       FROM search_logs
       WHERE LOWER(query_text) COLLATE utf8mb4_bin LIKE ?
       GROUP BY query_text
       ORDER BY cnt DESC
       LIMIT 5`,
      [searchContains]
    );

    return {
      query: q,
      isFallback,
      tokens,
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
    const { store_id, name, description, price, original_price, stock, image_url, category_id, brand_id, tags, attributes } = productData;

    if (!name || !price || !category_id) {
      const err = new Error('Vui lòng nhập tên, giá và chọn danh mục sản phẩm!');
      err.statusCode = 400;
      throw err;
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      let targetStoreId = store_id;
      if (!targetStoreId) {
        const [stores] = await connection.query('SELECT id FROM stores WHERE owner_id = ? LIMIT 1', [sellerId]);
        if (stores.length > 0) {
          targetStoreId = stores[0].id;
        } else {
          // Tự động tạo Store mặc định nếu seller chưa có
          const [userRows] = await connection.query('SELECT username FROM users WHERE id = ?', [sellerId]);
          const username = userRows[0]?.username || `seller_${sellerId}`;
          const [newStoreRes] = await connection.query(
            `INSERT INTO stores (owner_id, name, slug, description, logo_url, banner_url) VALUES (?, ?, ?, ?, ?, ?)`,
            [sellerId, `Gian Hàng ${username}`, `store-${sellerId}-${Date.now()}`, 'Cửa hàng chính hãng', '', '']
          );
          targetStoreId = newStoreRes.insertId;
        }
      }

      const sku = `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const origPrice = original_price || price;
      const discount = origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : 0;
      const tagsStr = Array.isArray(tags) ? tags.join(', ') : (tags || '');

      const [result] = await connection.query(
        `INSERT INTO products (store_id, brand_id, category_id, sku, name, description, original_price, discount_percent, price, stock, image_url, tags, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [targetStoreId, brand_id || null, category_id, sku, name, description || '', origPrice, discount, price, stock || 0, image_url || '', tagsStr]
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

  /**
   * AI Dự đoán Danh mục dựa trên Tên sản phẩm (Category Prediction)
   */
  async predictCategoryByName(productName) {
    if (!productName || productName.trim().length === 0) {
      return { predictions: [] };
    }

    const { filteredTokens } = extractSearchTokens(productName);
    if (filteredTokens.length === 0) {
      return { predictions: [] };
    }

    const [allCategories] = await db.query('SELECT id, name, slug, parent_id, level FROM categories');

    const catScores = {};
    allCategories.forEach(c => { catScores[c.id] = 0; });

    filteredTokens.forEach(t => {
      allCategories.forEach(c => {
        if (c.name.toLowerCase().includes(t.toLowerCase())) {
          catScores[c.id] += 10;
        }
      });
    });

    const tokenConditions = filteredTokens
      .map(() => `(LOWER(p.name) COLLATE utf8mb4_bin LIKE ? OR LOWER(p.tags) COLLATE utf8mb4_bin LIKE ?)`)
      .join(' OR ');

    const queryParams = [];
    filteredTokens.forEach(t => {
      const tp = `%${t}%`;
      queryParams.push(tp, tp);
    });

    const [matchedProds] = await db.query(
      `SELECT p.category_id, COUNT(*) as cnt
       FROM products p
       WHERE p.status = 'active' AND (${tokenConditions})
       GROUP BY p.category_id`,
      queryParams
    );

    matchedProds.forEach(mp => {
      if (catScores[mp.category_id] !== undefined) {
        catScores[mp.category_id] += mp.cnt * 5;
      }
    });

    const rankedCategories = allCategories
      .map(c => ({
        ...c,
        score: catScores[c.id] || 0
      }))
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score);

    return {
      queryName: productName,
      predictions: rankedCategories.slice(0, 2)
    };
  }

  /**
   * Lấy danh sách sản phẩm thuộc quyền sở hữu của Seller (phân trang + lọc store)
   */
  async getSellerProducts(sellerId, filters = {}) {
    const { store_id, search } = filters;
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 10);
    const offset = (page - 1) * limit;

    const [sellerStores] = await db.query('SELECT id FROM stores WHERE owner_id = ?', [sellerId]);
    if (sellerStores.length === 0) {
      return { products: [], pagination: { total: 0, page: 1, limit, totalPages: 1, hasMore: false } };
    }

    const sellerStoreIds = sellerStores.map(s => s.id);
    let baseWhere = ' WHERE p.store_id IN (?)';
    const whereParams = [sellerStoreIds];

    if (store_id && store_id !== 'all') {
      baseWhere += ' AND p.store_id = ?';
      whereParams.push(store_id);
    }

    if (search) {
      baseWhere += ' AND (LOWER(p.name) COLLATE utf8mb4_bin LIKE ? OR LOWER(p.sku) LIKE ? OR LOWER(p.tags) COLLATE utf8mb4_bin LIKE ?)';
      const searchParam = `%${search.trim().toLowerCase()}%`;
      whereParams.push(searchParam, searchParam, searchParam);
    }

    const countSql = `SELECT COUNT(*) as total FROM products p ${baseWhere}`;
    const [[countRow]] = await db.query(countSql, whereParams);
    const total = countRow ? Number(countRow.total) : 0;

    const query = `
      SELECT p.*,
             c.name as category_name,
             b.name as brand_name,
             st.name as store_name, st.logo_url as store_logo
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN stores st ON p.store_id = st.id
      ${baseWhere}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `;

    const [products] = await db.query(query, [...whereParams, limit, offset]);

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
   * Cập nhật thông tin sản phẩm của Seller
   */
  async updateProduct(sellerId, productId, productData) {
    const { store_id, name, description, price, original_price, stock, image_url, category_id, brand_id, tags, status } = productData;

    const [prodCheck] = await db.query(
      `SELECT p.id, p.store_id FROM products p JOIN stores st ON p.store_id = st.id WHERE p.id = ? AND st.owner_id = ?`,
      [productId, sellerId]
    );

    if (prodCheck.length === 0) {
      const err = new Error('Bạn không có quyền chỉnh sửa sản phẩm này!');
      err.statusCode = 403;
      throw err;
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const origPrice = original_price || price;
      const discount = origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : 0;
      const tagsStr = Array.isArray(tags) ? tags.join(', ') : (tags || '');

      await connection.query(
        `UPDATE products
         SET store_id = IFNULL(?, store_id),
             category_id = ?,
             brand_id = ?,
             name = ?,
             description = ?,
             original_price = ?,
             discount_percent = ?,
             price = ?,
             stock = ?,
             image_url = ?,
             tags = ?,
             status = IFNULL(?, status)
         WHERE id = ?`,
        [store_id || prodCheck[0].store_id, category_id, brand_id || null, name, description || '', origPrice, discount, price, stock || 0, image_url || '', tagsStr, status || 'active', productId]
      );

      await connection.query('DELETE FROM product_tags WHERE product_id = ?', [productId]);
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
      return { success: true, message: 'Cập nhật sản phẩm thành công!' };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Xóa sản phẩm của Seller
   */
  async deleteProduct(sellerId, productId) {
    const [prodCheck] = await db.query(
      `SELECT p.id FROM products p JOIN stores st ON p.store_id = st.id WHERE p.id = ? AND st.owner_id = ?`,
      [productId, sellerId]
    );

    if (prodCheck.length === 0) {
      const err = new Error('Bạn không có quyền xóa sản phẩm này!');
      err.statusCode = 403;
      throw err;
    }

    await db.query('DELETE FROM product_tags WHERE product_id = ?', [productId]);
    await db.query('DELETE FROM product_attributes WHERE product_id = ?', [productId]);
    await db.query('DELETE FROM product_metrics WHERE product_id = ?', [productId]);
    await db.query('DELETE FROM products WHERE id = ?', [productId]);

    return { success: true, message: 'Xóa sản phẩm thành công!' };
  }
}

module.exports = new ProductService();
