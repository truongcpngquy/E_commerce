const db = require('../config/db');

class ReviewService {
  /**
   * Đánh giá sản phẩm chủ động (Explicit Feedback)
   */
  async createReview(userId, reviewData) {
    const { product_id, order_id, rating, comment, images } = reviewData;

    if (!product_id || !rating || rating < 1 || rating > 5) {
      const err = new Error('Vui lòng cung cấp ID sản phẩm và số sao đánh giá (1-5)!');
      err.statusCode = 400;
      throw err;
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const imagesJson = images ? JSON.stringify(images) : JSON.stringify([]);
      const sentimentScore = rating >= 4 ? 0.8 : (rating <= 2 ? -0.5 : 0.0);

      const [existing] = await connection.query(
        'SELECT id FROM product_reviews WHERE user_id = ? AND product_id = ?',
        [userId, product_id]
      );

      if (existing.length > 0) {
        await connection.query(
          `UPDATE product_reviews
           SET rating = ?, comment = ?, sentiment_score = ?, images = ?
           WHERE id = ?`,
          [rating, comment || '', sentimentScore, imagesJson, existing[0].id]
        );
      } else {
        await connection.query(
          `INSERT INTO product_reviews (user_id, product_id, order_id, rating, comment, sentiment_score, images)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, product_id, order_id || null, rating, comment || '', sentimentScore, imagesJson]
        );
      }

      const [[{ avgRating, countRating }]] = await connection.query(
        `SELECT AVG(rating) as avgRating, COUNT(*) as countRating
         FROM product_reviews
         WHERE product_id = ?`,
        [product_id]
      );

      await connection.query(
        `INSERT INTO product_metrics (product_id, rating_avg, rating_count, popularity_score)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           rating_avg = ?,
           rating_count = ?`,
        [product_id, avgRating, countRating, countRating * 2, avgRating, countRating]
      );

      await connection.commit();
      return { success: true, message: 'Đánh giá sản phẩm thành công!' };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Lấy danh sách đánh giá của sản phẩm
   */
  async getProductReviews(productId) {
    const [reviews] = await db.query(
      `SELECT r.*, u.username, up.full_name, up.avatar_url
       FROM product_reviews r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [productId]
    );
    return reviews;
  }
}

module.exports = new ReviewService();
