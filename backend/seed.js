const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function runSeed() {
  console.log('Starting Database Seed...');

  // 1. Kết nối không chọn DB để tạo DB trước
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    multipleStatements: true // Hỗ trợ chạy nhiều câu lệnh SQL cùng lúc
  });

  try {
    const dbName = process.env.DB_NAME || 'shopee_db';
    console.log(`Creating database ${dbName} if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${dbName}\``);

    // 2. Đọc file schema.sql và chạy
    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log(`Reading schema from ${schemaPath}...`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Creating tables...');
    await connection.query(schemaSql);
    console.log('Tables created successfully.');

    // 3. Xóa dữ liệu cũ để tránh trùng lặp
    console.log('Cleaning old data...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE user_interactions');
    await connection.query('TRUNCATE TABLE order_items');
    await connection.query('TRUNCATE TABLE orders');
    await connection.query('TRUNCATE TABLE cart_items');
    await connection.query('TRUNCATE TABLE products');
    await connection.query('TRUNCATE TABLE categories');
    await connection.query('TRUNCATE TABLE users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // 4. Tạo Users mẫu
    console.log('Inserting seed users...');
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('123456', salt);

    const users = [
      ['admin', passwordHash, 'admin@shopee.vn', 'admin'],
      ['seller1', passwordHash, 'seller1@shopee.vn', 'seller'],
      ['seller2', passwordHash, 'seller2@shopee.vn', 'seller'],
      ['customer1', passwordHash, 'customer1@gmail.com', 'customer'],
      ['customer2', passwordHash, 'customer2@gmail.com', 'customer']
    ];

    await connection.query(
      'INSERT INTO users (username, password, email, role) VALUES ?',
      [users]
    );

    // Lấy ID của seller1 và customer1
    const [[{ id: sellerId }]] = await connection.query('SELECT id FROM users WHERE username = "seller1"');
    const [[{ id: customerId }]] = await connection.query('SELECT id FROM users WHERE username = "customer1"');
    const [[{ id: customer2Id }]] = await connection.query('SELECT id FROM users WHERE username = "customer2"');

    // 5. Tạo Categories mẫu
    console.log('Inserting categories...');
    const categories = [
      ['Điện tử & Laptop', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200'],
      ['Phụ kiện công nghệ', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=200'],
      ['Thời trang Nam', 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=200'],
      ['Thời trang Nữ', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200'],
      ['Thiết bị gia dụng', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200']
    ];

    await connection.query(
      'INSERT INTO categories (name, image_url) VALUES ?',
      [categories]
    );

    // Lấy map danh mục
    const [dbCategories] = await connection.query('SELECT id, name FROM categories');
    const categoryMap = {};
    dbCategories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });

    // 6. Tạo Products mẫu với tags chi tiết cho Content-Based
    console.log('Inserting products with rich tags...');
    const products = [
      // Điện tử & Laptop
      [
        'Laptop ASUS TUF Gaming A15',
        'Laptop Asus Gaming hiệu năng cực cao, CPU Ryzen 7, RAM 16GB, RTX 3050, màn hình 144Hz phù hợp cho game thủ chuyên nghiệp và làm đồ họa.',
        18990000,
        15,
        'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500',
        categoryMap['Điện tử & Laptop'],
        'laptop, asus, tuf, gaming, ryzen, rtx, máy tính xách tay, cấu hình mạnh'
      ],
      [
        'Laptop Dell XPS 13 9315 Ultra Slim',
        'Dòng máy tính xách tay cao cấp mỏng nhẹ nhất của Dell, vỏ nhôm nguyên khối, chip Intel Core i5 thế hệ mới, RAM 8GB, SSD 512GB, phù hợp cho doanh nhân, văn phòng.',
        24500000,
        10,
        'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500',
        categoryMap['Điện tử & Laptop'],
        'laptop, dell, xps, mỏng nhẹ, doanh nhân, văn phòng, intel, máy tính xách tay'
      ],
      [
        'MacBook Air M2 2023',
        'Macbook Air với chip M2 cực mạnh, thiết kế mỏng nhẹ không quạt tản nhiệt, thời lượng pin lên tới 18 giờ, màn hình Liquid Retina siêu sắc nét.',
        26800000,
        20,
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
        categoryMap['Điện tử & Laptop'],
        'laptop, macbook, apple, m2, mỏng nhẹ, sang trọng, ios, pin trâu'
      ],

      // Phụ kiện công nghệ
      [
        'Bàn phím cơ AKKO 3098B Multi-mode',
        'Bàn phím cơ không dây layout 98 phím, kết nối Bluetooth/2.4Ghz/Type-C, trang bị switch Akko Jelly cao cấp, hotswap tiện lợi.',
        1950000,
        30,
        'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500',
        categoryMap['Phụ kiện công nghệ'],
        'bàn phím, bàn phím cơ, akko, không dây, bluetooth, phụ kiện máy tính, gaming'
      ],
      [
        'Chuột chơi game không dây Logitech G304 LightSpeed',
        'Chuột gaming không dây quốc dân, mắt đọc HERO 12k DPI, kết nối LightSpeed siêu tốc không trễ, pin dùng tới 250 giờ.',
        790000,
        50,
        'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500',
        categoryMap['Phụ kiện công nghệ'],
        'chuột, chuột gaming, logitech, không dây, lightspeed, phụ kiện máy tính, chơi game'
      ],
      [
        'Tai nghe chụp tai Bluetooth JBL Tune 510BT',
        'Tai nghe Bluetooth On-Ear JBL Pure Bass Sound, kết nối đa điểm, thời lượng pin 40 giờ có sạc nhanh, đệm tai êm ái thích hợp nghe nhạc, học tập.',
        1250000,
        40,
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        categoryMap['Phụ kiện công nghệ'],
        'tai nghe, bluetooth, jbl, tune, chụp tai, âm thanh, không dây, nghe nhạc'
      ],

      // Thời trang Nam
      [
        'Áo thun Nam Polo Cotton cá sấu premium',
        'Áo polo nam chất liệu vải cá sấu cotton co giãn 4 chiều, thoáng mát, thấm hút mồ hôi tốt. Kiểu dáng trẻ trung lịch lãm, phù hợp đi làm đi chơi.',
        250000,
        120,
        'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500',
        categoryMap['Thời trang Nam'],
        'áo thun, polo, nam, cotton, co giãn, thời trang nam, cổ bẻ, lịch lãm'
      ],
      [
        'Quần Jean Nam Slim Fit dáng ôm xanh đậm',
        'Quần bò nam chất bò co giãn nhẹ, form dáng ôm slimfit trẻ trung tôn dáng, chất vải không xù lông bền màu cực tốt.',
        350000,
        80,
        'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
        categoryMap['Thời trang Nam'],
        'quần jean, quần bò, nam, slim fit, co giãn, thời trang nam, xanh đậm, trẻ trung'
      ],
      [
        'Áo khoác gió Nam thể thao chống nước nhẹ',
        'Áo khoác gió nam 2 lớp mỏng nhẹ, cản gió giữ ấm và chống mưa phùn nhẹ. Có mũ trùm đầu tiện lợi phù hợp chạy bộ, đi phượt.',
        290000,
        60,
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
        categoryMap['Thời trang Nam'],
        'áo khoác, áo gió, nam, chống nước, thể thao, thời trang nam, cản gió'
      ],

      // Thời trang Nữ
      [
        'Áo thun Nữ tay lỡ Form rộng Unisex',
        'Áo phông nữ tay lỡ dáng rộng oversize chất cotton dày dặn, in hình họa tiết dễ thương phong cách Hàn Quốc cực xinh xắn.',
        120000,
        200,
        'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=500',
        categoryMap['Thời trang Nữ'],
        'áo thun, nữ, form rộng, oversize, tay lỡ, unisex, thời trang nữ, hàn quốc, dễ thương'
      ],
      [
        'Váy Đầm Nữ dáng xòe hoa nhí bánh bèo',
        'Váy voan tơ 2 lớp dáng xòe hoa nhí ngọt ngào phong cách tiểu thư bánh bèo, thắt eo điệu đà, thích hợp dạo phố, chụp ảnh.',
        320000,
        70,
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500',
        categoryMap['Thời trang Nữ'],
        'váy, đầm, nữ, hoa nhí, voan, dáng xòe, thời trang nữ, dạo phố, bánh bèo'
      ],
      [
        'Chân váy xếp ly dáng tennis cạp cao',
        'Chân váy chữ A xếp ly ngắn năng động kiểu dáng tennis cạp cao tôn dáng có quần bảo hộ bên trong an toàn, dễ mix đồ.',
        150000,
        95,
        'https://images.unsplash.com/photo-1582142306909-195724d33ab5?w=500',
        categoryMap['Thời trang Nữ'],
        'chân váy, xếp ly, tennis, cạp cao, chữ a, năng động, thời trang nữ, phối đồ'
      ],

      // Thiết bị gia dụng
      [
        'Nồi chiên không dầu Philips HD9270/90 XL 6.2 Lit',
        'Nồi chiên không dầu điện tử size XL dung tích 6.2L thoải mái chiên nướng nguyên con gà. Công nghệ Rapid Air chiên giòn giảm 90% dầu mỡ.',
        2990000,
        25,
        'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=500',
        categoryMap['Thiết bị gia dụng'],
        'nồi chiên, không dầu, philips, gia dụng, nhà bếp, nấu ăn, rapid air, sức khỏe'
      ],
      [
        'Robot hút bụi lau nhà thông minh Xiaomi Vacuum Mop Pro',
        'Robot hút bụi kết hợp lau nhà, lực hút cực khỏe 2100Pa, định vị bằng hệ thống laser LDS thông minh tránh vật cản, điều khiển qua app tiện lợi.',
        5800000,
        15,
        'https://images.unsplash.com/photo-1518314916301-469f3a131666?w=500',
        categoryMap['Thiết bị gia dụng'],
        'robot hút bụi, lau nhà, xiaomi, hút bụi thông minh, gia dụng, dọn dẹp, nhà cửa'
      ]
    ];

    await connection.query(
      'INSERT INTO products (name, description, price, stock, image_url, category_id, tags) VALUES ?',
      [products]
    );

    // Lấy ID các sản phẩm vừa thêm để tạo lịch sử tương tác
    const [dbProducts] = await connection.query('SELECT id, name FROM products');
    const productMap = {};
    dbProducts.forEach(prod => {
      productMap[prod.name] = prod.id;
    });

    // 7. Tạo lịch sử tương tác mẫu
    // Customer 1 thích công nghệ và phụ kiện
    // - Xem Laptop Asus Gaming (view, weight=1)
    // - Đã thích Logitech mouse (like, weight=2)
    // - Thêm vào giỏ AKKO Keyboard (cart, weight=3)
    // -> Engine sẽ gợi ý các laptop khác (Dell XPS, Macbook) hoặc tai nghe chụp tai JBL (phụ kiện)
    console.log('Inserting seed user interactions...');
    const interactions = [
      [customerId, productMap['Laptop ASUS TUF Gaming A15'], 'view', 1],
      [customerId, productMap['Chuột chơi game không dây Logitech G304 LightSpeed'], 'like', 2],
      [customerId, productMap['Bàn phím cơ AKKO 3098B Multi-mode'], 'cart', 3],

      // Customer 2 thích thời trang nữ
      // - Xem Váy đầm hoa nhí (view, weight=1)
      // - Đã mua Chân váy xếp ly (purchase, weight=5)
      [customer2Id, productMap['Váy Đầm Nữ dáng xòe hoa nhí bánh bèo'], 'view', 1],
      [customer2Id, productMap['Chân váy xếp ly dáng tennis cạp cao'], 'purchase', 5],
      [customer2Id, productMap['Áo thun Nữ tay lỡ Form rộng Unisex'], 'like', 2]
    ];

    await connection.query(
      'INSERT INTO user_interactions (user_id, product_id, interaction_type, weight) VALUES ?',
      [interactions]
    );

    console.log('Database seeding finished successfully!');
  } catch (err) {
    console.error('An error occurred during database seeding:', err);
  } finally {
    await connection.end();
  }
}

runSeed();
