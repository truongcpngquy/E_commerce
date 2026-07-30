const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    database: process.env.DB_NAME || 'shopee_db'
  });

  const [tables] = await connection.query('SHOW TABLES');
  console.log('Tables in shopee_db:');
  for (const t of tables) {
    const tableName = Object.values(t)[0];
    const [[{ cnt }]] = await connection.query(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
    console.log(` - ${tableName}: ${cnt} rows`);
  }
  await connection.end();
}

check().catch(console.error);
