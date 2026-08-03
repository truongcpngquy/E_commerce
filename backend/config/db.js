const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'shopee_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Kiểm tra kết nối
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully!');

    // Khởi tạo bảng stores nếu chưa có
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255),
        description TEXT,
        logo_url TEXT,
        banner_url TEXT,
        rating_avg DECIMAL(3,2) DEFAULT 5.0,
        is_official TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Thêm cột store_id vào bảng products & orders nếu chưa có
    try {
      await connection.query(`ALTER TABLE products ADD COLUMN store_id INT DEFAULT 1`);
    } catch (e) {
      // Cột store_id đã tồn tại trong products
    }

    try {
      await connection.query(`ALTER TABLE orders ADD COLUMN store_id INT DEFAULT NULL`);
    } catch (e) {
      // Cột store_id đã tồn tại trong orders
    }

    // Seed gian hàng mặc định nếu bảng stores trống
    const [existingStores] = await connection.query('SELECT id FROM stores LIMIT 1');
    if (existingStores.length === 0) {
      const [sellers] = await connection.query('SELECT id FROM users WHERE role = "seller" OR role = "admin" LIMIT 2');
      const sellerId = sellers.length > 0 ? sellers[0].id : 1;

      await connection.query(`
        INSERT INTO stores (owner_id, name, slug, description, logo_url, banner_url, is_official) VALUES 
        (?, 'ASUS ROG Official Store', 'asus-rog-official', 'Gian hàng ủy quyền chính hãng ASUS ROG Việt Nam.', 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=200', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1000', 1),
        (?, 'SmartTech Official Store', 'smarttech-store', 'Chuyên thiết bị công nghệ & phụ kiện cao cấp.', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=200', 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=1000', 0)
      `, [sellerId, sellerId]);
      console.log('✅ Seeded default stores for Seller!');
    }

    connection.release();
  } catch (error) {
    console.error('Error connecting to the database:', error.message);
    console.log('Trying to connect to MySQL without specifying a database to create one...');
    try {
      const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
      });
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'shopee_db'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`Database '${process.env.DB_NAME || 'shopee_db'}' created or verified successfully!`);
      await conn.end();
    } catch (dbErr) {
      console.error('Failed to create database automatically:', dbErr.message);
    }
  }
}

testConnection();

module.exports = pool;
