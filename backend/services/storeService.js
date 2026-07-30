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

class StoreService {
  /**
   * Lấy danh sách Gian Hàng (Hỗ trợ lọc Shopee Mall / Official Stores)
   */
  async getAllStores(filters = {}) {
    const { is_official, limit = 20 } = filters;
    let sql = `
      SELECT s.*,
             COUNT(p.id) as total_products
      FROM stores s
      LEFT JOIN products p ON p.store_id = s.id AND p.status = 'active'
      WHERE s.status = 'active'
    `;
    const params = [];

    if (is_official !== undefined && is_official !== null && is_official !== '') {
      sql += ' AND s.is_official = ?';
      params.push(Number(is_official));
    }

    sql += ' GROUP BY s.id ORDER BY s.is_official DESC, s.rating_avg DESC, total_products DESC LIMIT ?';
    params.push(Number(limit));

    const [stores] = await db.query(sql, params);
    return stores;
  }

  /**
   * Lấy thông tin chi tiết Cửa hàng theo slug / id
   */
  async getStoreBySlug(slugOrId) {
    let sql = `
      SELECT s.*,
             COUNT(p.id) as total_products,
             COALESCE(AVG(pm.rating_avg), 5.0) as store_rating_avg
      FROM stores s
      LEFT JOIN products p ON p.store_id = s.id AND p.status = 'active'
      LEFT JOIN product_metrics pm ON p.id = pm.product_id
      WHERE (s.slug = ? OR s.id = ?)
      GROUP BY s.id
    `;
    const [stores] = await db.query(sql, [slugOrId, slugOrId]);

    if (stores.length === 0) {
      const err = new Error('Không tìm thấy Gian Hàng này!');
      err.statusCode = 404;
      throw err;
    }

    return stores[0];
  }

  /**
   * Lấy sản phẩm của Gian Hàng có phân trang & tìm kiếm nội bộ Shop
   */
  async getStoreProducts(storeId, filters = {}) {
    const { search, category, sort = 'newest' } = filters;
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 8);
    const offset = (page - 1) * limit;

    let baseWhere = ` WHERE p.store_id = ? AND p.status = 'active'`;
    const whereParams = [storeId];

    if (search) {
      baseWhere += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)';
      const searchParam = `%${search}%`;
      whereParams.push(searchParam, searchParam, searchParam);
    }

    if (category) {
      baseWhere += ' AND (p.category_id = ? OR c.parent_id = ?)';
      whereParams.push(category, category);
    }

    // Đếm tổng số bản ghi
    const countSql = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${baseWhere}
    `;
    const [[countRow]] = await db.query(countSql, whereParams);
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
        query += ' ORDER BY pm.rating_avg DESC';
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
   * Đăng ký Cửa hàng mới cho Seller
   */
  async createStore(ownerId, storeData) {
    const { name, logo_url, banner_url, description, is_official = 0 } = storeData;
    if (!name) {
      const err = new Error('Vui lòng nhập tên Gian Hàng!');
      err.statusCode = 400;
      throw err;
    }

    const slug = slugify(name) + '-' + Math.floor(Math.random() * 1000);

    const [result] = await db.query(
      `INSERT INTO stores (owner_id, name, slug, logo_url, banner_url, description, is_official)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ownerId, name, slug, logo_url || '', banner_url || '', description || '', is_official ? 1 : 0]
    );

    return { id: result.insertId, name, slug };
  }

  /**
   * Cập nhật thông tin Gian Hàng
   */
  async updateStore(storeId, storeData) {
    const { name, logo_url, banner_url, description, is_official } = storeData;
    await db.query(
      `UPDATE stores
       SET name = COALESCE(?, name),
           logo_url = COALESCE(?, logo_url),
           banner_url = COALESCE(?, banner_url),
           description = COALESCE(?, description),
           is_official = COALESCE(?, is_official)
       WHERE id = ?`,
      [name, logo_url, banner_url, description, is_official, storeId]
    );
    return this.getStoreBySlug(storeId);
  }
}

module.exports = new StoreService();
