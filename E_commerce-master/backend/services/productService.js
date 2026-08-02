const db = require('../config/db');
const productRepository = require('../repositories/productRepository');
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

    // 1. Đếm tổng số bản ghi từ Repository
    const total = await productRepository.countProducts(baseWhere, whereParams);

    // 2. Sắp xếp thứ tự
    let queryWhere = baseWhere;
    const queryParams = [...whereParams];

    if (search) {
      const cleanSearch = search.trim().toLowerCase();
      const searchExact = `${cleanSearch}%`;
      const searchContains = `%${cleanSearch}%`;
      queryWhere += ` ORDER BY 
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
          queryWhere += ' ORDER BY pm.popularity_score DESC, p.id DESC';
          break;
        case 'price_asc':
          queryWhere += ' ORDER BY p.price ASC';
          break;
        case 'price_desc':
          queryWhere += ' ORDER BY p.price DESC';
          break;
        case 'rating':
          queryWhere += ' ORDER BY pm.rating_avg DESC, pm.rating_count DESC';
          break;
        case 'newest':
        default:
          queryWhere += ' ORDER BY p.id DESC';
          break;
      }
    }

    queryWhere += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const products = await productRepository.findProducts(queryWhere, queryParams);

    // 3. Nếu tìm kiếm cụm từ không có kết quả -> Tự động chuyển sang NLP Token Fallback từ Repository
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

        tokenQueryParams.push(limit, offset);
        const fallbackProducts = await productRepository.findProductsByTokens(tokenConditions, tokenScoreExpr, tokenQueryParams);

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
   * Lấy chi tiết sản phẩm
   */
  async getProductById(id) {
    const product = await productRepository.findProductById(id);
    if (!product) {
      const err = new Error('Sản phẩm không tồn tại!');
      err.statusCode = 404;
      throw err;
    }

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
   * Lấy danh sách thẻ Tags phổ biến
   */
  async getPopularTags() {
    return productRepository.findPopularTags(20);
  }

  /**
   * Lấy danh sách Thẻ Tags theo Danh Mục
   */
  async getTagsByCategory(categoryId) {
    if (!categoryId) {
      return this.getPopularTags();
    }

    const rows = await productRepository.findTagsByCategory(categoryId);
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
    return productRepository.findCategories();
  }

  /**
   * Lấy danh sách thương hiệu
   */
  async getBrands() {
    return productRepository.findBrands();
  }

  /**
   * Smart Auto-complete Suggestions API
   */
  async searchSuggest(q) {
    if (!q || q.trim().length === 0) {
      return { suggestions: [], products: [] };
    }

    const cleanQuery = q.trim().toLowerCase();
    const searchStart = `${cleanQuery}%`;
    const searchContains = `%${cleanQuery}%`;

    let products = await productRepository.findSearchSuggestProducts(searchContains, searchStart);

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
        tokenParams.push(5, 0);

        const fallbackProds = await productRepository.findProductsByTokens(tokenConditions, tokenScoreExpr, tokenParams);
        if (fallbackProds.length > 0) {
          products = fallbackProds;
          isFallback = true;
        }
      }
    }

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
   * Smart Search API & Log search_logs
   */
  async searchProducts(params = {}, userId = null) {
    const searchStr = params.q || params.search || params.query || '';
    const { category, brand, tag } = params;
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 8);

    const result = await this.getAllProducts({ search: searchStr, category, brand, tag, page, limit });

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
          result.pagination.total
        ]
      ).catch(e => console.error('Lỗi lưu search_logs:', e.message));
    }

    return result;
  }

  /**
   * Thêm sản phẩm mới cho Seller
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

      if (attributes && Array.isArray(attributes) && attributes.length > 0) {
        const attrValues = attributes.map(a => [productId, a.key || a.attribute_key, a.value || a.attribute_value]);
        await connection.query(
          'INSERT INTO product_attributes (product_id, attribute_key, attribute_value) VALUES ?',
          [attrValues]
        );
      }

      await productRepository.syncProductTags(connection, productId, tagsStr);

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
   * AI Dự đoán Danh mục dựa trên Tên sản phẩm
   */
  async predictCategoryByName(productName) {
    if (!productName || productName.trim().length === 0) {
      return { predictions: [] };
    }

    const { filteredTokens } = extractSearchTokens(productName);
    if (filteredTokens.length === 0) {
      return { predictions: [] };
    }

    const tokenConditions = filteredTokens
      .map(() => `(LOWER(p.name) COLLATE utf8mb4_bin LIKE ? OR LOWER(p.tags) COLLATE utf8mb4_bin LIKE ?)`)
      .join(' OR ');

    const queryParams = [];
    filteredTokens.forEach(t => {
      const tp = `%${t}%`;
      queryParams.push(tp, tp);
    });

    const { allCategories, matchedProds } = await productRepository.predictCategoriesByTokens(filteredTokens, tokenConditions, queryParams);

    const catScores = {};
    allCategories.forEach(c => { catScores[c.id] = 0; });

    filteredTokens.forEach(t => {
      allCategories.forEach(c => {
        if (c.name.toLowerCase().includes(t.toLowerCase())) {
          catScores[c.id] += 10;
        }
      });
    });

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
   * Lấy danh sách sản phẩm thuộc quyền sở hữu của Seller
   */
  async getSellerProducts(sellerId, filters = {}) {
    const [sellerStores] = await db.query('SELECT id FROM stores WHERE owner_id = ?', [sellerId]);
    if (sellerStores.length === 0) {
      return { products: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 1, hasMore: false } };
    }

    const sellerStoreIds = sellerStores.map(s => s.id);
    const { store_id, search } = filters;
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 10);
    const offset = (page - 1) * limit;

    const { products, total } = await productRepository.findSellerProducts(sellerStoreIds, store_id, search, limit, offset);

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
      await productRepository.syncProductTags(connection, productId, tagsStr);

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

    await productRepository.deleteProduct(productId);
    return { success: true, message: 'Xóa sản phẩm thành công!' };
  }
}

module.exports = new ProductService();
