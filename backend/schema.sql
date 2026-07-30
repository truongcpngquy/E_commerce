-- =============================================================
-- SMART E-COMMERCE DATABASE SCHEMA v2.0
-- Architecture: Multi-Dimensional Enterprise Schema
-- Designed for: AI Recommendation Engine + Smart Search System
-- Engine: InnoDB | Charset: UTF8MB4 | Author: Senior Lead Engineer
-- =============================================================

CREATE DATABASE IF NOT EXISTS shopee_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shopee_db;

-- =============================================================
-- MODULE 1: NGƯỜI DÙNG (USER PROFILING & CONTEXT)
-- =============================================================

-- 1. Bảng Users (Tài khoản xác thực - Tối giản hoá, tách biệt với profile)
CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(100) UNIQUE NOT NULL,
    password      VARCHAR(255) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    role          ENUM('customer', 'seller', 'admin') DEFAULT 'customer',
    status        ENUM('active', 'suspended', 'pending') DEFAULT 'active',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role),
    INDEX idx_users_status (status)
) ENGINE=InnoDB;

-- 2. Bảng User Profiles (Chân dung & Sở thích Khách hàng - 1:1 với users)
-- Mục đích: Cá nhân hóa gợi ý theo nhân khẩu học và ngân sách
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id              INT PRIMARY KEY,
    full_name            VARCHAR(150),
    gender               ENUM('male', 'female', 'other', 'unspecified') DEFAULT 'unspecified',
    date_of_birth        DATE,
    phone                VARCHAR(20),
    avatar_url           VARCHAR(500),
    city                 VARCHAR(100),
    district             VARCHAR(100),
    -- Danh mục quan tâm chính (JSON array of category IDs): [1, 5, 12]
    preferred_categories JSON,
    -- Mức độ nhạy cảm với giá (phân loại ngân sách)
    price_sensitivity    ENUM('budget', 'mid-range', 'premium') DEFAULT 'mid-range',
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Bảng User Contexts (Ngữ cảnh thực tế phiên truy cập - phục vụ context-aware recommendation)
-- Mục đích: Gợi ý khác nhau vào buổi sáng/tối, theo thiết bị, theo vùng miền
CREATE TABLE IF NOT EXISTS user_contexts (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT,
    session_id    VARCHAR(128) NOT NULL,
    device_type   ENUM('mobile', 'tablet', 'desktop') DEFAULT 'desktop',
    os_platform   VARCHAR(50),              -- iOS, Android, Windows, macOS...
    client_ip     VARCHAR(45),              -- IPv4 or IPv6
    -- Khung giờ mua sắm chia thành 4 buổi (phân tích xu hướng mua theo giờ)
    time_slot     ENUM('morning', 'afternoon', 'evening', 'night') DEFAULT 'afternoon',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_ctx_user (user_id),
    INDEX idx_ctx_session (session_id)
) ENGINE=InnoDB;

-- =============================================================
-- MODULE 2: DANH MỤC & THƯƠNG HIỆU (TAXONOMY)
-- =============================================================

-- 4. Bảng Brands (Thương hiệu sản phẩm)
CREATE TABLE IF NOT EXISTS brands (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(150) UNIQUE NOT NULL,
    slug          VARCHAR(150) UNIQUE NOT NULL,
    logo_url      VARCHAR(500),
    description   TEXT,
    country       VARCHAR(100),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Bảng Categories (Danh mục đa cấp - Cây phân cấp Category Tree)
-- parent_id = NULL nghĩa là danh mục gốc (Level 1)
-- Ví dụ: "Điện tử" (L1) -> "Điện thoại & Smartphone" (L2) -> "iPhone" (L3)
CREATE TABLE IF NOT EXISTS categories (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    parent_id     INT DEFAULT NULL,
    name          VARCHAR(150) NOT NULL,
    slug          VARCHAR(150) UNIQUE NOT NULL,
    image_url     VARCHAR(500),
    level         TINYINT DEFAULT 1,        -- 1: Root, 2: Sub, 3: Leaf
    sort_order    INT DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_cat_parent (parent_id),
    INDEX idx_cat_level (level)
) ENGINE=InnoDB;

-- =============================================================
-- MODULE 3: SẢN PHẨM ĐA CHIỀU (RICH PRODUCT CONTENT)
-- =============================================================

-- 6. Bảng Products (Thông tin cốt lõi sản phẩm)
CREATE TABLE IF NOT EXISTS products (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    seller_id        INT,                          -- Người bán tạo sản phẩm
    brand_id         INT,
    category_id      INT,
    sku              VARCHAR(100) UNIQUE,           -- Stock Keeping Unit
    name             VARCHAR(255) NOT NULL,
    description      TEXT,
    original_price   DECIMAL(12, 2) NOT NULL,       -- Giá gốc (trước giảm)
    discount_percent TINYINT UNSIGNED DEFAULT 0,    -- % giảm giá (0-100)
    price            DECIMAL(12, 2) NOT NULL,       -- Giá bán thực tế
    stock            INT DEFAULT 0,
    image_url        VARCHAR(500),
    -- Tags phân cách bằng dấu phẩy: phục vụ TF-IDF & Fulltext search
    tags             TEXT,
    status           ENUM('draft', 'active', 'out_of_stock', 'archived') DEFAULT 'active',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id)  REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (brand_id)   REFERENCES brands(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_products_category (category_id),
    INDEX idx_products_brand (brand_id),
    INDEX idx_products_status (status),
    INDEX idx_products_price (price),
    -- FULLTEXT INDEX hỗ trợ tìm kiếm ngôn ngữ tự nhiên tiếng Việt + tiếng Anh
    FULLTEXT INDEX ft_products_search (name, description, tags)
) ENGINE=InnoDB;

-- 7. Bảng Product Attributes (Thuộc tính sản phẩm theo mô hình EAV - Entity-Attribute-Value)
-- Mục đích chính: Content-Based Filtering - So sánh đặc tính kỹ thuật giữa các sản phẩm
-- Ví dụ: (product_id=1, key='ram', value='16GB'), (product_id=1, key='color', value='Đen')
CREATE TABLE IF NOT EXISTS product_attributes (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    product_id       INT NOT NULL,
    attribute_key    VARCHAR(100) NOT NULL,          -- 'color', 'ram', 'size', 'material', 'screen_size'...
    attribute_value  VARCHAR(255) NOT NULL,          -- 'Đỏ', '16GB', 'XL', 'Cotton', '6.7 inch'...
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    -- Index kép cho truy vấn lọc theo thuộc tính cực nhanh (VD: tất cả SP màu đỏ + size L)
    INDEX idx_attr_product (product_id),
    INDEX idx_attr_key_value (attribute_key, attribute_value(50))
) ENGINE=InnoDB;

-- 8. Bảng Product Vectors (Vector thuộc tính sản phẩm dành cho AI Similarity Computation)
-- Mục đích: Lưu cache vector đã tính sẵn, tránh tính lại mỗi request
CREATE TABLE IF NOT EXISTS product_vectors (
    product_id       INT PRIMARY KEY,
    -- TF-IDF vector: { "laptop": 0.35, "gaming": 0.28, "asus": 0.21, ... }
    tfidf_vector     JSON,
    -- One-hot encoding danh mục (category_id -> binary): [0,1,0,0,1,...]
    category_vector  JSON,
    -- Normalized price tier (1-5): 1=rất rẻ (<100K), 5=rất cao (>10M)
    price_tier       TINYINT DEFAULT 3,
    -- Attribute tags vector: { "ram_16gb": 1, "color_black": 1, "size_xl": 1 }
    attribute_vector JSON,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Bảng Product Metrics (Chỉ số tổng hợp hiệu suất & Popularity Score)
-- Mục đích: Dùng cho Trending/Hot Items và Hybrid Recommendation
CREATE TABLE IF NOT EXISTS product_metrics (
    product_id       INT PRIMARY KEY,
    views_count      INT DEFAULT 0,
    carts_count      INT DEFAULT 0,
    wishlist_count   INT DEFAULT 0,
    purchases_count  INT DEFAULT 0,
    rating_avg       DECIMAL(3, 2) DEFAULT 0.00,  -- Trung bình điểm đánh giá (1.00-5.00)
    rating_count     INT DEFAULT 0,
    -- Điểm xu hướng tổng hợp (Popularity): tính từ views + carts + purchases * trọng số
    popularity_score DECIMAL(10, 2) DEFAULT 0.00,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================
-- MODULE 4: TƯƠNG TÁC & PHẢN HỒI NGƯỜI DÙNG (FEEDBACK ENGINE)
-- =============================================================

-- 10. Bảng Search Logs (Nhật ký tìm kiếm thông minh)
-- Mục đích: Phân tích xu hướng từ khóa, cải thiện gợi ý dựa trên search context
CREATE TABLE IF NOT EXISTS search_logs (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT,                         -- NULL = khách vãng lai
    session_id          VARCHAR(128),
    query_text          VARCHAR(500) NOT NULL,        -- Từ khóa gốc người dùng nhập
    normalized_query    VARCHAR(500),                 -- Từ khóa đã chuẩn hóa (lowercase, bỏ dấu)
    -- Bộ lọc người dùng áp dụng khi search: {"category":1,"min_price":100000,"rating_min":4}
    filters_applied     JSON,
    results_count       INT DEFAULT 0,               -- Số kết quả trả về
    -- Sản phẩm người dùng nhấp vào từ kết quả search (hành vi quan trọng nhất)
    clicked_product_id  INT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (clicked_product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_search_user (user_id),
    INDEX idx_search_query (query_text(100)),
    INDEX idx_search_time (created_at)
) ENGINE=InnoDB;

-- 11. Bảng User Behavior Logs (Nhật ký tương tác thụ động - Implicit Feedback)
-- THAY THẾ bảng user_interactions cũ với mô hình tracking sâu và đầy đủ hơn
-- Mục đích: Thu thập dữ liệu hành vi để huấn luyện mô hình gợi ý theo thời gian thực
CREATE TABLE IF NOT EXISTS user_behavior_logs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    session_id      VARCHAR(128),
    product_id      INT NOT NULL,
    -- 10 loại hành vi từ thụ động đến chủ động, mỗi loại có trọng số (weight)
    action_type     ENUM(
                      'search_click',    -- Click từ kết quả search              (weight: 2)
                      'product_view',    -- Vào trang xem sản phẩm               (weight: 1)
                      'dwell_time_high', -- Dừng lại xem chi tiết > 15 giây      (weight: 2)
                      'wishlist_add',    -- Thêm vào danh sách yêu thích          (weight: 3)
                      'cart_add',        -- Thêm vào giỏ hàng                     (weight: 4)
                      'cart_remove',     -- Xóa khỏi giỏ hàng (tín hiệu tiêu cực)(weight: -2)
                      'checkout_start',  -- Bắt đầu tiến hành thanh toán         (weight: 4)
                      'purchase',        -- Đặt hàng thành công                   (weight: 5)
                      'feed_view',       -- Xem bài đăng/livestream liên quan     (weight: 1)
                      'share'            -- Chia sẻ sản phẩm (tín hiệu rất mạnh) (weight: 3)
                    ) NOT NULL,
    weight          SMALLINT NOT NULL,               -- Trọng số điểm tích lũy hành vi
    -- Thời gian người dùng ở lại trang sản phẩm (đơn vị: giây)
    dwell_seconds   SMALLINT UNSIGNED DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    -- Composite index tối ưu cho query "lấy tất cả hành vi của user X theo thời gian"
    INDEX idx_behavior_user_time (user_id, created_at DESC),
    -- Composite index tối ưu cho query "sản phẩm nào được tương tác nhiều nhất"
    INDEX idx_behavior_product_action (product_id, action_type)
) ENGINE=InnoDB;

-- 12. Bảng User Wishlist (Danh sách yêu thích)
CREATE TABLE IF NOT EXISTS user_wishlist (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    product_id      INT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uq_wishlist (user_id, product_id)
) ENGINE=InnoDB;

-- 13. Bảng Product Reviews (Đánh giá & Phản hồi chủ động - Explicit Feedback)
-- Mục đích: Thu thập phản hồi có chủ ý để hiệu chỉnh mô hình gợi ý
CREATE TABLE IF NOT EXISTS product_reviews (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT NOT NULL,
    product_id       INT NOT NULL,
    order_id         INT,
    rating           TINYINT NOT NULL,              -- Điểm đánh giá 1-5 sao
    comment          TEXT,
    -- Điểm phân tích cảm xúc từ AI (Sentiment Analysis)
    -- Khoảng giá trị: -1.0 (rất tiêu cực) đến +1.0 (rất tích cực)
    sentiment_score  DECIMAL(4, 3) DEFAULT 0.000,
    -- Hình ảnh thực tế đính kèm (JSON array of URLs)
    images           JSON,
    likes_count      INT DEFAULT 0,                 -- Số lượt "Hữu ích" từ user khác
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    -- Mỗi user chỉ đánh giá 1 lần cho mỗi sản phẩm (có thể chỉnh sửa)
    UNIQUE KEY uq_review (user_id, product_id),
    INDEX idx_review_product (product_id),
    INDEX idx_review_rating (rating)
) ENGINE=InnoDB;

-- =============================================================
-- MODULE 5: THƯƠNG MẠI (COMMERCE CORE)
-- =============================================================

-- 14. Bảng Cart Items (Giỏ hàng)
CREATE TABLE IF NOT EXISTS cart_items (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    product_id      INT NOT NULL,
    quantity        INT NOT NULL DEFAULT 1,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uq_cart (user_id, product_id)
) ENGINE=InnoDB;

-- 15. Bảng Orders (Đơn hàng)
CREATE TABLE IF NOT EXISTS orders (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT NOT NULL,
    total_amount     DECIMAL(12, 2) NOT NULL,
    status           ENUM('pending', 'confirmed', 'processing', 'shipping', 'completed', 'cancelled', 'refunded') DEFAULT 'pending',
    shipping_address TEXT NOT NULL,
    payment_method   ENUM('cod', 'bank_transfer', 'e_wallet', 'credit_card') DEFAULT 'cod',
    note             TEXT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_status (status)
) ENGINE=InnoDB;

-- 16. Bảng Order Items (Chi tiết đơn hàng)
CREATE TABLE IF NOT EXISTS order_items (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT NOT NULL,
    product_id      INT,
    product_name    VARCHAR(255),                    -- Lưu tên SP tại thời điểm đặt hàng
    quantity        INT NOT NULL,
    unit_price      DECIMAL(12, 2) NOT NULL,         -- Giá tại thời điểm đặt hàng
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB;
