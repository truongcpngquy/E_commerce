const db = require('../config/db');

class StoreRepository {
  /**
   * Lấy tất cả gian hàng
   */
  async findStores(whereClause = '', params = []) {
    const sql = `
      SELECT s.*, u.username as owner_name, u.email as owner_email,
        (SELECT COUNT(*) FROM products p WHERE p.store_id = s.id AND p.status = 'active') as active_products_count
      FROM stores s
      JOIN users u ON s.owner_id = u.id
      ${whereClause}
    `;
    const [stores] = await db.query(sql, params);
    return stores;
  }

  /**
   * Lấy gian hàng theo ID
   */
  async findStoreById(id) {
    const [stores] = await db.query(
      `SELECT s.*, u.username as owner_name, u.email as owner_email
       FROM stores s
       JOIN users u ON s.owner_id = u.id
       WHERE s.id = ?`,
      [id]
    );
    return stores[0] || null;
  }

  /**
   * Lấy gian hàng theo Slug
   */
  async findStoreBySlug(slug) {
    const [stores] = await db.query(
      `SELECT s.*, u.username as owner_name, u.email as owner_email
       FROM stores s
       JOIN users u ON s.owner_id = u.id
       WHERE s.slug = ?`,
      [slug]
    );
    return stores[0] || null;
  }

  /**
   * Lấy các gian hàng thuộc sở hữu của Seller
   */
  async findStoresByOwnerId(ownerId) {
    const [stores] = await db.query(
      `SELECT s.*,
         (SELECT COUNT(*) FROM products p WHERE p.store_id = s.id AND p.status = 'active') as active_products_count
       FROM stores s
       WHERE s.owner_id = ?
       ORDER BY s.id DESC`,
      [ownerId]
    );
    return stores;
  }

  /**
   * Tạo gian hàng mới
   */
  async createStore(ownerId, storeData) {
    const { name, slug, description, logo_url, banner_url } = storeData;
    const [result] = await db.query(
      `INSERT INTO stores (owner_id, name, slug, description, logo_url, banner_url, rating_avg, followers_count, response_rate, response_time, is_official)
       VALUES (?, ?, ?, ?, ?, ?, 5.00, 0, 100.00, 'Trong vài phút', 0)`,
      [
        ownerId,
        name,
        slug,
        description || '',
        logo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
        banner_url || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200'
      ]
    );
    return result.insertId;
  }

  /**
   * Cập nhật thông tin gian hàng
   */
  async updateStore(storeId, ownerId, storeData) {
    const { name, description, logo_url, banner_url, is_official } = storeData;
    await db.query(
      `UPDATE stores
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           logo_url = COALESCE(?, logo_url),
           banner_url = COALESCE(?, banner_url),
           is_official = COALESCE(?, is_official)
       WHERE id = ? AND owner_id = ?`,
      [name, description, logo_url, banner_url, is_official, storeId, ownerId]
    );
    return true;
  }
}

module.exports = new StoreRepository();
