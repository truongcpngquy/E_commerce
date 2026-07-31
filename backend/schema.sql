-- =============================================================
-- SMART E-COMMERCE DATABASE SCHEMA v2.0
-- Architecture: Multi-Dimensional Enterprise Schema
-- Designed for: AI Recommendation Engine + Smart Search System
-- Engine: InnoDB | Charset: UTF8MB4 | Author: Senior Lead Engineer
-- =============================================================

CREATE DATABASE IF NOT EXISTS shopee_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shopee_db;

-- Clean existing tables if schema changed
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS product_reviews;
DROP TABLE IF EXISTS user_wishlist;
DROP TABLE IF EXISTS user_behavior_logs;
DROP TABLE IF EXISTS search_logs;
DROP TABLE IF EXISTS product_metrics;
DROP TABLE IF EXISTS product_vectors;
DROP TABLE IF EXISTS product_attributes;
DROP TABLE IF EXISTS product_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS stores;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS user_contexts;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS user_interactions;
SET FOREIGN_KEY_CHECKS = 1;


-- =============================================================
-- MODULE 1: NGƯỜI DÙNG (USER PROFILING, ROLES & CONTEXT)
-- =============================================================

-- 1. Bảng Roles (Danh mục Vai trò / Cấp quyền)
CREATE TABLE IF NOT EXISTS roles (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(50) UNIQUE NOT NULL,
    description   VARCHAR(255),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Bảng Users (Tài khoản xác thực)
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

-- 3. Bảng Trung Gian User_Roles (Phân quyền Nhiều - Nhiều)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id       INT NOT NULL,
    role_id       INT NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    INDEX idx_user_roles_user (user_id),
    INDEX idx_user_roles_role (role_id)
) ENGINE=InnoDB;

-- 2. Bảng User Profiles (Chân dung & Sở thích Khách hàng)
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id              INT PRIMARY KEY,
    full_name            VARCHAR(150),
    gender               ENUM('male', 'female', 'other', 'unspecified') DEFAULT 'unspecified',
    date_of_birth        DATE,
    phone                VARCHAR(20),
    avatar_url           VARCHAR(500),
    city                 VARCHAR(100),
    district             VARCHAR(100),
    preferred_categories JSON,
    price_sensitivity    ENUM('budget', 'mid-range', 'premium') DEFAULT 'mid-range',
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Bảng User Contexts (Ngữ cảnh thực tế phiên truy cập)
CREATE TABLE IF NOT EXISTS user_contexts (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT,
    session_id    VARCHAR(128) NOT NULL,
    device_type   ENUM('mobile', 'tablet', 'desktop') DEFAULT 'desktop',
    os_platform   VARCHAR(50),
    client_ip     VARCHAR(45),
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

-- 5. Bảng Categories (Danh mục đa cấp - Category Tree)
CREATE TABLE IF NOT EXISTS categories (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    parent_id     INT DEFAULT NULL,
    name          VARCHAR(150) NOT NULL,
    slug          VARCHAR(150) UNIQUE NOT NULL,
    image_url     VARCHAR(500),
    level         TINYINT DEFAULT 1,
    sort_order    INT DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_cat_parent (parent_id),
    INDEX idx_cat_level (level)
) ENGINE=InnoDB;

-- =============================================================
-- MODULE 2.5: GIAN HÀNG & CỬA HÀNG (MERCHANT STORES)
-- =============================================================

-- 5.5. Bảng Stores (Gian hàng Cửa hàng của Người Bán)
CREATE TABLE IF NOT EXISTS stores (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    owner_id        INT NOT NULL,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) UNIQUE NOT NULL,
    logo_url        VARCHAR(500),
    banner_url      VARCHAR(500),
    description     TEXT,
    rating_avg      DECIMAL(3, 2) DEFAULT 5.00,
    followers_count INT DEFAULT 0,
    response_rate   DECIMAL(5, 2) DEFAULT 99.00,
    response_time   VARCHAR(100) DEFAULT 'Trong vài phút',
    is_official     TINYINT DEFAULT 0,
    status          ENUM('active', 'suspended', 'pending') DEFAULT 'active',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_stores_slug (slug),
    INDEX idx_stores_owner (owner_id),
    INDEX idx_stores_official (is_official)
) ENGINE=InnoDB;

-- =============================================================
-- MODULE 3: SẢN PHẨM ĐA CHIỀU (RICH PRODUCT CONTENT & TAGS ENGINE)
-- =============================================================

-- 6. Bảng Products (Thông tin cốt lõi sản phẩm)
CREATE TABLE IF NOT EXISTS products (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    store_id         INT,
    brand_id         INT,
    category_id      INT,
    sku              VARCHAR(100) UNIQUE,
    name             VARCHAR(255) NOT NULL,
    description      TEXT,
    original_price   DECIMAL(12, 2) NOT NULL,
    discount_percent TINYINT UNSIGNED DEFAULT 0,
    price            DECIMAL(12, 2) NOT NULL,
    stock            INT DEFAULT 0,
    image_url        VARCHAR(500),
    tags             TEXT,
    status           ENUM('draft', 'active', 'out_of_stock', 'archived') DEFAULT 'active',
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id)    REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (brand_id)    REFERENCES brands(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_products_store (store_id),
    INDEX idx_products_category (category_id),
    INDEX idx_products_brand (brand_id),
    INDEX idx_products_status (status),
    INDEX idx_products_price (price),
    FULLTEXT INDEX ft_products_search (name, description, tags)
) ENGINE=InnoDB;

-- 7. Bảng Tags (Thẻ danh mục từ khóa chuẩn hóa 3NF phân loại theo Loại Tags)
-- type: 'style' (Thời trang/Vẻ đẹp), 'tech' (Công nghệ/Thiết bị), 'usage' (Mục đích sử dụng), 'segment' (Phân khúc/Trend), 'general'
CREATE TABLE IF NOT EXISTS tags (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(100) UNIQUE NOT NULL,
    slug             VARCHAR(100) UNIQUE NOT NULL,
    type             ENUM('style', 'tech', 'usage', 'segment', 'general') DEFAULT 'general',
    usage_count      INT DEFAULT 0,
    search_count     INT DEFAULT 0,
    is_trending      TINYINT(1) DEFAULT 0,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tags_type (type),
    INDEX idx_tags_trending (is_trending),
    INDEX idx_tags_usage (usage_count DESC)
) ENGINE=InnoDB;

-- 8. Bảng Product Tags (Liên kết Quan hệ Nhiều-Nhiều N:N giữa Products và Tags)
CREATE TABLE IF NOT EXISTS product_tags (
    product_id       INT NOT NULL,
    tag_id           INT NOT NULL,
    PRIMARY KEY (product_id, tag_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    INDEX idx_pt_tag (tag_id)
) ENGINE=InnoDB;

-- 9. Bảng Product Attributes (Thuộc tính sản phẩm EAV)
CREATE TABLE IF NOT EXISTS product_attributes (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    product_id       INT NOT NULL,
    attribute_key    VARCHAR(100) NOT NULL,
    attribute_value  VARCHAR(255) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_attr_product (product_id),
    INDEX idx_attr_key_value (attribute_key, attribute_value(50))
) ENGINE=InnoDB;

-- 10. Bảng Product Vectors (Vector thuộc tính sản phẩm)
CREATE TABLE IF NOT EXISTS product_vectors (
    product_id       INT PRIMARY KEY,
    tfidf_vector     JSON,
    category_vector  JSON,
    price_tier       TINYINT DEFAULT 3,
    attribute_vector JSON,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. Bảng Product Metrics (Chỉ số tổng hợp hiệu suất & Popularity Score)
CREATE TABLE IF NOT EXISTS product_metrics (
    product_id       INT PRIMARY KEY,
    views_count      INT DEFAULT 0,
    carts_count      INT DEFAULT 0,
    wishlist_count   INT DEFAULT 0,
    purchases_count  INT DEFAULT 0,
    rating_avg       DECIMAL(3, 2) DEFAULT 0.00,
    rating_count     INT DEFAULT 0,
    popularity_score DECIMAL(10, 2) DEFAULT 0.00,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================
-- MODULE 4: TƯƠNG TÁC & PHẢN HỒI NGƯỜI DÙNG (FEEDBACK ENGINE)
-- =============================================================

-- 12. Bảng Search Logs (Nhật ký tìm kiếm thông minh)
CREATE TABLE IF NOT EXISTS search_logs (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT,
    session_id          VARCHAR(128),
    query_text          VARCHAR(500) NOT NULL,
    normalized_query    VARCHAR(500),
    filters_applied     JSON,
    results_count       INT DEFAULT 0,
    clicked_product_id  INT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (clicked_product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_search_user (user_id),
    INDEX idx_search_query (query_text(100)),
    INDEX idx_search_time (created_at)
) ENGINE=InnoDB;

-- 13. Bảng User Behavior Logs (Nhật ký tương tác thụ động - Implicit Feedback)
CREATE TABLE IF NOT EXISTS user_behavior_logs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    session_id      VARCHAR(128),
    product_id      INT NOT NULL,
    action_type     ENUM(
                      'search_click',
                      'product_view',
                      'dwell_time_high',
                      'wishlist_add',
                      'cart_add',
                      'cart_remove',
                      'checkout_start',
                      'purchase',
                      'feed_view',
                      'share'
                    ) NOT NULL,
    weight          SMALLINT NOT NULL,
    dwell_seconds   SMALLINT UNSIGNED DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_behavior_user_time (user_id, created_at DESC),
    INDEX idx_behavior_product_action (product_id, action_type)
) ENGINE=InnoDB;

-- 14. Bảng User Wishlist (Danh sách yêu thích)
CREATE TABLE IF NOT EXISTS user_wishlist (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    product_id      INT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY uq_wishlist (user_id, product_id)
) ENGINE=InnoDB;

-- =============================================================
-- MODULE 5: THƯƠNG MẠI (COMMERCE CORE)
-- =============================================================

-- 15. Bảng Cart Items (Giỏ hàng)
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

-- 16. Bảng Orders (Đơn hàng)
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

-- 17. Bảng Order Items (Chi tiết đơn hàng)
CREATE TABLE IF NOT EXISTS order_items (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT NOT NULL,
    product_id      INT,
    product_name    VARCHAR(255),
    quantity        INT NOT NULL,
    unit_price      DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB;

-- 18. Bảng Product Reviews (Đánh giá & Phản hồi chủ động - Explicit Feedback)
CREATE TABLE IF NOT EXISTS product_reviews (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT NOT NULL,
    product_id       INT NOT NULL,
    order_id         INT,
    rating           TINYINT NOT NULL,
    comment          TEXT,
    sentiment_score  DECIMAL(4, 3) DEFAULT 0.000,
    images           JSON,
    likes_count      INT DEFAULT 0,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    UNIQUE KEY uq_review (user_id, product_id),
    INDEX idx_review_product (product_id),
    INDEX idx_review_rating (rating)
) ENGINE=InnoDB;
