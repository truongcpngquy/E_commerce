const db = require('../config/db');
const storeRepository = require('../repositories/storeRepository');
const productRepository = require('../repositories/productRepository');

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
    let whereClause = " WHERE s.status = 'active'";
    const params = [];

    if (is_official !== undefined && is_official !== null && is_official !== '') {
      whereClause += ' AND s.is_official = ?';
      params.push(Number(is_official));
    }

    whereClause += ' ORDER BY s.is_official DESC, s.rating_avg DESC LIMIT ?';
    params.push(Number(limit));

    return storeRepository.findStores(whereClause, params);
  }

  /**
   * Lấy thông tin chi tiết Cửa hàng theo slug / id
   */
  async getStoreBySlug(slugOrId) {
    let store = await storeRepository.findStoreBySlug(slugOrId);
    if (!store) {
      store = await storeRepository.findStoreById(slugOrId);
    }

    if (!store) {
      const err = new Error('Không tìm thấy Gian Hàng này!');
      err.statusCode = 404;
      throw err;
    }

    return store;
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

    const total = await productRepository.countProducts(baseWhere, whereParams);

    let queryWhere = baseWhere;
    const queryParams = [...whereParams];

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
        queryWhere += ' ORDER BY pm.rating_avg DESC';
        break;
      case 'newest':
      default:
        queryWhere += ' ORDER BY p.id DESC';
        break;
    }

    queryWhere += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const products = await productRepository.findProducts(queryWhere, queryParams);

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
    const { name, logo_url, banner_url, description } = storeData;
    if (!name) {
      const err = new Error('Vui lòng nhập tên Gian Hàng!');
      err.statusCode = 400;
      throw err;
    }

    const slug = slugify(name) + '-' + Math.floor(Math.random() * 1000);
    const insertId = await storeRepository.createStore(ownerId, { name, slug, logo_url, banner_url, description });
    return { id: insertId, name, slug };
  }

  /**
   * Cập nhật thông tin Gian Hàng
   */
  async updateStore(storeId, ownerId, storeData) {
    await storeRepository.updateStore(storeId, ownerId, storeData);
    return this.getStoreBySlug(storeId);
  }
}

module.exports = new StoreService();
