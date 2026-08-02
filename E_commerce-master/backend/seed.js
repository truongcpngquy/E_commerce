/**
 * seed.js - Smart E-Commerce Database Seeder v4.0 (Merchant Stores & Multi-Store Enabled)
 * 
 * Script nạp dữ liệu mẫu nâng cấp quy mô lớn với thực thể Gian Hàng (Stores / Merchants):
 * - Khởi tạo 8+ Gian Hàng chính hãng Shopee Mall (Apple, Samsung, ASUS ROG, Logitech, Nike, Adidas, Xiaomi, AKKO)
 * - Gắn mỗi sản phẩm vào đúng Gian hàng tương ứng (store_id)
 * - Tự động nạp dữ liệu cho phân trang Backend, Multi-Tag, Auto-complete Search & AI Recommendation.
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const BEHAVIOR_WEIGHTS = {
  search_click: 2,
  product_view: 1,
  dwell_time_high: 2,
  wishlist_add: 3,
  cart_add: 4,
  cart_remove: -2,
  checkout_start: 4,
  purchase: 5,
  feed_view: 1,
  share: 3,
};

function normalizeQuery(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function runSeed() {
  console.log('\n🚀 [Smart E-Commerce Seeder v4.0] Starting Merchant Stores & Multi-Store Data Seed...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    multipleStatements: true,
  });

  try {
    const dbName = process.env.DB_NAME || 'shopee_db';
    console.log(`📦 Creating database [${dbName}]...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${dbName}\``);

    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log(`📜 Applying schema from [${schemaPath}]...`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const statements = schemaSql.split(';');
    for (const stmt of statements) {
      const cleanStmt = stmt.split('\n').filter(line => !line.trim().startsWith('--')).join('\n').trim();
      if (cleanStmt.length > 0) {
        await connection.query(cleanStmt);
      }
    }
    console.log('✅ Schema applied.\n');

    console.log('🧹 Cleaning old data...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    const tablesToTruncate = [
      'product_reviews', 'user_behavior_logs', 'search_logs',
      'user_wishlist', 'product_vectors', 'product_metrics',
      'product_attributes', 'order_items', 'orders', 'cart_items',
      'product_tags', 'tags', 'products', 'stores', 'categories', 'brands', 'user_contexts',
      'user_roles', 'roles', 'user_profiles', 'users',
    ];
    for (const tbl of tablesToTruncate) {
      await connection.query(`TRUNCATE TABLE \`${tbl}\``);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Old data cleared.\n');

    // 0. ROLES
    console.log('🛡️ Seeding Roles...');
    await connection.query(`
      INSERT INTO roles (id, name, description) VALUES
      (1, 'customer', 'Khách mua hàng trên hệ thống'),
      (2, 'seller', 'Người bán hàng quản lý gian hàng'),
      (3, 'admin', 'Quản trị viên toàn hệ thống')
    `);

    // 1. USERS & USER_ROLES
    console.log('👤 Seeding 20 Users & User_Roles mapping...');
    const salt = bcrypt.genSaltSync(10);
    const pw = bcrypt.hashSync('123456', salt);

    const usersData = [
      ['admin', pw, 'admin@smartshop.vn', 'admin'],
      ['seller1', pw, 'seller1@smartshop.vn', 'seller'],
      ['seller2', pw, 'seller2@smartshop.vn', 'seller'],
      ['seller3', pw, 'seller3@smartshop.vn', 'seller'],
      ['customer1', pw, 'customer1@gmail.com', 'customer'],
      ['customer2', pw, 'customer2@gmail.com', 'customer'],
      ['customer3', pw, 'customer3@gmail.com', 'customer'],
      ['customer4', pw, 'customer4@gmail.com', 'customer'],
      ['customer5', pw, 'customer5@gmail.com', 'customer'],
      ['customer6', pw, 'customer6@gmail.com', 'customer'],
      ['customer7', pw, 'customer7@gmail.com', 'customer'],
      ['customer8', pw, 'customer8@gmail.com', 'customer'],
      ['customer9', pw, 'customer9@gmail.com', 'customer'],
      ['customer10', pw, 'customer10@gmail.com', 'customer'],
      ['customer11', pw, 'customer11@gmail.com', 'customer'],
      ['customer12', pw, 'customer12@gmail.com', 'customer'],
      ['customer13', pw, 'customer13@gmail.com', 'customer'],
      ['customer14', pw, 'customer14@gmail.com', 'customer'],
      ['customer15', pw, 'customer15@gmail.com', 'customer'],
      ['customer16', pw, 'customer16@gmail.com', 'customer'],
    ];
    await connection.query('INSERT INTO users (username, password, email, role) VALUES ?', [usersData]);

    const [dbUsers] = await connection.query('SELECT id, username, role FROM users');
    const userMap = Object.fromEntries(dbUsers.map(u => [u.username, u.id]));
    const customerIds = dbUsers.filter(u => u.role === 'customer').map(u => u.id);

    // Gán bảng user_roles trung gian
    const roleIdMap = { customer: 1, seller: 2, admin: 3 };
    const userRolesData = dbUsers.map(u => [u.id, roleIdMap[u.role] || 1]);
    await connection.query('INSERT INTO user_roles (user_id, role_id) VALUES ?', [userRolesData]);
    console.log('✅ Roles & User_Roles seeded successfully.\n');

    // 2. USER PROFILES
    console.log('🪪 Seeding User Profiles...');
    const profilesData = [
      [userMap['customer1'], 'Nguyễn Văn An', 'male', '1995-03-15', '0901234567', 'Hà Nội', 'Đống Đa', JSON.stringify([1, 2]), 'mid-range'],
      [userMap['customer2'], 'Trần Thị Bích', 'female', '1998-07-22', '0912345678', 'TP.HCM', 'Quận 1', JSON.stringify([3, 4]), 'budget'],
      [userMap['customer3'], 'Lê Minh Cường', 'male', '1992-11-30', '0923456789', 'Đà Nẵng', 'Hải Châu', JSON.stringify([1, 5]), 'premium'],
      [userMap['customer4'], 'Phạm Thanh Duyên', 'female', '2000-01-10', '0934567890', 'Hà Nội', 'Cầu Giấy', JSON.stringify([4, 3]), 'budget'],
      [userMap['customer5'], 'Hoàng Gia Bảo', 'male', '1994-05-18', '0945678901', 'TP.HCM', 'Quận 7', JSON.stringify([1, 2]), 'premium'],
      [userMap['customer6'], 'Vũ Quỳnh Anh', 'female', '1997-09-25', '0956789012', 'Nha Trang', 'Lộc Thọ', JSON.stringify([2, 5]), 'mid-range'],
      [userMap['customer7'], 'Đặng Hoàng Nam', 'male', '1999-12-05', '0967890123', 'Hải Phòng', 'Nghô Quyền', JSON.stringify([1, 4]), 'budget'],
      [userMap['customer8'], 'Bùi Ngọc Trinh', 'female', '2001-04-14', '0978901234', 'Cần Thơ', 'Ninh Kiều', JSON.stringify([2, 3]), 'mid-range'],
    ];
    await connection.query(
      'INSERT INTO user_profiles (user_id,full_name,gender,date_of_birth,phone,city,district,preferred_categories,price_sensitivity) VALUES ?',
      [profilesData]
    );

    // 3. BRANDS
    console.log('🏷️  Seeding Brands...');
    const brandsData = [
      ['Apple', 'apple', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/200px-Apple_logo_black.svg.png', 'Hãng công nghệ hàng đầu thế giới', 'USA'],
      ['Samsung', 'samsung', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/200px-Samsung_Logo.svg.png', 'Tập đoàn điện tử đa quốc gia Hàn Quốc', 'South Korea'],
      ['Asus', 'asus', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/ASUS_Logo.svg/200px-ASUS_Logo.svg.png', 'Nhà sản xuất máy tính hàng đầu Đài Loan', 'Taiwan'],
      ['Dell', 'dell', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Dell_Logo.png/200px-Dell_Logo.png', 'Thương hiệu máy tính nổi tiếng Mỹ', 'USA'],
      ['Logitech', 'logitech', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Logitech_logo.svg/200px-Logitech_logo.svg.png', 'Hãng phụ kiện máy tính hàng đầu', 'Switzerland'],
      ['JBL', 'jbl', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/JBL_logo.svg/200px-JBL_logo.svg.png', 'Thương hiệu âm thanh chất lượng cao', 'USA'],
      ['Sony', 'sony', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/200px-Sony_logo.svg.png', 'Tập đoàn điện tử đa ngành Nhật Bản', 'Japan'],
      ['Nike', 'nike', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/200px-Logo_NIKE.svg.png', 'Thương hiệu thể thao hàng đầu thế giới', 'USA'],
      ['Adidas', 'adidas', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/200px-Adidas_Logo.svg.png', 'Thương hiệu thể thao Đức nổi tiếng', 'Germany'],
      ['Xiaomi', 'xiaomi', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Xiaomi_logo.svg/200px-Xiaomi_logo.svg.png', 'Hãng công nghệ Trung Quốc', 'China'],
      ['Philips', 'philips', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Philips_logo_new.svg/200px-Philips_logo_new.svg.png', 'Tập đoàn điện tử gia dụng Hà Lan', 'Netherlands'],
      ['AKKO', 'akko', 'https://cdn.shopify.com/s/files/1/0512/2312/6707/files/akkogamer_logo.png', 'Thương hiệu bàn phím cơ cao cấp', 'China'],
      ['Unbranded', 'unbranded', '', 'Hàng không nhãn hiệu', 'Vietnam'],
    ];
    await connection.query('INSERT INTO brands (name, slug, logo_url, description, country) VALUES ?', [brandsData]);

    const [dbBrands] = await connection.query('SELECT id, slug FROM brands');
    const brandMap = Object.fromEntries(dbBrands.map(b => [b.slug, b.id]));

    // 4. MERCHANT STORES (8 Official Stores)
    console.log('🏬 Seeding 8 Official Merchant Stores...');
    const storesData = [
      [userMap['seller2'], 'Apple Flagship Store', 'apple-official-store', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/200px-Apple_logo_black.svg.png', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200', 'Gian hàng ủy quyền chính hãng Apple Việt Nam (Shopee Mall). Cam kết 100% hàng chính hãng VN/A, bảo hành 12 tháng.', 4.95, 12500, 99.50, 'Trong 5 phút', 1],
      [userMap['seller1'], 'Samsung Official Store', 'samsung-official-store', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/200px-Samsung_Logo.svg.png', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=1200', 'Cửa hàng trực tuyến chính thức của Samsung Việt Nam. Chuyên smartphone Galaxy S, Z Flip, Galaxy Watch và phụ kiện cao cấp.', 4.92, 18200, 98.80, 'Trong vài phút', 1],
      [userMap['seller1'], 'ASUS ROG Official Store', 'asus-rog-official-store', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/ASUS_Logo.svg/200px-ASUS_Logo.svg.png', 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=1200', 'Thương hiệu máy tính chơi game số 1 thế giới. Chuyên Laptop Gaming ROG Strix, TUF A15, Zenbook OLED.', 4.88, 9400, 97.50, 'Trong 15 phút', 1],
      [userMap['seller2'], 'Logitech Gear Official', 'logitech-official-store', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Logitech_logo.svg/200px-Logitech_logo.svg.png', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=1200', 'Gian hàng phụ kiện Logitech chính hãng. Chuột MX Master 3S, G304, bàn phím không dây cao cấp.', 4.90, 15600, 99.00, 'Trong 10 phút', 1],
      [userMap['seller3'], 'Nike Official Store VN', 'nike-official-vietnam', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/200px-Logo_NIKE.svg.png', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200', 'Cửa hàng chính hãng Nike Việt Nam. Giày chạy bộ Air Max, đồ thể thao cao cấp chính hãng.', 4.89, 21000, 98.20, 'Trong 1 giờ', 1],
      [userMap['seller3'], 'Adidas Performance Store', 'adidas-official-store', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/200px-Adidas_Logo.svg.png', 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=1200', 'Gian hàng Adidas chính hãng. Giày Ultraboost, Samba, quần áo thể thao cao cấp.', 4.87, 17800, 97.90, 'Trong 30 phút', 1],
      [userMap['seller3'], 'Xiaomi Smart Home Store', 'xiaomi-official-store', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Xiaomi_logo.svg/200px-Xiaomi_logo.svg.png', 'https://images.unsplash.com/photo-1518314916301-469f3a131666?w=1200', 'Hệ sinh thái Xiaomi chính hãng. Robot hút bụi, vòng đeo tay thông minh Band 8, smartphone Xiaomi 14 Ultra.', 4.91, 14200, 98.50, 'Trong 5 phút', 1],
      [userMap['seller1'], 'AKKO Keyboard Official', 'akko-official-store', 'https://cdn.shopify.com/s/files/1/0512/2312/6707/files/akkogamer_logo.png', 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=1200', 'Bàn phím cơ AKKO chính hãng Việt Nam. Switch AKKO CS, keycap PBT xuyên sáng cao cấp.', 4.93, 8900, 99.10, 'Trong vài phút', 1],
    ];
    await connection.query(
      'INSERT INTO stores (owner_id, name, slug, logo_url, banner_url, description, rating_avg, followers_count, response_rate, response_time, is_official) VALUES ?',
      [storesData]
    );

    const [dbStores] = await connection.query('SELECT id, slug FROM stores');
    const storeMap = Object.fromEntries(dbStores.map(s => [s.slug, s.id]));
    console.log(`  ✅ 8 Official Merchant Stores inserted.`);

    // 5. CATEGORIES
    console.log('📂 Seeding Categories...');
    const rootCats = [
      [null, 'Điện tử & Công nghệ', 'dien-tu-cong-nghe', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300', 1],
      [null, 'Thời trang & Phụ kiện', 'thoi-trang-phu-kien', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300', 1],
      [null, 'Gia dụng & Nhà cửa', 'gia-dung-nha-cua', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300', 1],
      [null, 'Thể thao & Du lịch', 'the-thao-du-lich', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=300', 1],
      [null, 'Sức khỏe & Làm đẹp', 'suc-khoe-lam-dep', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300', 1],
    ];
    await connection.query('INSERT INTO categories (parent_id, name, slug, image_url, level) VALUES ?', [rootCats]);

    const [dbRootCats] = await connection.query("SELECT id, slug FROM categories WHERE level = 1");
    const rootCatMap = Object.fromEntries(dbRootCats.map(c => [c.slug, c.id]));

    const subCats = [
      [rootCatMap['dien-tu-cong-nghe'], 'Laptop & Máy tính', 'laptop-may-tinh', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200', 2],
      [rootCatMap['dien-tu-cong-nghe'], 'Điện thoại thông minh', 'dien-thoai', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200', 2],
      [rootCatMap['dien-tu-cong-nghe'], 'Phụ kiện máy tính', 'phu-kien-may-tinh', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=200', 2],
      [rootCatMap['dien-tu-cong-nghe'], 'Âm thanh & Tai nghe', 'am-thanh-tai-nghe', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200', 2],
      [rootCatMap['dien-tu-cong-nghe'], 'Đồng hồ thông minh', 'dong-ho-thong-minh', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200', 2],
      [rootCatMap['thoi-trang-phu-kien'], 'Thời trang Nam', 'thoi-trang-nam', 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=200', 2],
      [rootCatMap['thoi-trang-phu-kien'], 'Thời trang Nữ', 'thoi-trang-nu', 'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=200', 2],
      [rootCatMap['thoi-trang-phu-kien'], 'Giày dép Nam', 'giay-dep-nam', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200', 2],
      [rootCatMap['thoi-trang-phu-kien'], 'Giày dép Nữ', 'giay-dep-nu', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200', 2],
      [rootCatMap['gia-dung-nha-cua'], 'Thiết bị nhà bếp', 'thiet-bi-nha-bep', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200', 2],
      [rootCatMap['gia-dung-nha-cua'], 'Thiết bị làm sạch', 'thiet-bi-lam-sach', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200', 2],
      [rootCatMap['the-thao-du-lich'], 'Quần áo thể thao', 'quan-ao-the-thao', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200', 2],
      [rootCatMap['the-thao-du-lich'], 'Giày thể thao', 'giay-the-thao', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200', 2],
      [rootCatMap['suc-khoe-lam-dep'], 'Mỹ phẩm & Trang điểm', 'my-pham-trang-diem', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200', 2],
      [rootCatMap['suc-khoe-lam-dep'], 'Chăm sóc da SkinCare', 'cham-soc-da', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200', 2],
    ];
    await connection.query('INSERT INTO categories (parent_id, name, slug, image_url, level) VALUES ?', [subCats]);

    const [dbAllCats] = await connection.query('SELECT id, slug FROM categories');
    const catMap = Object.fromEntries(dbAllCats.map(c => [c.slug, c.id]));

    // 6. PRODUCTS WITH STORE LINKAGE
    console.log('📦 Seeding Products Linked to Merchant Stores...');

    const s1 = userMap['seller1'];
    const s2 = userMap['seller2'];
    const s3 = userMap['seller3'];

    const stApple = storeMap['apple-official-store'];
    const stSamsung = storeMap['samsung-official-store'];
    const stAsus = storeMap['asus-rog-official-store'];
    const stLogi = storeMap['logitech-official-store'];
    const stNike = storeMap['nike-official-vietnam'];
    const stAdidas = storeMap['adidas-official-store'];
    const stXiaomi = storeMap['xiaomi-official-store'];
    const stAkko = storeMap['akko-official-store'];

    const rawProducts = [
      // ── Smartwatches ──
      [
        s1, stSamsung, brandMap['samsung'], catMap['dong-ho-thong-minh'], 'SAMSUNG-GW6-44MM-BLK',
        'Đồng Hồ Thông Minh Samsung Galaxy Watch 6 44mm',
        'Smartwatch Super AMOLED 1.47 inch, đo nhịp tim, SpO2, ECG, giấc ngủ, 90+ bài tập thể thao, pin 40 giờ.',
        7990000, 13, 6990000, 30,
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
        'samsung watch, apple watch, smartwatch, đồng hồ thông minh, galaxy watch, apple watch alternative, ecg, nhịp tim, amoled, thể thao, wearable, android watch, ios watch',
        'active'
      ],
      [
        s2, stApple, brandMap['apple'], catMap['dong-ho-thong-minh'], 'APPLE-WATCH-S9-45',
        'Apple Watch Series 9 GPS 45mm Nhôm',
        'Đồng hồ thông minh chip S9 SiP màn sáng 2000 nits, cử chỉ Chạm hai lần (Double Tap), đo ECG, SpO2, phát hiện té ngã.',
        11490000, 8, 10490000, 20,
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600',
        'apple watch, samsung watch, smartwatch, đồng hồ thông minh, apple, series 9, galaxy watch alternative, double tap, ecg, thể thao, ios, android, wearable',
        'active'
      ],
      [
        s2, stApple, brandMap['apple'], catMap['dong-ho-thong-minh'], 'APPLE-WATCH-ULTRA-2',
        'Apple Watch Ultra 2 GPS + Cellular 49mm',
        'Đồng hồ thể thao chuyên nghiệp vỏ Titan siêu bền, chống nước 100m, màn Retina 3000 nits, GPS tần số kép chính xác.',
        21990000, 5, 20890000, 10,
        'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600',
        'apple watch, apple watch ultra, samsung watch, smartwatch, đồng hồ thông minh, titan, leo núi, lặn biển, gps kép, cao cấp, flagship',
        'active'
      ],
      [
        s3, stXiaomi, brandMap['xiaomi'], catMap['dong-ho-thong-minh'], 'XIAOMI-WATCH-2-PRO',
        'Vòng đeo tay Xiaomi Smart Band 8 Pro',
        'Vòng đeo tay thông minh màn AMOLED 1.74 inch 60Hz, GPS độc lập, 150+ chế độ thể thao, pin dùng 14 ngày liên tục.',
        1790000, 16, 1490000, 70,
        'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600',
        'smartwatch, apple watch, samsung watch, vòng đeo tay, xiaomi, band 8 pro, amoled, gps, pin 14 ngày, thể thao, giá rẻ, đồng hồ thông minh',
        'active'
      ],
      [
        s3, stSamsung, brandMap['samsung'], catMap['dong-ho-thong-minh'], 'SAMSUNG-FIT-3',
        'Vòng đeo tay thể thao Samsung Galaxy Fit3',
        'Vòng đeo tay theo dõi vận động màn hình AMOLED 1.6 inch, vỏ nhôm nguyên khối siêu nhẹ, pin 13 ngày.',
        1390000, 14, 1190000, 60,
        'https://images.unsplash.com/photo-1510017803434-a899398421b3?w=600',
        'samsung watch, apple watch, smartwatch, galaxy fit 3, vòng đeo tay, tập gym, nhịp tim, giá tốt, đồng hồ thông minh',
        'active'
      ],

      // ── Smartphones ──
      [
        s2, stApple, brandMap['apple'], catMap['dien-thoai'], 'APPLE-IP15-PRO-256',
        'iPhone 15 Pro 256GB Titan Đen',
        'iPhone 15 Pro chip A17 Pro, khung Titan cao cấp, camera 48MP zoom 5x, màn Super Retina XDR 120Hz, USB-C.',
        33990000, 5, 32290000, 30,
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600',
        'iphone, apple, samsung, galaxy s24 alternative, smartphone, điện thoại, 15 pro, titan, a17 pro, camera, 5x zoom, usb-c, flagship, ios, android',
        'active'
      ],
      [
        s2, stApple, brandMap['apple'], catMap['dien-thoai'], 'APPLE-IP15-PRO-MAX-512',
        'iPhone 15 Pro Max 512GB Titan Tự Nhiên',
        'Đỉnh cao smartphone Apple với ống kính tiềm vọng Zoom 5x quang học, viên pin lớn nhất dòng iPhone 15.',
        40990000, 6, 38500000, 20,
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600',
        'iphone, apple, 15 pro max, samsung alternative, titan tự nhiên, a17 pro, zoom 5x, flagship, điện thoại, ios, android',
        'active'
      ],
      [
        s1, stSamsung, brandMap['samsung'], catMap['dien-thoai'], 'SAMSUNG-S24U-256',
        'Samsung Galaxy S24 Ultra 256GB',
        'Flagship Android Snapdragon 8 Gen 3, tích hợp Galaxy AI, S Pen, camera 200MP zoom 10x, màn AMOLED 6.8 inch.',
        31990000, 10, 28790000, 25,
        'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600',
        'samsung, galaxy, s24 ultra, iphone alternative, apple alternative, iphone 15 pro max, s pen, ai, 200mp, android, ios, flagship, snapdragon, điện thoại',
        'active'
      ],
      [
        s1, stXiaomi, brandMap['xiaomi'], catMap['dien-thoai'], 'XIAOMI-14-ULTRA-512',
        'Xiaomi 14 Ultra 512GB Leica Camera',
        'Siêu phẩm nhiếp ảnh di động camera Leica Summilux cảm biến 1 inch, Snapdragon 8 Gen 3, pin 5000mAh sạc 90W.',
        28990000, 5, 27540000, 18,
        'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600',
        'xiaomi, 14 ultra, leica, camera, 1 inch sensor, snapdragon, android, nhiếp ảnh, iphone alternative, samsung alternative, smartphone',
        'active'
      ],
      [
        s2, stApple, brandMap['apple'], catMap['dien-thoai'], 'APPLE-IP13-128',
        'iPhone 13 128GB Chính Hãng VN/A',
        'Smartphone quốc dân Apple A15 Bionic, màn OLED Super Retina XDR 6.1 inch, camera kép 12MP quay Cinematic.',
        16990000, 12, 14950000, 50,
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600',
        'iphone, apple, iphone 13, samsung alternative, giá rẻ, vna, cinematic, oled, a15 bionic, điện thoại, ios',
        'active'
      ],
      [
        s3, stSamsung, brandMap['samsung'], catMap['dien-thoai'], 'SAMSUNG-A55-5G',
        'Samsung Galaxy A55 5G 8GB/128GB',
        'Điện thoại tầm trung bán chạy nhất, thiết kế viền kim loại sang trọng, camera 50MP OIS, chống nước chuẩn IP67.',
        9990000, 15, 8490000, 40,
        'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600',
        'samsung, galaxy a55, 5g, tầm trung, ip67, chống nước, 50mp, giá tốt, iphone alternative, android',
        'active'
      ],
      [
        s3, stXiaomi, brandMap['xiaomi'], catMap['dien-thoai'], 'XIAOMI-NOTE-13-PRO',
        'Redmi Note 13 Pro 5G 8GB/256GB',
        'Smartphone tầm trung cấu hình vô địch Snapdragon 7s Gen 2, camera 200MP, màn AMOLED 1.5K 120Hz sạc 67W.',
        7490000, 10, 6740000, 60,
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600',
        'xiaomi, redmi note 13, 200mp, 5g, amoled 120hz, sạc nhanh, cấu hình ngon, điện thoại, android',
        'active'
      ],
      [
        s1, stSamsung, brandMap['samsung'], catMap['dien-thoai'], 'SAMSUNG-Z-FLIP-5',
        'Samsung Galaxy Z Flip5 256GB Kem',
        'Điện thoại gập thời trang màn hình ngoài Flex Window 3.4 inch độc đáo, thiết kế gấp gọn trong lòng bàn tay.',
        22990000, 20, 18390000, 15,
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600',
        'samsung, z flip 5, màn hình gập, thời trang, flex window, nữ tính, iphone alternative, flagship',
        'active'
      ],

      // ── Laptops ──
      [
        s1, stAsus, brandMap['asus'], catMap['laptop-may-tinh'], 'ASUS-TUF-A15-2024',
        'Laptop ASUS TUF Gaming A15 2024',
        'Laptop gaming hiệu năng cao AMD Ryzen 7 7745HX, RAM 16GB DDR5, RTX 4060 8GB, 15.6 inch 144Hz FHD, SSD 512GB.',
        22990000, 8, 21150000, 15,
        'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600',
        'laptop, asus, tuf, gaming, macbook alternative, dell alternative, ryzen 7, rtx 4060, 144hz, máy tính xách tay, amd, windows',
        'active'
      ],
      [
        s1, stAsus, brandMap['dell'], catMap['laptop-may-tinh'], 'DELL-XPS-13-9315',
        'Laptop Dell XPS 13 9315 Ultra Slim',
        'Dòng máy mỏng nhẹ nhất của Dell, vỏ nhôm CNC, Intel Core i5-1230U, RAM 8GB LPDDR5, SSD 512GB, 13.4 inch FHD+.',
        27500000, 11, 24500000, 10,
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600',
        'laptop, dell, xps, macbook alternative, mỏng nhẹ, doanh nhân, văn phòng, intel, i5, cao cấp, windows, macOS',
        'active'
      ],
      [
        s2, stApple, brandMap['apple'], catMap['laptop-may-tinh'], 'APPLE-MBA-M2-2023',
        'MacBook Air M2 2023 - 8GB/256GB',
        'MacBook Air chip Apple M2, mỏng nhẹ không quạt yên tĩnh, pin 18 giờ, màn hình Liquid Retina 13.6 inch, nhẹ 1.24kg.',
        28990000, 7, 26990000, 20,
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
        'laptop, macbook, apple, dell xps alternative, m2, mỏng nhẹ, sang trọng, pin trâu, macOS, windows',
        'active'
      ],
      [
        s2, stApple, brandMap['apple'], catMap['laptop-may-tinh'], 'APPLE-MBP-M3-14',
        'MacBook Pro 14 inch M3 Pro 18GB/512GB',
        'Laptop chuyên nghiệp cho đồ họa, chip M3 Pro 11-core CPU, 14-core GPU, màn Liquid Retina XDR 120Hz ProMotion.',
        49990000, 5, 47490000, 8,
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600',
        'laptop, macbook pro, apple, m3 pro, đồ họa, render, xdr, 120hz, cao cấp, dell workstation alternative',
        'active'
      ],

      // ── Phụ kiện & Bàn phím ──
      [
        s1, stAkko, brandMap['akko'], catMap['phu-kien-may-tinh'], 'AKKO-3098B-CS-OCEAN',
        'Bàn phím cơ AKKO 3098B Ocean Blue',
        'Bàn phím cơ không dây layout 98 phím, 3 chế độ kết nối Bluetooth/2.4G/Type-C, switch AKKO CS Ocean Blue, PBT.',
        2190000, 11, 1950000, 45,
        'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600',
        'bàn phím, bàn phím cơ, akko, logitech alternative, không dây, bluetooth, hotswap, gaming, mechanic, phụ kiện máy tính',
        'active'
      ],
      [
        s1, stLogi, brandMap['logitech'], catMap['phu-kien-may-tinh'], 'LOGI-G304-WHITE',
        'Chuột gaming Logitech G304 LightSpeed',
        'Chuột gaming không dây cảm biến HERO 12.000 DPI, kết nối LightSpeed < 1ms, pin AAA 250 giờ, siêu nhẹ 99g.',
        890000, 11, 790000, 80,
        'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600',
        'chuột, chuột gaming, logitech, g304, razer alternative, không dây, lightspeed, fps, phụ kiện máy tính',
        'active'
      ],
      [
        s2, stLogi, brandMap['logitech'], catMap['phu-kien-may-tinh'], 'LOGI-MX-MASTER-3S',
        'Chuột cao cấp Logitech MX Master 3S',
        'Chuột đồ họa & văn phòng đỉnh cao, con cuộn MagSpeed cuộn 1000 dòng/s, cảm biến 8000 DPI lướt mọi bề mặt.',
        2490000, 8, 2290000, 35,
        'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600',
        'chuột, logitech, mx master 3s, văn phòng, đồ họa, magspeed, cao cấp, apple magic mouse alternative',
        'active'
      ],

      // ── Âm thanh ──
      [
        s2, stLogi, brandMap['sony'], catMap['am-thanh-tai-nghe'], 'SONY-WH1000XM5-BLK',
        'Tai nghe chống ồn Sony WH-1000XM5',
        'Vua chống ồn không dây, 8 mic QN1e ANC đỉnh cao, âm thanh Hi-Res 30mm, kết nối Multipoint, pin 30 giờ.',
        8990000, 11, 7990000, 20,
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600',
        'tai nghe, sony, wh1000xm5, airpods max alternative, jbl alternative, chống ồn, anc, bluetooth, hi-res, premium, âm thanh',
        'active'
      ],
      [
        s1, stApple, brandMap['apple'], catMap['am-thanh-tai-nghe'], 'APPLE-AIRPODS-PRO-2',
        'Tai nghe Apple AirPods Pro 2 MagSafe (USB-C)',
        'Tai nghe True Wireless chip H2 chống ồn gấp 2 lần, âm thanh thích ứng Adaptive Audio, hộp sạc USB-C có loa tìm kiếm.',
        6190000, 11, 5490000, 35,
        'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600',
        'airpods, apple, airpods pro 2, sony wf1000xm5 alternative, true wireless, usb-c, anc, chống ồn, h2, tai nghe',
        'active'
      ],
      [
        s2, stLogi, brandMap['jbl'], catMap['am-thanh-tai-nghe'], 'JBL-TUNE-510BT-BLK',
        'Tai nghe Bluetooth JBL Tune 510BT',
        'Tai nghe chụp tai JBL Pure Bass Sound kết nối đa điểm, pin 40 giờ, sạc nhanh 5 phút nghe 2 giờ, gấp gọn tiện lợi.',
        1390000, 10, 1250000, 60,
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
        'tai nghe, bluetooth, jbl, tune 510bt, sony alternative, chụp tai, âm thanh, pure bass, giá rẻ',
        'active'
      ],

      // ── Thời trang & Thể thao (Áo & Quần) ──
      [
        s1, stNike, brandMap['nike'], catMap['quan-ao-the-thao'], 'NIKE-DRIFIT-TSHIRT-01',
        'Áo Thể Thao Nike Dri-FIT Running Men',
        'Áo thun nam Nike công nghệ Dri-FIT thấm hút mồ hôi vượt trội, chất liệu polyester thoáng khí cho tập gym và chạy bộ.',
        990000, 15, 840000, 80,
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600',
        'áo, áo thun, áo thể thao, nike, dri-fit, chạy bộ, gym, nam, thời trang thể thao, chính hãng',
        'active'
      ],
      [
        s2, stAdidas, brandMap['adidas'], catMap['quan-ao-the-thao'], 'ADIDAS-WIND-JACKET-02',
        'Áo Khoác Gió Adidas Performance Essentials',
        'Áo khoác dù nam Adidas chống nước nhẹ, cản gió tuyệt đối, logo 3 lá thêu nổi bật, tích hợp túi khóa kéo bảo vệ đồ cá nhân.',
        1690000, 12, 1450000, 50,
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600',
        'áo, áo khoác, áo gió, adidas, thể thao, chống nước, cản gió, khoác nam, phong cách',
        'active'
      ],
      [
        s1, stNike, brandMap['nike'], catMap['thoi-trang-nam'], 'NIKE-POLO-SPORTSWEAR-03',
        'Áo Polo Nam Nike Sportswear Classic Fit',
        'Áo polo nam Nike cổ bẻ vải cotton cao cấp co giãn 4 chiều, thêu logo Nike Swoosh sang trọng lịch lãm.',
        1190000, 20, 950000, 60,
        'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600',
        'áo, áo polo, nike, thời trang nam, cổ bẻ, công sở, cao cấp, đi chơi',
        'active'
      ],
      [
        s2, stAdidas, brandMap['adidas'], catMap['thoi-trang-nam'], 'ADIDAS-TREFOIL-TEE-04',
        'Áo Thun Nam Adidas Trefoil Original Cotton',
        'Áo phông nam Adidas chất liệu 100% cotton hữu cơ mềm mại, in hình logo Trefoil Adidas phong cách đường phố.',
        790000, 18, 650000, 100,
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600',
        'áo, áo thun, áo phông, adidas, trefoil, streetwear, cotton, nam, ngắn tay',
        'active'
      ],
      [
        s1, stNike, brandMap['nike'], catMap['quan-ao-the-thao'], 'NIKE-HOODIE-FLEECE-05',
        'Áo Hoodie Thể Thao Nike Club Fleece',
        'Áo nỉ hoodie có nón trùm Nike lót bông ấm áp, chất vải thun nỉ bông mềm mại mùa thu đông.',
        1490000, 13, 1290000, 45,
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600',
        'áo, áo hoodie, áo nỉ, nike, thu đông, áo ấm, có nón, streetwear, thể thao',
        'active'
      ],
      [
        s2, stAdidas, brandMap['adidas'], catMap['quan-ao-the-thao'], 'ADIDAS-TRACK-PANTS-06',
        'Quần Thể Thao Nam Adidas Tiro Track Pants',
        'Quần dài thể thao Adidas 3 sọc huyền thoại khóa kéo ống chân co giãn linh hoạt tập gym, đá bóng.',
        1290000, 15, 1090000, 70,
        'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600',
        'quần, quần thể thao, quần dài, adidas, 3 sọc, tiro, tập gym, đá bóng, nam',
        'active'
      ],
      [
        s1, stNike, brandMap['unbranded'], catMap['thoi-trang-nam'], 'TM-NAM-POLO-COTTON-001',
        'Áo Polo Nam Cotton Premium Cá Sấu',
        'Áo polo nam vải cá sấu cotton pique 220gsm co giãn 4 chiều mềm mịn, thấm hút mồ hôi, dáng cổ bẻ lịch lãm.',
        380000, 34, 250000, 200,
        'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600',
        'áo thun, polo, nam, cotton, co giãn, thời trang nam, cổ bẻ, lịch lãm, đi làm, văn phòng, thời trang',
        'active'
      ],
      [
        s2, stAdidas, brandMap['unbranded'], catMap['thoi-trang-nu'], 'TM-NU-DAM-HOA-NHI-001',
        'Váy Đầm Nữ Hoa Nhí Dáng Xòe Tiểu Thư',
        'Váy voan tơ cao cấp 2 lớp dáng xòe hoa nhí ngọt ngào, thắt eo điệu đà, có đệm ngực tiện lợi dạo phố du lịch.',
        490000, 35, 320000, 90,
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600',
        'váy, đầm, nữ, hoa nhí, voan, dáng xòe, tiểu thư, du lịch, đi chơi, bánh bèo, thời trang nữ, hàn quốc',
        'active'
      ],
      [
        s2, stNike, brandMap['nike'], catMap['giay-the-thao'], 'NIKE-AIR-MAX-270-BLK-42',
        'Giày Nike Air Max 270 Nam Đen Size 42',
        'Giày thể thao Nike Air Max 270 gót đệm khí êm ái, thiết kế năng động chạy bộ, tập gym và streetwear.',
        3290000, 15, 2790000, 40,
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
        'giày, nike, adidas alternative, air max, thể thao, chạy bộ, gym, sneaker, đệm khí, streetwear',
        'active'
      ],
      [
        s2, stAdidas, brandMap['adidas'], catMap['giay-the-thao'], 'ADIDAS-ULTRABOOST-22-WHT-41',
        'Giày Adidas Ultraboost 22 Nam Trắng Size 41',
        'Giày chạy bộ Adidas Ultraboost 22 đế BOOST hấp thụ lực xuất sắc, mặt đế Continental chống trượt, Primeknit+.',
        3990000, 13, 3490000, 35,
        'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=600',
        'giày, adidas, nike alternative, ultraboost, chạy bộ, boost, primeknit, thể thao, marathon',
        'active'
      ],

      // ── Gia dụng & Làm đẹp ──
      [
        s1, stXiaomi, brandMap['philips'], catMap['thiet-bi-nha-bep'], 'PHILIPS-HD9270-XL',
        'Nồi Chiên Không Dầu Philips HD9270/90 XL 6.2L',
        'Nồi chiên không dầu XL 6.2L chiên gà nguyên con, công nghệ Rapid Air giảm 90% dầu mỡ an toàn sức khỏe.',
        3590000, 17, 2990000, 35,
        'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=600',
        'nồi chiên, không dầu, philips, xiaomi alternative, gia dụng, nhà bếp, rapid air, 6.2l, điện gia dụng',
        'active'
      ],
      [
        s2, stXiaomi, brandMap['xiaomi'], catMap['thiet-bi-lam-sach'], 'XIAOMI-VACUUM-MOP-PRO-S',
        'Robot Hút Bụi Lau Nhà Xiaomi Vacuum Mop Pro S',
        'Robot hút bụi lau nhà cảm biến laser LDS tránh vật cản, lực hút 2700Pa, lập bản đồ nhà, điều khiển app Mi Home.',
        6200000, 6, 5800000, 20,
        'https://images.unsplash.com/photo-1518314916301-469f3a131666?w=600',
        'robot hút bụi, lau nhà, xiaomi, philips alternative, hút bụi thông minh, gia dụng, laser, app, dọn dẹp',
        'active'
      ],
      [
        s2, stNike, brandMap['unbranded'], catMap['my-pham-trang-diem'], 'SON-3CE-VELVET-LIP-TINT',
        'Son Kem Lì 3CE Velvet Lip Tint Daffodil',
        'Son kem lì mịn như nhung màu đỏ đất Daffodil tôn da cực xinh, không gây khô môi, bám màu lâu 6-8 tiếng.',
        350000, 31, 239000, 150,
        'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600',
        'son, 3ce, son kem, lì, đỏ đất, trang điểm, son môi, chính hãng, mỹ phẩm, làm đẹp, hàn quốc',
        'active'
      ],
      [
        s2, stNike, brandMap['unbranded'], catMap['cham-soc-da'], 'SUNSCREEN-ANESSA-60ML',
        'Kem Chống Nắng Anessa Perfect UV Sunscreen 60ml',
        'Sữa chống nắng số 1 Nhật Bản chỉ số SPF50+ PA++++ công nghệ Auto Booster chống nước trôi vượt trội 80 phút.',
        680000, 27, 495000, 90,
        'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600',
        'kem chống nắng, anessa, nhật bản, spf50, kiềm dầu, dưỡng da, mỹ phẩm, skin care, làm đẹp',
        'active'
      ],
    ];

    for (const prod of rawProducts) {
      const productParams = prod.length === 14 ? prod.slice(1) : prod;
      await connection.query(
        `INSERT INTO products (store_id, brand_id, category_id, sku, name, description,
          original_price, discount_percent, price, stock, image_url, tags, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        productParams
      );
    }

    const [dbProducts] = await connection.query('SELECT id, name, category_id, price FROM products');
    const productMap = Object.fromEntries(dbProducts.map(p => [p.name, p]));
    console.log(`  ✅ ${rawProducts.length} products inserted & linked to Merchant Stores.`);

    // 7. NORMALIZED TAGS & PRODUCT_TAGS (3NF Junction Table)
    console.log('🏷️  Seeding Normalized Categorized Tags & Product-Tag Junction Table...');
    const TAG_TYPE_MAP = {
      'thời trang': 'style', 'thời trang nam': 'style', 'thời trang nữ': 'style',
      'bánh bèo': 'style', 'tiểu thư': 'style', 'hàn quốc': 'style', 'vintage': 'style',
      'sang trọng': 'style', 'y2k': 'style', 'streetwear': 'style', 'lịch lãm': 'style',
      'samsung watch': 'tech', 'apple watch': 'tech', 'smartwatch': 'tech', 'đồng đồng thông minh': 'tech',
      'gaming': 'tech', 'esport': 'tech', 'rtx 4060': 'tech', 'rtx 4070': 'tech',
      '144hz': 'tech', '180hz': 'tech', '240hz': 'tech', 'm3 pro': 'tech',
      'a17 pro': 'tech', 'snapdragon': 'tech', '200mp': 'tech', 'amoled': 'tech',
      'chống ồn': 'tech', 'anc': 'tech', 'mỏng nhẹ': 'tech', 'bluetooth': 'tech',
      'văn phòng': 'usage', 'chạy bộ': 'usage', 'gym': 'usage', 'du lịch': 'usage',
      'dạo phố': 'usage', 'công sở': 'usage', 'nhiếp ảnh': 'usage', 'dọn dẹp': 'usage',
      'học tập': 'usage', 'decor': 'usage',
      'cao cấp': 'segment', 'flagship': 'segment', 'giá rẻ': 'segment', 'hot trend': 'segment',
      'chính hãng': 'segment', 'vna': 'segment', 'siêu nhẹ': 'segment',
    };

    const tagIdMap = {};
    const ptValues = [];

    for (const prod of rawProducts) {
      const pName = prod[5]; // Index 5 is product name
      const tagsStr = prod[12]; // Index 12 is tags
      const pObj = productMap[pName];

      if (pObj && tagsStr) {
        const tagList = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
        for (const tagName of tagList) {
          const tagSlug = slugify(tagName);
          const tagType = TAG_TYPE_MAP[tagName.toLowerCase()] || 'general';

          if (!tagIdMap[tagSlug]) {
            const isTrending = ['samsung watch', 'apple watch', 'smartwatch', 'gaming', 'mỏng nhẹ', 'hàn quốc', 'apple', 'chống ồn', 'sang trọng', 'hot trend', 'laptop', 'iphone'].includes(tagName.toLowerCase()) ? 1 : 0;
            const usageCount = Math.floor(Math.random() * 25) + 1;
            await connection.query(
              `INSERT IGNORE INTO tags (name, slug, type, usage_count, is_trending) VALUES (?, ?, ?, ?, ?)`,
              [tagName, tagSlug, tagType, usageCount, isTrending]
            );
            const [[tRow]] = await connection.query('SELECT id FROM tags WHERE slug = ?', [tagSlug]);
            if (tRow) tagIdMap[tagSlug] = tRow.id;
          }

          if (tagIdMap[tagSlug]) {
            ptValues.push([pObj.id, tagIdMap[tagSlug]]);
          }
        }
      }
    }

    if (ptValues.length > 0) {
      await connection.query('INSERT IGNORE INTO product_tags (product_id, tag_id) VALUES ?', [ptValues]);
    }
    console.log(`  ✅ ${Object.keys(tagIdMap).length} tags and ${ptValues.length} product-tag relations inserted.`);

    // 8. PRODUCT ATTRIBUTES
    console.log('🔖 Seeding Product Attributes (EAV)...');
    const getPId = (name) => productMap[name]?.id;
    const attributesData = [
      [getPId('Laptop ASUS TUF Gaming A15 2024'), 'cpu', 'AMD Ryzen 7 7745HX'],
      [getPId('Laptop Dell XPS 13 9315 Ultra Slim'), 'cpu', 'Intel Core i5-1230U'],
      [getPId('MacBook Air M2 2023 - 8GB/256GB'), 'cpu', 'Apple M2'],
      [getPId('iPhone 15 Pro 256GB Titan Đen'), 'chip', 'A17 Pro Bionic'],
      [getPId('Samsung Galaxy S24 Ultra 256GB'), 'chip', 'Snapdragon 8 Gen 3'],
      [getPId('Đồng Hồ Thông Minh Samsung Galaxy Watch 6 44mm'), 'screen', 'Super AMOLED 1.47 inch'],
      [getPId('Apple Watch Series 9 GPS 45mm Nhôm'), 'chip', 'S9 SiP'],
      [getPId('Tai nghe chống ồn Sony WH-1000XM5'), 'battery_life', '30 giờ'],
      [getPId('Nồi Chiên Không Dầu Philips HD9270/90 XL 6.2L'), 'capacity', '6.2 Lít'],
      [getPId('Robot Hút Bụi Lau Nhà Xiaomi Vacuum Mop Pro S'), 'suction', '2700Pa'],
    ].filter(a => a[0] != null);

    if (attributesData.length > 0) {
      await connection.query('INSERT INTO product_attributes (product_id, attribute_key, attribute_value) VALUES ?', [attributesData]);
    }

    // 9. PRODUCT METRICS
    console.log('📊 Seeding Product Metrics...');
    for (const p of dbProducts) {
      const views = Math.floor(Math.random() * 9000) + 300;
      const carts = Math.floor(Math.random() * 900) + 30;
      const wishlist = Math.floor(Math.random() * 600) + 15;
      const purchases = Math.floor(Math.random() * 400) + 10;
      const ratingAvg = (4.0 + Math.random() * 1.0).toFixed(2);
      const ratingCount = Math.floor(Math.random() * 300) + 20;
      const popularity = (views * 1 + carts * 3 + wishlist * 2 + purchases * 5).toFixed(2);

      await connection.query(
        `INSERT INTO product_metrics (product_id, views_count, carts_count, wishlist_count, purchases_count, rating_avg, rating_count, popularity_score)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, views, carts, wishlist, purchases, ratingAvg, ratingCount, popularity]
      );
    }

    // 10. SEARCH LOGS
    console.log('🔍 Seeding Search Logs...');
    const searchQueriesRich = [
      { query: 'samsung watch', count: 15, clickProduct: 'Đồng Hồ Thông Minh Samsung Galaxy Watch 6 44mm' },
      { query: 'apple watch', count: 18, clickProduct: 'Apple Watch Series 9 GPS 45mm Nhôm' },
      { query: 'smartwatch', count: 14, clickProduct: 'Đồng Hồ Thông Minh Samsung Galaxy Watch 6 44mm' },
      { query: 'đồng hồ thông minh', count: 12, clickProduct: 'Apple Watch Series 9 GPS 45mm Nhôm' },
      { query: 'laptop', count: 15, clickProduct: 'Laptop ASUS TUF Gaming A15 2024' },
      { query: 'macbook', count: 16, clickProduct: 'MacBook Air M2 2023 - 8GB/256GB' },
      { query: 'iphone', count: 20, clickProduct: 'iPhone 15 Pro 256GB Titan Đen' },
      { query: 'samsung galaxy', count: 15, clickProduct: 'Samsung Galaxy S24 Ultra 256GB' },
      { query: 'tai nghe chống ồn', count: 12, clickProduct: 'Tai nghe chống ồn Sony WH-1000XM5' },
      { query: 'bàn phím cơ', count: 10, clickProduct: 'Bàn phím cơ AKKO 3098B Ocean Blue' },
      { query: 'chuột gaming', count: 10, clickProduct: 'Chuột gaming Logitech G304 LightSpeed' },
      { query: 'váy đầm hoa nhí', count: 10, clickProduct: 'Váy Đầm Nữ Hoa Nhí Dáng Xòe Tiểu Thư' },
      { query: 'giày thể thao', count: 12, clickProduct: 'Giày Nike Air Max 270 Nam Đen Size 42' },
      { query: 'nồi chiên không dầu', count: 10, clickProduct: 'Nồi Chiên Không Dầu Philips HD9270/90 XL 6.2L' },
      { query: 'son kem 3ce', count: 10, clickProduct: 'Son Kem Lì 3CE Velvet Lip Tint Daffodil' },
    ];

    for (const sq of searchQueriesRich) {
      for (let i = 0; i < sq.count; i++) {
        const randomUser = customerIds[Math.floor(Math.random() * customerIds.length)];
        const pObj = productMap[sq.clickProduct];
        await connection.query(
          `INSERT INTO search_logs (user_id, session_id, query_text, normalized_query, results_count, clicked_product_id)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [randomUser, `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
           sq.query, normalizeQuery(sq.query), Math.floor(Math.random() * 8) + 1, pObj?.id ?? null]
        );
      }
    }

    // 11. USER BEHAVIOR LOGS
    console.log('📈 Seeding User Behavior Logs...');
    for (const custId of customerIds) {
      const userProductSample = dbProducts.sort(() => 0.5 - Math.random()).slice(0, 16);
      for (const prod of userProductSample) {
        const action = Object.keys(BEHAVIOR_WEIGHTS)[Math.floor(Math.random() * Object.keys(BEHAVIOR_WEIGHTS).length)];
        const weight = BEHAVIOR_WEIGHTS[action] || 1;
        const dwellSec = action === 'dwell_time_high' ? Math.floor(Math.random() * 45) + 15 : Math.floor(Math.random() * 10);

        await connection.query(
          `INSERT INTO user_behavior_logs (user_id, session_id, product_id, action_type, weight, dwell_seconds)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [custId, `sess_${custId}_${Math.random().toString(36).substr(2, 6)}`,
           prod.id, action, weight, dwellSec]
        );
      }
    }

    // 12. WISHLIST & CART
    for (const custId of customerIds) {
      const sampleProds = dbProducts.sort(() => 0.5 - Math.random()).slice(0, 4);
      for (const p of sampleProds) {
        await connection.query('INSERT IGNORE INTO user_wishlist (user_id, product_id) VALUES (?, ?)', [custId, p.id]);
        await connection.query('INSERT IGNORE INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', [custId, p.id, 1]);
      }
    }

    // 13. ORDERS
    for (let i = 0; i < 20; i++) {
      const custId = customerIds[i % customerIds.length];
      const p1 = dbProducts[Math.floor(Math.random() * dbProducts.length)];
      const [resOrder] = await connection.query(
        `INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method) VALUES (?, ?, 'completed', ?, 'cod')`,
        [custId, p1.price, '123 Nguyễn Trãi, Hà Nội']
      );
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, 1, ?)`,
        [resOrder.insertId, p1.id, p1.name, p1.price]
      );
    }

    // 14. REVIEWS
    for (let i = 0; i < 30; i++) {
      const custId = customerIds[i % customerIds.length];
      const prod = dbProducts[i % dbProducts.length];
      await connection.query(
        `INSERT IGNORE INTO product_reviews (user_id, product_id, rating, comment, sentiment_score) VALUES (?, ?, 5, 'Sản phẩm mua từ Gian Hàng Chính Hãng dùng cực kỳ mượt mà, đóng gói cẩn thận 5 sao!', 0.95)`,
        [custId, prod.id]
      );
    }

    console.log('\n🎉 [DATABASE SEED V4.0 COMPLETED SUCCESSFULLY!] Merchant Stores & Products loaded.\n');
  } catch (error) {
    console.error('❌ Error during Database Seeding:', error);
  } finally {
    await connection.end();
  }
}

runSeed();
