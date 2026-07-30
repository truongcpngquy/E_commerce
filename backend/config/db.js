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
