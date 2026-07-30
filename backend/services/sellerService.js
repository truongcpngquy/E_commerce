const db = require('../config/db');

class SellerService {
  /**
   * Lấy danh sách sản phẩm do Seller quản lý
   */
  async getSellerProducts(sellerId) {
    const [products] = await db.query(
      `SELECT p.*, c.name as category_name, b.name as brand_name,
              pm.views_count, pm.carts_count, pm.purchases_count, pm.rating_avg, pm.rating_count
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN product_metrics pm ON p.id = pm.product_id
       WHERE p.seller_id = ? OR p.seller_id IS NULL
       ORDER BY p.id DESC`,
      [sellerId]
    );
    return products;
  }

  /**
   * Cập nhật thông tin sản phẩm của Seller
   */
  async updateSellerProduct(sellerId, productId, updateData) {
    const { name, description, price, original_price, stock, image_url, category_id, brand_id, tags } = updateData;

    const [products] = await db.query(
      'SELECT id FROM products WHERE id = ? AND (seller_id = ? OR seller_id IS NULL)',
      [productId, sellerId]
    );

    if (products.length === 0) {
      const err = new Error('Bạn không có quyền chỉnh sửa sản phẩm này!');
      err.statusCode = 403;
      throw err;
    }

    const origPrice = original_price || price;
    const discount = origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : 0;

    await db.query(
      `UPDATE products
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           price = COALESCE(?, price),
           original_price = COALESCE(?, original_price),
           discount_percent = ?,
           stock = COALESCE(?, stock),
           image_url = COALESCE(?, image_url),
           category_id = COALESCE(?, category_id),
           brand_id = COALESCE(?, brand_id),
           tags = COALESCE(?, tags)
       WHERE id = ?`,
      [name, description, price, origPrice, discount, stock, image_url, category_id, brand_id, tags, productId]
    );

    return { success: true, message: 'Cập nhật sản phẩm thành công!' };
  }

  /**
   * Lưu trữ / Ngừng bán sản phẩm
   */
  async deleteSellerProduct(sellerId, productId) {
    await db.query(
      "UPDATE products SET status = 'archived' WHERE id = ? AND (seller_id = ? OR seller_id IS NULL)",
      [productId, sellerId]
    );
    return { success: true, message: 'Đã lưu trữ sản phẩm!' };
  }

  /**
   * Báo cáo thống kê hiệu suất dành cho Seller
   */
  async getSellerAnalytics(sellerId) {
    const [[stats]] = await db.query(
      `SELECT
         COUNT(p.id) as total_products,
         COALESCE(SUM(pm.views_count), 0) as total_views,
         COALESCE(SUM(pm.carts_count), 0) as total_carts,
         COALESCE(SUM(pm.purchases_count), 0) as total_purchases,
         COALESCE(AVG(pm.rating_avg), 0) as avg_seller_rating
       FROM products p
       LEFT JOIN product_metrics pm ON p.id = pm.product_id
       WHERE p.seller_id = ? OR p.seller_id IS NULL`,
      [sellerId]
    );
    return stats;
  }
}

module.exports = new SellerService();
