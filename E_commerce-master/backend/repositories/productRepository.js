const db = require('../config/db');

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

class ProductRepository {
  /**
   * Đếm tổng số sản phẩm thỏa mãn điều kiện
   */
  async countProducts(baseWhere, whereParams) {
    const countSql = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ${baseWhere}
    `;
    const [[countRow]] = await db.query(countSql, whereParams);
    return countRow ? Number(countRow.total) : 0;
  }

  /**
   * Lấy danh sách sản phẩm theo query & params
   */
  async findProducts(baseWhere, queryParams) {
    const query = `
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
    const [products] = await db.query(query, queryParams);
    return products;
  }

  /**
   * Truy vấn sản phẩm theo thuật toán NLP Token Fallback
   */
  async findProductsByTokens(tokenConditions, tokenScoreExpr, tokenQueryParams) {
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
    const [products] = await db.query(fallbackSql, tokenQueryParams);
    return products;
  }

  /**
   * Lấy chi tiết 1 sản phẩm kèm thuộc tính EAV & Tag List
   */
  async findProductById(id) {
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

    if (products.length === 0) return null;
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

    return product;
  }

  /**
   * Lấy danh sách sản phẩm phổ biến
   */
  async findPopularTags(limit = 20) {
    const [tags] = await db.query(
      `SELECT id, name, slug, type, usage_count, is_trending
       FROM tags
       ORDER BY is_trending DESC, usage_count DESC, id ASC
       LIMIT ?`,
      [limit]
    );
    return tags;
  }

  /**
   * Lấy tags thuộc danh mục cụ thể
   */
  async findTagsByCategory(categoryId) {
    const [rows] = await db.query(
      `SELECT p.tags, t.name as tag_name, t.slug as tag_slug, t.type as tag_type
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN product_tags pt ON p.id = pt.product_id
       LEFT JOIN tags t ON pt.tag_id = t.id
       WHERE p.status = 'active' AND (p.category_id = ? OR c.parent_id = ?)`,
      [categoryId, categoryId]
    );
    return rows;
  }

  /**
   * Lấy cây danh mục
   */
  async findCategories() {
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
   * Lấy thương hiệu
   */
  async findBrands() {
    const [brands] = await db.query('SELECT * FROM brands ORDER BY name ASC');
    return brands;
  }

  /**
   * Tìm kiếm gợi ý sản phẩm live
   */
  async findSearchSuggestProducts(searchContains, searchStart) {
    const [products] = await db.query(
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
    return products;
  }

  /**
   * AI Dự đoán danh mục theo tokens
   */
  async predictCategoriesByTokens(filteredTokens, tokenConditions, tokenQueryParams) {
    const [allCategories] = await db.query('SELECT id, name, slug, parent_id, level FROM categories');
    const [matchedProds] = await db.query(
      `SELECT p.category_id, COUNT(*) as cnt
       FROM products p
       WHERE p.status = 'active' AND (${tokenConditions})
       GROUP BY p.category_id`,
      tokenQueryParams
    );
    return { allCategories, matchedProds };
  }

  /**
   * Lấy sản phẩm của người bán
   */
  async findSellerProducts(sellerStoreIds, store_id, search, limit, offset) {
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
    return { products, total };
  }

  /**
   * Đồng bộ bảng junction product_tags
   */
  async syncProductTags(connection, productId, tagsStr) {
    if (!tagsStr) return;
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

  /**
   * Xóa sản phẩm
   */
  async deleteProduct(productId) {
    await db.query('DELETE FROM product_tags WHERE product_id = ?', [productId]);
    await db.query('DELETE FROM product_attributes WHERE product_id = ?', [productId]);
    await db.query('DELETE FROM product_metrics WHERE product_id = ?', [productId]);
    await db.query('DELETE FROM products WHERE id = ?', [productId]);
    return true;
  }
}

module.exports = new ProductRepository();
