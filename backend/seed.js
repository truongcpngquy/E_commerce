/**
 * seed.js - Smart E-Commerce Database Seeder v2.0
 * 
 * Script khởi tạo và bơm dữ liệu mẫu đầy đủ cho hệ thống E-Commerce Thông minh.
 * Bao gồm: Users, Profiles, Contexts, Brands, Categories (cây 2 cấp), Products,
 *          Product Attributes (EAV), Metrics, Search Logs, Behavior Logs, Reviews.
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// ─── Trọng số hành vi người dùng (đồng bộ với DB ENUM) ──────────────────────
const BEHAVIOR_WEIGHTS = {
  search_click:    2,
  product_view:    1,
  dwell_time_high: 2,
  wishlist_add:    3,
  cart_add:        4,
  cart_remove:    -2,
  checkout_start:  4,
  purchase:        5,
  feed_view:       1,
  share:           3,
};

// ─── Helper: Tính price tier (1-5) từ giá sản phẩm ─────────────────────────
function calcPriceTier(price) {
  if (price < 100000)   return 1; // Rất rẻ < 100K
  if (price < 500000)   return 2; // Bình dân 100K-500K
  if (price < 2000000)  return 3; // Trung cấp 500K-2M
  if (price < 10000000) return 4; // Cao cấp 2M-10M
  return 5;                        // Siêu cao cấp > 10M
}

// ─── Helper: Normalize query text ───────────────────────────────────────────
function normalizeQuery(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

async function runSeed() {
  console.log('\n🚀 [Smart E-Commerce Seeder v2.0] Starting Database Seed...\n');

  const connection = await mysql.createConnection({
    host:               process.env.DB_HOST     || 'localhost',
    user:               process.env.DB_USER     || 'root',
    password:           process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    multipleStatements: true,
  });

  try {
    // ── Khởi tạo Database ───────────────────────────────────────────────────
    const dbName = process.env.DB_NAME || 'shopee_db';
    console.log(`📦 Creating database [${dbName}]...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${dbName}\``);

    // ── Chạy schema.sql ─────────────────────────────────────────────────────
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

    // ── Xóa dữ liệu cũ (reset toàn bộ) ────────────────────────────────────
    console.log('🧹 Cleaning old data...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    const tablesToTruncate = [
      'product_reviews', 'user_behavior_logs', 'search_logs',
      'user_wishlist', 'product_vectors', 'product_metrics',
      'product_attributes', 'order_items', 'orders', 'cart_items',
      'products', 'categories', 'brands', 'user_contexts',
      'user_profiles', 'users',
    ];
    for (const tbl of tablesToTruncate) {
      await connection.query(`TRUNCATE TABLE \`${tbl}\``);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Old data cleared.\n');

    // ════════════════════════════════════════════════════════════════════════
    // SEED 1: USERS
    // ════════════════════════════════════════════════════════════════════════
    console.log('👤 Seeding Users...');
    const salt = bcrypt.genSaltSync(10);
    const pw = bcrypt.hashSync('123456', salt);

    const usersData = [
      ['admin',     pw, 'admin@smartshop.vn',      'admin'],
      ['seller1',   pw, 'seller1@smartshop.vn',    'seller'],
      ['seller2',   pw, 'seller2@smartshop.vn',    'seller'],
      ['customer1', pw, 'customer1@gmail.com',      'customer'],
      ['customer2', pw, 'customer2@gmail.com',      'customer'],
      ['customer3', pw, 'customer3@gmail.com',      'customer'],
      ['customer4', pw, 'customer4@gmail.com',      'customer'],
    ];
    await connection.query('INSERT INTO users (username, password, email, role) VALUES ?', [usersData]);

    const [[{ id: seller1Id }]]  = await connection.query('SELECT id FROM users WHERE username = "seller1"');
    const [[{ id: seller2Id }]]  = await connection.query('SELECT id FROM users WHERE username = "seller2"');
    const [[{ id: cust1Id }]]    = await connection.query('SELECT id FROM users WHERE username = "customer1"');
    const [[{ id: cust2Id }]]    = await connection.query('SELECT id FROM users WHERE username = "customer2"');
    const [[{ id: cust3Id }]]    = await connection.query('SELECT id FROM users WHERE username = "customer3"');
    const [[{ id: cust4Id }]]    = await connection.query('SELECT id FROM users WHERE username = "customer4"');
    console.log(`  ✅ ${usersData.length} users inserted.`);

    // ════════════════════════════════════════════════════════════════════════
    // SEED 2: USER PROFILES
    // ════════════════════════════════════════════════════════════════════════
    console.log('🪪 Seeding User Profiles...');
    const profilesData = [
      [cust1Id, 'Nguyễn Văn An',    'male',   '1995-03-15', '0901234567', 'Hà Nội',     'Đống Đa',   JSON.stringify([1, 2]), 'mid-range'],
      [cust2Id, 'Trần Thị Bích',    'female', '1998-07-22', '0912345678', 'TP.HCM',     'Quận 1',    JSON.stringify([3, 4]), 'budget'],
      [cust3Id, 'Lê Minh Cường',    'male',   '1992-11-30', '0923456789', 'Đà Nẵng',    'Hải Châu',  JSON.stringify([1, 5]), 'premium'],
      [cust4Id, 'Phạm Thanh Duyên', 'female', '2000-01-10', '0934567890', 'Hà Nội',     'Cầu Giấy',  JSON.stringify([4, 3]), 'budget'],
    ];
    await connection.query(
      'INSERT INTO user_profiles (user_id,full_name,gender,date_of_birth,phone,city,district,preferred_categories,price_sensitivity) VALUES ?',
      [profilesData]
    );
    console.log(`  ✅ ${profilesData.length} profiles inserted.`);

    // ════════════════════════════════════════════════════════════════════════
    // SEED 3: BRANDS
    // ════════════════════════════════════════════════════════════════════════
    console.log('🏷️  Seeding Brands...');
    const brandsData = [
      ['Apple',    'apple',    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/200px-Apple_logo_black.svg.png', 'Hãng công nghệ hàng đầu thế giới', 'USA'],
      ['Samsung',  'samsung',  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/200px-Samsung_Logo.svg.png',        'Tập đoàn điện tử đa quốc gia Hàn Quốc', 'South Korea'],
      ['Asus',     'asus',     'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/ASUS_Logo.svg/200px-ASUS_Logo.svg.png',              'Nhà sản xuất máy tính hàng đầu Đài Loan', 'Taiwan'],
      ['Dell',     'dell',     'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Dell_Logo.png/200px-Dell_Logo.png',                  'Thương hiệu máy tính nổi tiếng Mỹ', 'USA'],
      ['Logitech', 'logitech', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Logitech_logo.svg/200px-Logitech_logo.svg.png',      'Hãng phụ kiện máy tính hàng đầu', 'Switzerland'],
      ['JBL',      'jbl',      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/JBL_logo.svg/200px-JBL_logo.svg.png',               'Thương hiệu âm thanh chất lượng cao', 'USA'],
      ['Sony',     'sony',     'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/200px-Sony_logo.svg.png',             'Tập đoàn điện tử đa ngành Nhật Bản', 'Japan'],
      ['Nike',     'nike',     'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/200px-Logo_NIKE.svg.png',             'Thương hiệu thể thao hàng đầu thế giới', 'USA'],
      ['Adidas',   'adidas',   'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/200px-Adidas_Logo.svg.png',         'Thương hiệu thể thao Đức nổi tiếng', 'Germany'],
      ['Xiaomi',   'xiaomi',   'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Xiaomi_logo.svg/200px-Xiaomi_logo.svg.png',         'Hãng công nghệ Trung Quốc', 'China'],
      ['Philips',  'philips',  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Philips_logo_new.svg/200px-Philips_logo_new.svg.png','Tập đoàn điện tử gia dụng Hà Lan', 'Netherlands'],
      ['AKKO',     'akko',     'https://cdn.shopify.com/s/files/1/0512/2312/6707/files/akkogamer_logo.png',                                   'Thương hiệu bàn phím cơ cao cấp', 'China'],
      ['Unbranded','unbranded','',                                                                                                             'Hàng không nhãn hiệu', 'Vietnam'],
    ];
    await connection.query('INSERT INTO brands (name, slug, logo_url, description, country) VALUES ?', [brandsData]);

    const [dbBrands] = await connection.query('SELECT id, slug FROM brands');
    const brandMap = Object.fromEntries(dbBrands.map(b => [b.slug, b.id]));
    console.log(`  ✅ ${brandsData.length} brands inserted.`);

    // ════════════════════════════════════════════════════════════════════════
    // SEED 4: CATEGORIES (Cây 2 cấp)
    // ════════════════════════════════════════════════════════════════════════
    console.log('📂 Seeding Categories (2-level tree)...');

    // Level 1 - Danh mục gốc
    const rootCats = [
      [null, 'Điện tử & Công nghệ',  'dien-tu-cong-nghe',  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300', 1],
      [null, 'Thời trang & Phụ kiện','thoi-trang-phu-kien', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300', 1],
      [null, 'Gia dụng & Nhà cửa',   'gia-dung-nha-cua',   'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300', 1],
      [null, 'Thể thao & Du lịch',   'the-thao-du-lich',   'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=300', 1],
      [null, 'Sức khỏe & Làm đẹp',   'suc-khoe-lam-dep',   'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300', 1],
    ];
    await connection.query('INSERT INTO categories (parent_id, name, slug, image_url, level) VALUES ?', [rootCats]);

    const [dbRootCats] = await connection.query("SELECT id, slug FROM categories WHERE level = 1");
    const rootCatMap   = Object.fromEntries(dbRootCats.map(c => [c.slug, c.id]));

    // Level 2 - Danh mục con
    const subCats = [
      // Điện tử & Công nghệ
      [rootCatMap['dien-tu-cong-nghe'], 'Laptop & Máy tính',      'laptop-may-tinh',     'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200', 2],
      [rootCatMap['dien-tu-cong-nghe'], 'Điện thoại thông minh',  'dien-thoai',          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200', 2],
      [rootCatMap['dien-tu-cong-nghe'], 'Phụ kiện máy tính',      'phu-kien-may-tinh',   'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=200', 2],
      [rootCatMap['dien-tu-cong-nghe'], 'Âm thanh & Tai nghe',    'am-thanh-tai-nghe',   'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200', 2],
      [rootCatMap['dien-tu-cong-nghe'], 'Đồng hồ thông minh',     'dong-ho-thong-minh',  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200', 2],
      // Thời trang & Phụ kiện
      [rootCatMap['thoi-trang-phu-kien'], 'Thời trang Nam',       'thoi-trang-nam',      'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=200', 2],
      [rootCatMap['thoi-trang-phu-kien'], 'Thời trang Nữ',        'thoi-trang-nu',       'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=200', 2],
      [rootCatMap['thoi-trang-phu-kien'], 'Giày dép Nam',         'giay-dep-nam',        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200', 2],
      [rootCatMap['thoi-trang-phu-kien'], 'Giày dép Nữ',          'giay-dep-nu',         'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200', 2],
      // Gia dụng & Nhà cửa
      [rootCatMap['gia-dung-nha-cua'],  'Thiết bị nhà bếp',       'thiet-bi-nha-bep',    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200', 2],
      [rootCatMap['gia-dung-nha-cua'],  'Thiết bị làm sạch',      'thiet-bi-lam-sach',   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200', 2],
      // Thể thao & Du lịch
      [rootCatMap['the-thao-du-lich'],  'Quần áo thể thao',        'quan-ao-the-thao',   'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200', 2],
      [rootCatMap['the-thao-du-lich'],  'Giày thể thao',            'giay-the-thao',     'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200', 2],
    ];
    await connection.query('INSERT INTO categories (parent_id, name, slug, image_url, level) VALUES ?', [subCats]);

    const [dbAllCats] = await connection.query('SELECT id, slug FROM categories');
    const catMap = Object.fromEntries(dbAllCats.map(c => [c.slug, c.id]));
    console.log(`  ✅ ${rootCats.length + subCats.length} categories inserted (2-level tree).`);

    // ════════════════════════════════════════════════════════════════════════
    // SEED 5: PRODUCTS (20 sản phẩm đa danh mục)
    // ════════════════════════════════════════════════════════════════════════
    console.log('📦 Seeding Products...');

    // Format: [seller_id, brand_id, category_id, sku, name, description, original_price, discount_percent, price, stock, image_url, tags, status]
    const productsData = [
      // ── Laptop & Máy tính ────────────────────────────────────────────────
      [
        seller1Id, brandMap['asus'], catMap['laptop-may-tinh'],
        'ASUS-TUF-A15-2024',
        'Laptop ASUS TUF Gaming A15 2024',
        'Laptop gaming hiệu năng cực cao, CPU AMD Ryzen 7 7745HX, RAM 16GB DDR5, VGA RTX 4060 8GB, màn hình 15.6 inch 144Hz FHD, SSD 512GB NVMe. Thiết kế chắc chắn chuẩn quân đội MIL-STD-810H.',
        22990000, 8, 21150000, 15,
        'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600',
        'laptop, asus, tuf, gaming, ryzen 7, rtx 4060, 144hz, máy tính xách tay, cấu hình mạnh, amd',
        'active'
      ],
      [
        seller1Id, brandMap['dell'], catMap['laptop-may-tinh'],
        'DELL-XPS-13-9315',
        'Laptop Dell XPS 13 9315 Ultra Slim',
        'Dòng máy tính xách tay cao cấp mỏng nhẹ nhất của Dell, vỏ nhôm nguyên khối CNC, chip Intel Core i5-1230U thế hệ 12, RAM 8GB LPDDR5, SSD 512GB, màn hình InfinityEdge 13.4 inch FHD+. Lý tưởng cho doanh nhân và văn phòng.',
        27500000, 11, 24500000, 10,
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600',
        'laptop, dell, xps, mỏng nhẹ, doanh nhân, văn phòng, intel, i5, cao cấp, sang trọng',
        'active'
      ],
      [
        seller2Id, brandMap['apple'], catMap['laptop-may-tinh'],
        'APPLE-MBA-M2-2023',
        'MacBook Air M2 2023 - 8GB/256GB',
        'MacBook Air với chip Apple M2 cực mạnh, thiết kế mỏng nhẹ không quạt tản nhiệt hoàn toàn yên tĩnh, thời lượng pin lên tới 18 giờ sử dụng liên tục, màn hình Liquid Retina 13.6 inch siêu sắc nét 500 nits, trọng lượng chỉ 1.24kg.',
        28990000, 7, 26990000, 20,
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
        'laptop, macbook, apple, m2, mỏng nhẹ, sang trọng, pin trâu, thiết kế đẹp, macOS, nhẹ nhất',
        'active'
      ],

      // ── Điện thoại thông minh ────────────────────────────────────────────
      [
        seller2Id, brandMap['apple'], catMap['dien-thoai'],
        'APPLE-IP15-PRO-256',
        'iPhone 15 Pro 256GB Titan Đen',
        'iPhone 15 Pro với chip A17 Pro mạnh nhất trên smartphone, khung titan cao cấp, camera 48MP Fusion với khả năng zoom quang học 5x, màn hình Super Retina XDR 6.1 inch ProMotion 120Hz, cổng USB-C tiện lợi.',
        33990000, 5, 32290000, 30,
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600',
        'iphone, điện thoại, apple, 15 pro, titan, a17 pro, camera, 5x zoom, usb-c, cao cấp, sang trọng',
        'active'
      ],
      [
        seller1Id, brandMap['samsung'], catMap['dien-thoai'],
        'SAMSUNG-S24U-256',
        'Samsung Galaxy S24 Ultra 256GB',
        'Flagship Android đỉnh cao với chip Snapdragon 8 Gen 3, tích hợp Galaxy AI thông minh, S Pen chính xác, camera 200MP với zoom quang học 10x, màn hình Dynamic AMOLED 2X 6.8 inch 120Hz cực sắc nét, pin 5000mAh sạc nhanh 45W.',
        31990000, 10, 28790000, 25,
        'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600',
        'samsung, galaxy, s24 ultra, s pen, ai, 200mp, android, flagship, snapdragon, zoom 10x',
        'active'
      ],
      [
        seller1Id, brandMap['xiaomi'], catMap['dien-thoai'],
        'XIAOMI-14-ULTRA-512',
        'Xiaomi 14 Ultra 512GB',
        'Siêu phẩm nhiếp ảnh di động với hệ thống camera Leica Summilux, cảm biến 1 inch khổng lồ, zoom quang học 5x, chip Snapdragon 8 Gen 3, màn hình AMOLED 2K+ 6.73 inch 120Hz, pin khủng 5000mAh sạc siêu nhanh 90W.',
        28990000, 5, 27540000, 18,
        'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600',
        'xiaomi, 14 ultra, leica, camera, 1 inch sensor, snapdragon, android, nhiếp ảnh, zoom 5x',
        'active'
      ],

      // ── Phụ kiện máy tính ────────────────────────────────────────────────
      [
        seller1Id, brandMap['akko'], catMap['phu-kien-may-tinh'],
        'AKKO-3098B-CS-OCEAN-BLUE',
        'Bàn phím cơ AKKO 3098B Ocean Blue CS Switch',
        'Bàn phím cơ không dây layout 98 phím, kết nối 3 chế độ Bluetooth 5.0 / 2.4GHz / Type-C có dây, trang bị switch AKKO CS Ocean Blue linear mượt mà, hỗ trợ hotswap thay switch tiện lợi, thiết kế PBT Double-Shot Keycap bền màu.',
        2190000, 11, 1950000, 45,
        'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600',
        'bàn phím, bàn phím cơ, akko, không dây, bluetooth, 2.4ghz, hotswap, phụ kiện máy tính, gaming, mechanic',
        'active'
      ],
      [
        seller1Id, brandMap['logitech'], catMap['phu-kien-may-tinh'],
        'LOGI-G304-WHITE',
        'Chuột gaming không dây Logitech G304 LightSpeed Trắng',
        'Chuột gaming không dây quốc dân cực phổ biến, cảm biến HERO với DPI tùy chỉnh 200-12000, kết nối LightSpeed không dây siêu tốc cực thấp trễ < 1ms, pin AAA dùng tới 250 giờ liên tục, trọng lượng nhẹ chỉ 99g.',
        890000, 11, 790000, 80,
        'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600',
        'chuột, chuột gaming, logitech, g304, không dây, lightspeed, phụ kiện máy tính, chơi game, fps',
        'active'
      ],

      // ── Âm thanh & Tai nghe ──────────────────────────────────────────────
      [
        seller2Id, brandMap['jbl'], catMap['am-thanh-tai-nghe'],
        'JBL-TUNE-510BT-BLK',
        'Tai nghe chụp tai Bluetooth JBL Tune 510BT',
        'Tai nghe Bluetooth On-Ear JBL Pure Bass Sound sống động, kết nối đa điểm 2 thiết bị cùng lúc, thời lượng pin khủng 40 giờ với sạc nhanh JBL 5 phút nghe 2 giờ, thiết kế foldable gọn nhẹ dễ mang theo.',
        1390000, 10, 1250000, 60,
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
        'tai nghe, bluetooth, jbl, tune 510bt, chụp tai, âm thanh, bass, không dây, nghe nhạc, đa điểm',
        'active'
      ],
      [
        seller2Id, brandMap['sony'], catMap['am-thanh-tai-nghe'],
        'SONY-WH1000XM5-BLK',
        'Tai nghe chống ồn Sony WH-1000XM5',
        'Vua chống ồn của thị trường tai nghe wireless, trang bị 8 microphone và chip QN1e tiên tiến, chống ồn chủ động ANC tốt nhất trong phân khúc, âm thanh Hi-Res 30mm driver, kết nối Multipoint 2 thiết bị, pin 30 giờ sạc nhanh 3 phút dùng 3 giờ.',
        8990000, 11, 7990000, 20,
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600',
        'tai nghe, sony, wh1000xm5, chống ồn, anc, bluetooth, hi-res, không dây, premium, vua chống ồn',
        'active'
      ],

      // ── Thời trang Nam ───────────────────────────────────────────────────
      [
        seller1Id, brandMap['unbranded'], catMap['thoi-trang-nam'],
        'TM-NAM-POLO-COTTON-001',
        'Áo Polo Nam Cotton Premium Cá Sấu',
        'Áo polo nam chất liệu vải cá sấu cotton pique 220gsm co giãn 4 chiều cực mềm mịn, thoáng mát, thấm hút mồ hôi vượt trội. Kiểu dáng trẻ trung lịch lãm chuẩn form, phù hợp đi làm, đi chơi, gặp gỡ đối tác.',
        380000, 34, 250000, 200,
        'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600',
        'áo thun, polo, nam, cotton, co giãn, thời trang nam, cổ bẻ, lịch lãm, đi làm, văn phòng',
        'active'
      ],
      [
        seller1Id, brandMap['unbranded'], catMap['thoi-trang-nam'],
        'TM-NAM-JEAN-SLIM-001',
        'Quần Jean Nam Slim Fit Dáng Ôm Co Giãn',
        'Quần bò nam chất bò co giãn nhẹ 2% spandex form slim fit ôm dáng trẻ trung tôn dáng, chất vải dày dặn không xù lông bền màu xuất sắc sau nhiều lần giặt, đường may tinh tế chắc chắn. Available size 28-34.',
        520000, 33, 350000, 120,
        'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600',
        'quần jean, quần bò, nam, slim fit, co giãn, thời trang nam, trẻ trung, ôm dáng, denim',
        'active'
      ],

      // ── Thời trang Nữ ────────────────────────────────────────────────────
      [
        seller2Id, brandMap['unbranded'], catMap['thoi-trang-nu'],
        'TM-NU-TSHIRT-OVERSIZE-001',
        'Áo Thun Nữ Tay Lỡ Form Rộng Oversize',
        'Áo phông nữ tay lỡ dáng rộng oversize chất cotton 100% dày dặn không xù, in hình họa tiết dễ thương phong cách Hàn Quốc cực xinh xắn. Phù hợp mix với quần short, chân váy, quần jean đều đẹp.',
        175000, 31, 120000, 300,
        'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=600',
        'áo thun, nữ, form rộng, oversize, tay lỡ, unisex, thời trang nữ, hàn quốc, dễ thương, cotton',
        'active'
      ],
      [
        seller2Id, brandMap['unbranded'], catMap['thoi-trang-nu'],
        'TM-NU-DAM-HOA-NHI-001',
        'Váy Đầm Nữ Hoa Nhí Dáng Xòe Tiểu Thư',
        'Váy voan tơ cao cấp 2 lớp dáng xòe hoa nhí ngọt ngào phong cách tiểu thư bánh bèo, thắt eo điệu đà tôn vóc dáng, có đệm ngực tiện lợi. Thích hợp dạo phố, chụp ảnh check-in, du lịch, tiệc nhẹ.',
        490000, 35, 320000, 90,
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600',
        'váy, đầm, nữ, hoa nhí, voan, dáng xòe, thời trang nữ, dạo phố, tiểu thư, dễ thương, du lịch',
        'active'
      ],
      [
        seller1Id, brandMap['unbranded'], catMap['thoi-trang-nu'],
        'TM-NU-CHAN-VAY-TENNIS-001',
        'Chân Váy Xếp Ly Tennis Cạp Cao Năng Động',
        'Chân váy chữ A xếp ly mini ngắn năng động cạp cao tôn dáng, thiết kế tích hợp quần an toàn bên trong tiện lợi. Dễ phối với áo croptop, áo thun, áo sơ mi đều cực chất. Available size S-XL.',
        225000, 33, 150000, 150,
        'https://images.unsplash.com/photo-1582142306909-195724d33ab5?w=600',
        'chân váy, xếp ly, tennis, cạp cao, chữ a, năng động, thời trang nữ, mini, quần an toàn',
        'active'
      ],

      // ── Giày thể thao ────────────────────────────────────────────────────
      [
        seller2Id, brandMap['nike'], catMap['giay-the-thao'],
        'NIKE-AIR-MAX-270-BLK-42',
        'Giày Nike Air Max 270 Nam Đen Size 42',
        'Giày thể thao Nike Air Max 270 với đệm khí Air Max lớn nhất từ trước đến nay tại gót mang lại cảm giác cực êm ái, thiết kế thể thao năng động phù hợp tập gym, chạy bộ nhẹ và thời trang đường phố (Streetwear).',
        3290000, 15, 2790000, 40,
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
        'giày, nike, air max, thể thao, chạy bộ, gym, sneaker, streetwear, đệm khí, thoáng khí',
        'active'
      ],
      [
        seller2Id, brandMap['adidas'], catMap['giay-the-thao'],
        'ADIDAS-ULTRABOOST-22-WHT-41',
        'Giày Adidas Ultraboost 22 Nam Trắng Size 41',
        'Giày chạy bộ Adidas Ultraboost 22 với đế BOOST tiên tiến hấp thụ tốt lực tác động và hoàn trả năng lượng vượt trội, đế giữa Continental™ Rubber chống trơn trượt, upper Primeknit+ ôm sát chân thoáng khí.',
        3990000, 13, 3490000, 35,
        'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=600',
        'giày, adidas, ultraboost, chạy bộ, boost, primeknit, thể thao, marathon, thoáng khí, ergonomic',
        'active'
      ],

      // ── Thiết bị nhà bếp ─────────────────────────────────────────────────
      [
        seller1Id, brandMap['philips'], catMap['thiet-bi-nha-bep'],
        'PHILIPS-HD9270-XL',
        'Nồi Chiên Không Dầu Philips HD9270/90 XL 6.2L',
        'Nồi chiên không dầu điện tử cao cấp size XL dung tích 6.2L thoải mái chiên cả nguyên con gà 1.5kg, tôm, khoai. Công nghệ Rapid Air tuần hoàn không khí nóng chiên giòn đều giảm đến 90% dầu mỡ so với chiên dầu thông thường, an toàn sức khỏe gia đình.',
        3590000, 17, 2990000, 35,
        'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=600',
        'nồi chiên, không dầu, philips, gia dụng, nhà bếp, nấu ăn, rapid air, sức khỏe, chiên giòn, 6.2l',
        'active'
      ],
      [
        seller2Id, brandMap['xiaomi'], catMap['thiet-bi-lam-sach'],
        'XIAOMI-VACUUM-MOP-PRO-S',
        'Robot Hút Bụi Lau Nhà Thông Minh Xiaomi Vacuum Mop Pro S',
        'Robot hút bụi kết hợp lau nhà thế hệ mới, lực hút mạnh 2700Pa, định vị bằng hệ thống laser LDS chính xác tránh vật cản thông minh, lập bản đồ nhà đa tầng, lên lịch hút tự động, điều khiển từ xa qua app Mi Home cực tiện lợi.',
        6200000, 6, 5800000, 20,
        'https://images.unsplash.com/photo-1518314916301-469f3a131666?w=600',
        'robot hút bụi, lau nhà, xiaomi, hút bụi thông minh, gia dụng, dọn dẹp, laser, app, tự động',
        'active'
      ],
      [
        seller1Id, brandMap['samsung'], catMap['dong-ho-thong-minh'],
        'SAMSUNG-GW6-44MM-BLK',
        'Đồng Hồ Thông Minh Samsung Galaxy Watch 6 44mm',
        'Đồng hồ thông minh Samsung Galaxy Watch 6 44mm, màn hình Super AMOLED 1.47 inch tươi sáng sắc nét, theo dõi sức khỏe toàn diện: nhịp tim, SpO2, ECG, theo dõi giấc ngủ, hỗ trợ hơn 90 bài tập thể thao, pin 40 giờ sạc nhanh.',
        7990000, 13, 6990000, 30,
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
        'đồng hồ, smartwatch, samsung, galaxy watch, thông minh, sức khỏe, ecg, nhịp tim, theo dõi, amoled',
        'active'
      ],
    ];

    for (const prod of productsData) {
      await connection.query(
        `INSERT INTO products (seller_id, brand_id, category_id, sku, name, description,
          original_price, discount_percent, price, stock, image_url, tags, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        prod
      );
    }

    const [dbProducts] = await connection.query('SELECT id, name, category_id, price FROM products');
    const productMap  = Object.fromEntries(dbProducts.map(p => [p.name, p]));
    console.log(`  ✅ ${productsData.length} products inserted.`);

    // ════════════════════════════════════════════════════════════════════════
    // SEED 6: PRODUCT ATTRIBUTES (EAV - thuộc tính chi tiết)
    // ════════════════════════════════════════════════════════════════════════
    console.log('🔖 Seeding Product Attributes (EAV)...');

    const getProductId = (name) => productMap[name]?.id;

    const attributesData = [
      // Laptop ASUS TUF Gaming
      [getProductId('Laptop ASUS TUF Gaming A15 2024'), 'cpu',          'AMD Ryzen 7 7745HX'],
      [getProductId('Laptop ASUS TUF Gaming A15 2024'), 'ram',          '16GB DDR5'],
      [getProductId('Laptop ASUS TUF Gaming A15 2024'), 'vga',          'NVIDIA RTX 4060 8GB'],
      [getProductId('Laptop ASUS TUF Gaming A15 2024'), 'storage',      '512GB NVMe SSD'],
      [getProductId('Laptop ASUS TUF Gaming A15 2024'), 'screen_size',  '15.6 inch'],
      [getProductId('Laptop ASUS TUF Gaming A15 2024'), 'refresh_rate', '144Hz'],
      [getProductId('Laptop ASUS TUF Gaming A15 2024'), 'color',        'Xám Bão'],

      // Laptop Dell XPS 13
      [getProductId('Laptop Dell XPS 13 9315 Ultra Slim'), 'cpu',         'Intel Core i5-1230U'],
      [getProductId('Laptop Dell XPS 13 9315 Ultra Slim'), 'ram',         '8GB LPDDR5'],
      [getProductId('Laptop Dell XPS 13 9315 Ultra Slim'), 'storage',     '512GB SSD'],
      [getProductId('Laptop Dell XPS 13 9315 Ultra Slim'), 'screen_size', '13.4 inch'],
      [getProductId('Laptop Dell XPS 13 9315 Ultra Slim'), 'weight',      '1.17 kg'],
      [getProductId('Laptop Dell XPS 13 9315 Ultra Slim'), 'color',       'Bạch Kim'],

      // MacBook Air M2
      [getProductId('MacBook Air M2 2023 - 8GB/256GB'), 'cpu',         'Apple M2'],
      [getProductId('MacBook Air M2 2023 - 8GB/256GB'), 'ram',         '8GB Unified Memory'],
      [getProductId('MacBook Air M2 2023 - 8GB/256GB'), 'storage',     '256GB SSD'],
      [getProductId('MacBook Air M2 2023 - 8GB/256GB'), 'screen_size', '13.6 inch'],
      [getProductId('MacBook Air M2 2023 - 8GB/256GB'), 'weight',      '1.24 kg'],
      [getProductId('MacBook Air M2 2023 - 8GB/256GB'), 'color',       'Midnight'],

      // iPhone 15 Pro
      [getProductId('iPhone 15 Pro 256GB Titan Đen'), 'chip',         'A17 Pro Bionic'],
      [getProductId('iPhone 15 Pro 256GB Titan Đen'), 'storage',      '256GB'],
      [getProductId('iPhone 15 Pro 256GB Titan Đen'), 'screen_size',  '6.1 inch'],
      [getProductId('iPhone 15 Pro 256GB Titan Đen'), 'camera',       '48MP + 12MP + 12MP'],
      [getProductId('iPhone 15 Pro 256GB Titan Đen'), 'color',        'Black Titanium'],
      [getProductId('iPhone 15 Pro 256GB Titan Đen'), 'refresh_rate', '120Hz ProMotion'],

      // Samsung Galaxy S24 Ultra
      [getProductId('Samsung Galaxy S24 Ultra 256GB'), 'chip',         'Snapdragon 8 Gen 3'],
      [getProductId('Samsung Galaxy S24 Ultra 256GB'), 'storage',      '256GB'],
      [getProductId('Samsung Galaxy S24 Ultra 256GB'), 'ram',          '12GB'],
      [getProductId('Samsung Galaxy S24 Ultra 256GB'), 'camera',       '200MP + 12MP + 10MP + 10MP'],
      [getProductId('Samsung Galaxy S24 Ultra 256GB'), 'screen_size',  '6.8 inch'],
      [getProductId('Samsung Galaxy S24 Ultra 256GB'), 'battery',      '5000mAh'],

      // Tai nghe Sony WH-1000XM5
      [getProductId('Tai nghe chống ồn Sony WH-1000XM5'), 'connectivity', 'Bluetooth 5.2'],
      [getProductId('Tai nghe chống ồn Sony WH-1000XM5'), 'battery_life', '30 giờ'],
      [getProductId('Tai nghe chống ồn Sony WH-1000XM5'), 'feature',      'ANC chủ động'],
      [getProductId('Tai nghe chống ồn Sony WH-1000XM5'), 'driver',       '30mm'],
      [getProductId('Tai nghe chống ồn Sony WH-1000XM5'), 'color',        'Đen'],

      // Giày Nike Air Max 270
      [getProductId('Giày Nike Air Max 270 Nam Đen Size 42'), 'size',       '42'],
      [getProductId('Giày Nike Air Max 270 Nam Đen Size 42'), 'color',      'Đen/Trắng'],
      [getProductId('Giày Nike Air Max 270 Nam Đen Size 42'), 'material',   'Mesh thoáng khí'],
      [getProductId('Giày Nike Air Max 270 Nam Đen Size 42'), 'sole',       'Air Max đệm khí'],
      [getProductId('Giày Nike Air Max 270 Nam Đen Size 42'), 'gender',     'Nam'],

      // Áo Polo Nam
      [getProductId('Áo Polo Nam Cotton Premium Cá Sấu'), 'material',  'Cotton Pique 220gsm'],
      [getProductId('Áo Polo Nam Cotton Premium Cá Sấu'), 'size',      'S, M, L, XL, XXL'],
      [getProductId('Áo Polo Nam Cotton Premium Cá Sấu'), 'color',     'Nhiều màu'],
      [getProductId('Áo Polo Nam Cotton Premium Cá Sấu'), 'gender',    'Nam'],
      [getProductId('Áo Polo Nam Cotton Premium Cá Sấu'), 'style',     'Cổ bẻ'],

      // Váy đầm hoa nhí
      [getProductId('Váy Đầm Nữ Hoa Nhí Dáng Xòe Tiểu Thư'), 'material', 'Voan Tơ 2 lớp'],
      [getProductId('Váy Đầm Nữ Hoa Nhí Dáng Xòe Tiểu Thư'), 'size',     'S, M, L, XL'],
      [getProductId('Váy Đầm Nữ Hoa Nhí Dáng Xòe Tiểu Thư'), 'pattern',  'Hoa nhí'],
      [getProductId('Váy Đầm Nữ Hoa Nhí Dáng Xòe Tiểu Thư'), 'style',    'Dáng xòe'],
      [getProductId('Váy Đầm Nữ Hoa Nhí Dáng Xòe Tiểu Thư'), 'gender',   'Nữ'],

      // Nồi chiên không dầu Philips
      [getProductId('Nồi Chiên Không Dầu Philips HD9270/90 XL 6.2L'), 'capacity',   '6.2 Lít'],
      [getProductId('Nồi Chiên Không Dầu Philips HD9270/90 XL 6.2L'), 'power',      '2000W'],
      [getProductId('Nồi Chiên Không Dầu Philips HD9270/90 XL 6.2L'), 'technology', 'Rapid Air'],
      [getProductId('Nồi Chiên Không Dầu Philips HD9270/90 XL 6.2L'), 'color',      'Đen'],
    ].filter(a => a[0] != null);

    if (attributesData.length > 0) {
      await connection.query(
        'INSERT INTO product_attributes (product_id, attribute_key, attribute_value) VALUES ?',
        [attributesData]
      );
    }
    console.log(`  ✅ ${attributesData.length} product attributes inserted.`);

    // ════════════════════════════════════════════════════════════════════════
    // SEED 7: PRODUCT METRICS (Chỉ số tổng hợp)
    // ════════════════════════════════════════════════════════════════════════
    console.log('📊 Seeding Product Metrics...');
    const metricsData = dbProducts.map(p => [
      p.id,
      Math.floor(Math.random() * 5000) + 100,   // views_count
      Math.floor(Math.random() * 500) + 10,      // carts_count
      Math.floor(Math.random() * 300) + 5,       // wishlist_count
      Math.floor(Math.random() * 200) + 2,       // purchases_count
      (3.5 + Math.random() * 1.5).toFixed(2),    // rating_avg (3.5 - 5.0)
      Math.floor(Math.random() * 150) + 5,       // rating_count
    ]);
    for (const m of metricsData) {
      const popularity = (m[1] * 1 + m[2] * 3 + m[3] * 2 + m[4] * 5).toFixed(2);
      await connection.query(
        `INSERT INTO product_metrics (product_id, views_count, carts_count, wishlist_count, purchases_count, rating_avg, rating_count, popularity_score)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [...m, popularity]
      );
    }
    console.log(`  ✅ ${metricsData.length} product metrics inserted.`);

    // ════════════════════════════════════════════════════════════════════════
    // SEED 8: SEARCH LOGS (Nhật ký tìm kiếm)
    // ════════════════════════════════════════════════════════════════════════
    console.log('🔍 Seeding Search Logs...');
    const searchQueries = [
      { userId: cust1Id, query: 'laptop gaming ryzen rtx',       clickedName: 'Laptop ASUS TUF Gaming A15 2024',      resultsCount: 3 },
      { userId: cust1Id, query: 'bàn phím cơ không dây bluetooth', clickedName: 'Bàn phím cơ AKKO 3098B Ocean Blue CS Switch', resultsCount: 5 },
      { userId: cust1Id, query: 'macbook m2',                    clickedName: 'MacBook Air M2 2023 - 8GB/256GB',      resultsCount: 2 },
      { userId: cust1Id, query: 'chuột gaming logitech',         clickedName: 'Chuột gaming không dây Logitech G304 LightSpeed Trắng', resultsCount: 4 },
      { userId: cust2Id, query: 'váy đầm hoa nhí',               clickedName: 'Váy Đầm Nữ Hoa Nhí Dáng Xòe Tiểu Thư', resultsCount: 6 },
      { userId: cust2Id, query: 'áo thun nữ oversize',           clickedName: 'Áo Thun Nữ Tay Lỡ Form Rộng Oversize', resultsCount: 8 },
      { userId: cust2Id, query: 'chân váy tennis cạp cao',       clickedName: 'Chân Váy Xếp Ly Tennis Cạp Cao Năng Động', resultsCount: 4 },
      { userId: cust3Id, query: 'iphone 15 pro',                 clickedName: 'iPhone 15 Pro 256GB Titan Đen',         resultsCount: 3 },
      { userId: cust3Id, query: 'tai nghe chống ồn sony',        clickedName: 'Tai nghe chống ồn Sony WH-1000XM5',    resultsCount: 5 },
      { userId: cust3Id, query: 'robot hút bụi xiaomi',          clickedName: 'Robot Hút Bụi Lau Nhà Thông Minh Xiaomi Vacuum Mop Pro S', resultsCount: 3 },
      { userId: cust4Id, query: 'giày adidas chạy bộ',           clickedName: 'Giày Adidas Ultraboost 22 Nam Trắng Size 41', resultsCount: 4 },
      { userId: cust4Id, query: 'nồi chiên không dầu philips',   clickedName: 'Nồi Chiên Không Dầu Philips HD9270/90 XL 6.2L', resultsCount: 3 },
      { userId: null,    query: 'samsung galaxy s24',            clickedName: 'Samsung Galaxy S24 Ultra 256GB',        resultsCount: 2 },
      { userId: null,    query: 'áo polo nam cotton',            clickedName: 'Áo Polo Nam Cotton Premium Cá Sấu',    resultsCount: 7 },
    ];

    for (const sl of searchQueries) {
      const clickedProduct = sl.clickedName ? productMap[sl.clickedName] : null;
      await connection.query(
        `INSERT INTO search_logs (user_id, session_id, query_text, normalized_query, results_count, clicked_product_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [sl.userId, `sess_${Date.now()}_${Math.random().toString(36).substr(2,6)}`,
         sl.query, normalizeQuery(sl.query), sl.resultsCount,
         clickedProduct?.id ?? null]
      );
    }
    console.log(`  ✅ ${searchQueries.length} search logs inserted.`);

    // ════════════════════════════════════════════════════════════════════════
    // SEED 9: USER BEHAVIOR LOGS (Implicit Feedback - đa dạng hành vi)
    // ════════════════════════════════════════════════════════════════════════
    console.log('📈 Seeding User Behavior Logs (Implicit Feedback)...');

    // Customer 1: Yêu thích công nghệ (laptop, phụ kiện)
    const c1BehaviorRaw = [
      ['Laptop ASUS TUF Gaming A15 2024',             'product_view',    null, 8],
      ['Laptop ASUS TUF Gaming A15 2024',             'dwell_time_high', null, 25],
      ['Laptop ASUS TUF Gaming A15 2024',             'cart_add',        null, 0],
      ['MacBook Air M2 2023 - 8GB/256GB',             'product_view',    null, 10],
      ['MacBook Air M2 2023 - 8GB/256GB',             'dwell_time_high', null, 30],
      ['MacBook Air M2 2023 - 8GB/256GB',             'wishlist_add',    null, 0],
      ['Laptop Dell XPS 13 9315 Ultra Slim',          'product_view',    null, 5],
      ['Bàn phím cơ AKKO 3098B Ocean Blue CS Switch', 'search_click',    null, 0],
      ['Bàn phím cơ AKKO 3098B Ocean Blue CS Switch', 'product_view',    null, 12],
      ['Bàn phím cơ AKKO 3098B Ocean Blue CS Switch', 'cart_add',        null, 0],
      ['Bàn phím cơ AKKO 3098B Ocean Blue CS Switch', 'purchase',        null, 0],
      ['Chuột gaming không dây Logitech G304 LightSpeed Trắng', 'product_view', null, 6],
      ['Chuột gaming không dây Logitech G304 LightSpeed Trắng', 'wishlist_add', null, 0],
    ];

    // Customer 2: Yêu thích thời trang nữ
    const c2BehaviorRaw = [
      ['Váy Đầm Nữ Hoa Nhí Dáng Xòe Tiểu Thư',      'search_click',    null, 0],
      ['Váy Đầm Nữ Hoa Nhí Dáng Xòe Tiểu Thư',      'product_view',    null, 18],
      ['Váy Đầm Nữ Hoa Nhí Dáng Xòe Tiểu Thư',      'dwell_time_high', null, 22],
      ['Váy Đầm Nữ Hoa Nhí Dáng Xòe Tiểu Thư',      'cart_add',        null, 0],
      ['Váy Đầm Nữ Hoa Nhí Dáng Xòe Tiểu Thư',      'purchase',        null, 0],
      ['Chân Váy Xếp Ly Tennis Cạp Cao Năng Động',   'product_view',    null, 9],
      ['Chân Váy Xếp Ly Tennis Cạp Cao Năng Động',   'wishlist_add',    null, 0],
      ['Áo Thun Nữ Tay Lỡ Form Rộng Oversize',       'product_view',    null, 7],
      ['Áo Thun Nữ Tay Lỡ Form Rộng Oversize',       'cart_add',        null, 0],
    ];

    // Customer 3: Yêu thích high-end tech + thể thao
    const c3BehaviorRaw = [
      ['iPhone 15 Pro 256GB Titan Đen',               'product_view',    null, 20],
      ['iPhone 15 Pro 256GB Titan Đen',               'dwell_time_high', null, 35],
      ['iPhone 15 Pro 256GB Titan Đen',               'cart_add',        null, 0],
      ['iPhone 15 Pro 256GB Titan Đen',               'purchase',        null, 0],
      ['Samsung Galaxy S24 Ultra 256GB',              'product_view',    null, 8],
      ['Tai nghe chống ồn Sony WH-1000XM5',           'product_view',    null, 15],
      ['Tai nghe chống ồn Sony WH-1000XM5',           'dwell_time_high', null, 28],
      ['Tai nghe chống ồn Sony WH-1000XM5',           'wishlist_add',    null, 0],
      ['Robot Hút Bụi Lau Nhà Thông Minh Xiaomi Vacuum Mop Pro S', 'product_view', null, 10],
      ['Đồng Hồ Thông Minh Samsung Galaxy Watch 6 44mm', 'product_view',  null, 12],
    ];

    // Customer 4: Yêu thích thời trang + giày
    const c4BehaviorRaw = [
      ['Giày Nike Air Max 270 Nam Đen Size 42',        'product_view',    null, 14],
      ['Giày Nike Air Max 270 Nam Đen Size 42',        'wishlist_add',    null, 0],
      ['Giày Adidas Ultraboost 22 Nam Trắng Size 41',  'search_click',    null, 0],
      ['Giày Adidas Ultraboost 22 Nam Trắng Size 41',  'product_view',    null, 18],
      ['Giày Adidas Ultraboost 22 Nam Trắng Size 41',  'cart_add',        null, 0],
      ['Nồi Chiên Không Dầu Philips HD9270/90 XL 6.2L', 'product_view',  null, 6],
      ['Nồi Chiên Không Dầu Philips HD9270/90 XL 6.2L', 'dwell_time_high', null, 20],
      ['Áo Polo Nam Cotton Premium Cá Sấu',           'product_view',    null, 5],
    ];

    const userBehaviorMap = [
      { userId: cust1Id, behaviors: c1BehaviorRaw },
      { userId: cust2Id, behaviors: c2BehaviorRaw },
      { userId: cust3Id, behaviors: c3BehaviorRaw },
      { userId: cust4Id, behaviors: c4BehaviorRaw },
    ];

    let totalBehaviorLogs = 0;
    for (const { userId, behaviors } of userBehaviorMap) {
      for (const [productName, actionType, _sessionId, dwellSeconds] of behaviors) {
        const product = productMap[productName];
        if (!product) continue;
        const weight = BEHAVIOR_WEIGHTS[actionType] ?? 1;
        await connection.query(
          `INSERT INTO user_behavior_logs (user_id, session_id, product_id, action_type, weight, dwell_seconds)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, `sess_${userId}_${Math.random().toString(36).substr(2,6)}`,
           product.id, actionType, weight, dwellSeconds]
        );
        totalBehaviorLogs++;
      }
    }
    console.log(`  ✅ ${totalBehaviorLogs} behavior logs inserted.`);

    // ════════════════════════════════════════════════════════════════════════
    // SEED 10: USER WISHLIST
    // ════════════════════════════════════════════════════════════════════════
    console.log('💖 Seeding User Wishlist...');
    const wishlistData = [
      [cust1Id, productMap['MacBook Air M2 2023 - 8GB/256GB']?.id],
      [cust1Id, productMap['Chuột gaming không dây Logitech G304 LightSpeed Trắng']?.id],
      [cust2Id, productMap['Chân Váy Xếp Ly Tennis Cạp Cao Năng Động']?.id],
      [cust3Id, productMap['Tai nghe chống ồn Sony WH-1000XM5']?.id],
      [cust4Id, productMap['Giày Nike Air Max 270 Nam Đen Size 42']?.id],
    ].filter(w => w[0] && w[1]);

    if (wishlistData.length > 0) {
      await connection.query(
        'INSERT INTO user_wishlist (user_id, product_id) VALUES ?',
        [wishlistData]
      );
    }
    console.log(`  ✅ ${wishlistData.length} wishlist items inserted.`);

    // ════════════════════════════════════════════════════════════════════════
    // SEED 11: ORDERS & ORDER ITEMS (Đơn hàng mẫu)
    // ════════════════════════════════════════════════════════════════════════
    console.log('🛒 Seeding Orders & Order Items...');

    // Đơn hàng customer1: Mua bàn phím AKKO
    const [orderResult1] = await connection.query(
      `INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method)
       VALUES (?, ?, 'completed', ?, 'e_wallet')`,
      [cust1Id, 1950000, '123 Đường Láng, Đống Đa, Hà Nội']
    );
    const akkoProd = productMap['Bàn phím cơ AKKO 3098B Ocean Blue CS Switch'];
    if (akkoProd) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
         VALUES (?, ?, ?, ?, ?)`,
        [orderResult1.insertId, akkoProd.id, 'Bàn phím cơ AKKO 3098B Ocean Blue CS Switch', 1, 1950000]
      );
    }

    // Đơn hàng customer2: Mua váy hoa nhí
    const [orderResult2] = await connection.query(
      `INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method)
       VALUES (?, ?, 'completed', ?, 'cod')`,
      [cust2Id, 320000, '456 Nguyễn Trãi, Quận 1, TP.HCM']
    );
    const damProd = productMap['Váy Đầm Nữ Hoa Nhí Dáng Xòe Tiểu Thư'];
    if (damProd) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
         VALUES (?, ?, ?, ?, ?)`,
        [orderResult2.insertId, damProd.id, 'Váy Đầm Nữ Hoa Nhí Dáng Xòe Tiểu Thư', 1, 320000]
      );
    }

    // Đơn hàng customer3: Mua iPhone 15 Pro
    const [orderResult3] = await connection.query(
      `INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method)
       VALUES (?, ?, 'completed', ?, 'credit_card')`,
      [cust3Id, 32290000, '789 Điện Biên Phủ, Hải Châu, Đà Nẵng']
    );
    const iphoneProd = productMap['iPhone 15 Pro 256GB Titan Đen'];
    if (iphoneProd) {
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price)
         VALUES (?, ?, ?, ?, ?)`,
        [orderResult3.insertId, iphoneProd.id, 'iPhone 15 Pro 256GB Titan Đen', 1, 32290000]
      );
    }
    console.log('  ✅ 3 orders and order items inserted.');

    // ════════════════════════════════════════════════════════════════════════
    // SEED 12: PRODUCT REVIEWS (Đánh giá sản phẩm)
    // ════════════════════════════════════════════════════════════════════════
    console.log('⭐ Seeding Product Reviews...');
    const reviewsData = [
      {
        userId: cust1Id, productId: akkoProd?.id, orderId: orderResult1.insertId,
        rating: 5, sentiment: 0.92,
        comment: 'Bàn phím quá xuất sắc! Gõ mượt mà êm tay, switch Ocean Blue linear cực thích, kết nối bluetooth ổn định. Đáng đồng tiền bỏ ra. Sẽ tiếp tục ủng hộ AKKO.',
      },
      {
        userId: cust2Id, productId: damProd?.id, orderId: orderResult2.insertId,
        rating: 4, sentiment: 0.78,
        comment: 'Váy đẹp, hoa nhí xinh xắn đúng như ảnh. Chất vải mềm nhẹ nhàng. Chỉ hơi mỏng một chút nhưng nhìn chung rất ổn. Giao hàng nhanh, đóng gói cẩn thận.',
      },
      {
        userId: cust3Id, productId: iphoneProd?.id, orderId: orderResult3.insertId,
        rating: 5, sentiment: 0.95,
        comment: 'iPhone 15 Pro là chiếc phone tuyệt vời nhất tôi từng dùng. Camera zoom 5x cực rõ nét, chip A17 Pro mạnh vô đối, khung titan cứng cáp sang trọng. 5 sao không đủ để đánh giá!',
      },
    ].filter(r => r.productId);

    for (const r of reviewsData) {
      await connection.query(
        `INSERT INTO product_reviews (user_id, product_id, order_id, rating, comment, sentiment_score)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [r.userId, r.productId, r.orderId, r.rating, r.comment, r.sentiment]
      );
      // Cập nhật rating_avg trong product_metrics
      await connection.query(
        `UPDATE product_metrics SET
          rating_count = rating_count + 1,
          rating_avg = (rating_avg * (rating_count - 1) + ?) / rating_count
         WHERE product_id = ?`,
        [r.rating, r.productId]
      );
    }
    console.log(`  ✅ ${reviewsData.length} product reviews inserted.`);

    console.log('\n🎉 ============================================');
    console.log('   Database seeding completed successfully!');
    console.log('   Smart E-Commerce DB v2.0 is ready.');
    console.log('   Summary:');
    console.log(`   - Users:             ${usersData.length}`);
    console.log(`   - User Profiles:     ${profilesData.length}`);
    console.log(`   - Brands:            ${brandsData.length}`);
    console.log(`   - Categories:        ${rootCats.length + subCats.length} (2 levels)`);
    console.log(`   - Products:          ${productsData.length}`);
    console.log(`   - Attributes (EAV):  ${attributesData.length}`);
    console.log(`   - Search Logs:       ${searchQueries.length}`);
    console.log(`   - Behavior Logs:     ${totalBehaviorLogs}`);
    console.log(`   - Wishlist Items:    ${wishlistData.length}`);
    console.log(`   - Orders:            3`);
    console.log(`   - Reviews:           ${reviewsData.length}`);
    console.log('   ============================================\n');

  } catch (err) {
    console.error('\n❌ [Seeder] Error during database seeding:');
    console.error(err);
  } finally {
    await connection.end();
  }
}

runSeed();
