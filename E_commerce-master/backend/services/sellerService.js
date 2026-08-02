const db = require('../config/db');

class SellerService {
  /**
   * Lấy danh sách tất cả các Cửa Hàng (Stores) do Seller sở hữu (Quan hệ 1-Nhiều)
   */
  async getSellerStores(sellerId) {
    const [stores] = await db.query(
      'SELECT * FROM stores WHERE owner_id = ? ORDER BY id ASC',
      [sellerId]
    );

    if (stores.length === 0) {
      // Tự động tạo Store mặc định cho Seller mới
      const [userRows] = await db.query('SELECT username FROM users WHERE id = ?', [sellerId]);
      const username = userRows[0]?.username || `seller_${sellerId}`;
      const storeName = `Gian Hàng ${username}`;
      const slug = `store-${sellerId}-${Date.now()}`;

      const [result] = await db.query(
        `INSERT INTO stores (owner_id, name, slug, description, logo_url, banner_url, rating_avg, is_official)
         VALUES (?, ?, ?, ?, ?, ?, 5.00, 0)`,
        [
          sellerId,
          storeName,
          slug,
          `Chào mừng bạn đến với gian hàng chính thức của ${username} trên Shopee Recommendation App!`,
          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
          'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200'
        ]
      );

      const [newStore] = await db.query('SELECT * FROM stores WHERE id = ?', [result.insertId]);
      return newStore;
    }

    return stores;
  }

  /**
   * Tạo thêm Gian Hàng (Store) mới cho Seller
   */
  async createSellerStore(sellerId, storeData) {
    const { name, description, logo_url, banner_url } = storeData;
    if (!name || !name.trim()) {
      const err = new Error('Tên gian hàng không được để trống!');
      err.statusCode = 400;
      throw err;
    }

    const slug = `store-${sellerId}-${Date.now()}`;
    const [result] = await db.query(
      `INSERT INTO stores (owner_id, name, slug, description, logo_url, banner_url, rating_avg, is_official)
       VALUES (?, ?, ?, ?, ?, ?, 5.00, 0)`,
      [
        sellerId,
        name.trim(),
        slug,
        description || `Gian hàng ${name.trim()}`,
        logo_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
        banner_url || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200'
      ]
    );

    const [created] = await db.query('SELECT * FROM stores WHERE id = ?', [result.insertId]);
    return created[0];
  }

  /**
   * Cập nhật thông tin Gian Hàng của Seller
   */
  async updateSellerStore(sellerId, storeId, storeData) {
    const { name, description, logo_url, banner_url, is_official } = storeData;

    const [stores] = await db.query(
      'SELECT * FROM stores WHERE id = ? AND owner_id = ?',
      [storeId, sellerId]
    );

    if (stores.length === 0) {
      const err = new Error('Bạn không có quyền chỉnh sửa gian hàng này!');
      err.statusCode = 403;
      throw err;
    }

    await db.query(
      `UPDATE stores
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           logo_url = COALESCE(?, logo_url),
           banner_url = COALESCE(?, banner_url),
           is_official = COALESCE(?, is_official)
       WHERE id = ? AND owner_id = ?`,
      [name, description, logo_url, banner_url, is_official !== undefined ? is_official : stores[0].is_official, storeId, sellerId]
    );

    const [updated] = await db.query('SELECT * FROM stores WHERE id = ?', [storeId]);
    return updated[0];
  }

  /**
   * Lấy danh sách sản phẩm do Seller quản lý (Có thể lọc theo storeId cụ thể hoặc lấy tất cả cửa hàng của Seller)
   */
  async getSellerProducts(sellerId, storeId = null) {
    let sql = `
      SELECT p.*, s.name as store_name, s.slug as store_slug, c.name as category_name, b.name as brand_name,
             pm.views_count, pm.carts_count, pm.purchases_count, pm.rating_avg, pm.rating_count
      FROM products p
      JOIN stores s ON p.store_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_metrics pm ON p.id = pm.product_id
      WHERE s.owner_id = ?
    `;
    const params = [sellerId];

    if (storeId && storeId !== 'all') {
      sql += ' AND p.store_id = ?';
      params.push(Number(storeId));
    }

    sql += ' ORDER BY p.id DESC';
    const [products] = await db.query(sql, params);
    return products;
  }

  /**
   * Cập nhật thông tin sản phẩm của Seller
   */
  async updateSellerProduct(sellerId, productId, updateData) {
    const { store_id, name, description, price, original_price, stock, image_url, category_id, brand_id, tags, status } = updateData;

    const [products] = await db.query(
      `SELECT p.id FROM products p
       JOIN stores s ON p.store_id = s.id
       WHERE p.id = ? AND s.owner_id = ?`,
      [productId, sellerId]
    );

    if (products.length === 0) {
      const err = new Error('Bạn không có quyền chỉnh sửa sản phẩm này!');
      err.statusCode = 403;
      throw err;
    }

    const origPrice = original_price || price;
    const discount = (origPrice && price && origPrice > price) ? Math.round(((origPrice - price) / origPrice) * 100) : 0;

    await db.query(
      `UPDATE products
       SET store_id = COALESCE(?, store_id),
           name = COALESCE(?, name),
           description = COALESCE(?, description),
           price = COALESCE(?, price),
           original_price = COALESCE(?, original_price),
           discount_percent = ?,
           stock = COALESCE(?, stock),
           image_url = COALESCE(?, image_url),
           category_id = COALESCE(?, category_id),
           brand_id = COALESCE(?, brand_id),
           tags = COALESCE(?, tags),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [store_id || null, name, description, price, origPrice, discount, stock, image_url, category_id, brand_id, tags, status, productId]
    );

    return { success: true, message: 'Cập nhật sản phẩm thành công!' };
  }

  /**
   * Lưu trữ / Ngừng bán sản phẩm
   */
  async deleteSellerProduct(sellerId, productId) {
    await db.query(
      `UPDATE products p
       JOIN stores s ON p.store_id = s.id
       SET p.status = 'archived'
       WHERE p.id = ? AND s.owner_id = ?`,
      [productId, sellerId]
    );
    return { success: true, message: 'Đã lưu trữ sản phẩm thành công!' };
  }

  /**
   * Báo cáo thống kê hiệu suất dành cho Seller (Lọc theo storeId hoặc gom tất cả stores)
   */
  async getSellerAnalytics(sellerId, storeId = null) {
    let sql = `
      SELECT
         COUNT(p.id) as total_products,
         COALESCE(SUM(pm.views_count), 0) as total_views,
         COALESCE(SUM(pm.carts_count), 0) as total_carts,
         COALESCE(SUM(pm.purchases_count), 0) as total_purchases,
         COALESCE(AVG(pm.rating_avg), 5.0) as avg_seller_rating,
         COALESCE(SUM(p.price * pm.purchases_count), 0) as total_revenue
       FROM products p
       JOIN stores s ON p.store_id = s.id
       LEFT JOIN product_metrics pm ON p.id = pm.product_id
       WHERE s.owner_id = ?
    `;
    const params = [sellerId];

    if (storeId && storeId !== 'all') {
      sql += ' AND p.store_id = ?';
      params.push(Number(storeId));
    }

    const [[stats]] = await db.query(sql, params);
    return stats;
  }

  /**
   * Lấy danh sách đơn hàng có chứa sản phẩm thuộc Gian Hàng của Seller
   */
  async getSellerOrders(sellerId, storeId = null) {
    let whereSql = ' WHERE s.owner_id = ?';
    const params = [sellerId];

    if (storeId && storeId !== 'all') {
      whereSql += ' AND p.store_id = ?';
      params.push(Number(storeId));
    }

    const [orders] = await db.query(
      `SELECT DISTINCT o.*, u.username as customer_name, up.phone as customer_phone
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       JOIN stores s ON p.store_id = s.id
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       ${whereSql}
       ORDER BY o.id DESC`,
      params
    );

    const ordersWithItems = [];
    for (const order of orders) {
      let itemSql = `
        SELECT oi.id, oi.product_id, oi.product_name, oi.quantity, oi.unit_price as price, p.image_url, s.name as store_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN stores s ON p.store_id = s.id
        WHERE oi.order_id = ? AND s.owner_id = ?
      `;
      const itemParams = [order.id, sellerId];

      if (storeId && storeId !== 'all') {
        itemSql += ' AND p.store_id = ?';
        itemParams.push(Number(storeId));
      }

      const [items] = await db.query(itemSql, itemParams);
      ordersWithItems.push({
        ...order,
        items
      });
    }

    return ordersWithItems;
  }

  /**
   * Cập nhật trạng thái đơn hàng của Seller
   */
  async updateSellerOrderStatus(sellerId, orderId, status) {
    await db.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );
    return { success: true, message: `Đã cập nhật đơn hàng #${orderId} sang trạng thái '${status}'` };
  }
}

module.exports = new SellerService();
