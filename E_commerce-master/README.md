# Shopee Clone với Hệ thống Gợi ý (Content-Based Filtering)

Ứng dụng thương mại điện tử (Shopee Clone) hoàn chỉnh bao gồm Frontend (ReactJS), Backend (Node.js/Express) và Cơ sở dữ liệu (MySQL) tích hợp công nghệ gợi ý sản phẩm cá nhân hóa.

---

## 🛠️ Công nghệ Sử dụng

*   **Frontend**: ReactJS (Vite), React Router DOM, Lucide Icons.
    *   *UI Framework*: **Không sử dụng** (Dự án được thiết kế thủ công bằng **Vanilla CSS/CSS Modules** tùy chỉnh, không dùng Tailwind CSS, Bootstrap hay Material-UI).
*   **Backend**: Node.js, Express, MySQL2 (Promise pool), JWT, BcryptJS.
*   **Thuật toán Gợi ý (Content-Based Filtering)**: TF-IDF (Term Frequency-Inverse Document Frequency) kết hợp Cosine Similarity.

---

## 📋 Đặc tả dự án (Project Specifications)

### 1. Yêu cầu chức năng (Functional Requirements)
- **Hệ thống Người dùng (User Roles)**: 
  - *Khách hàng (Customer)*: Đăng ký/Đăng nhập, duyệt danh mục, tìm kiếm, xem chi tiết sản phẩm, quản lý giỏ hàng, đặt hàng, quản lý đơn hàng, nhận gợi ý sản phẩm cá nhân hóa.
  - *Người bán (Seller)*: Quản lý kênh người bán, đăng bán sản phẩm mới, cập nhật thông tin sản phẩm, xử lý đơn hàng của shop, gắn tags cho sản phẩm.
  - *Quản trị viên (Admin)*: Quản lý người dùng, cửa hàng và giám sát hoạt động hệ thống.
- **Tính năng Cốt lõi (Core Features)**:
  - Giỏ hàng & Đặt hàng (Cart & Checkout): Thêm/xóa sản phẩm, tính tổng tiền, đặt hàng.
  - Hệ thống Gợi ý (Recommendation Engine): Đề xuất sản phẩm tương tự khi xem chi tiết (Similar Products) và đề xuất cá nhân hóa trên trang chủ (Personalized) dựa trên lịch sử tương tác (view, like, cart, buy).
- **Cơ sở dữ liệu (Database)**: Thiết kế chuẩn hóa (Normalization) tối ưu các bảng Users, Stores, Products, Orders, OrderItems, UserInteractions...

### 2. Yêu cầu phi chức năng (Non-Functional Requirements)
- **Bảo mật (Security)**: Mã hóa mật khẩu bằng Bcrypt, xác thực bằng JWT, chống SQL Injection thông qua query tham số hóa.
- **Hiệu năng (Performance)**: Giao diện tối ưu nhẹ nhàng, kết nối CSDL sử dụng connection pool.
- **UI/UX**: Giao diện Responsive (tương thích đa thiết bị) viết bằng Vanilla CSS với hiệu ứng mượt mà.

### 3. Hệ thống Khuyến nghị Thông minh (AI Recommendation Engine)
Dự án tích hợp hệ thống AI lai (Hybrid Recommendation) kết hợp giữa hai thuật toán cốt lõi để cá nhân hóa trải nghiệm:
- **Content-Based Filtering (CBF)**: Sử dụng TF-IDF và Cosine Similarity để phân tích thuộc tính văn bản của sản phẩm (tên, mô tả, tags). Giúp gợi ý các "Sản phẩm tương tự" (Similar Products) ngay tại trang chi tiết.
- **Item-based Collaborative Filtering (CF)**: Xây dựng ma trận Item-User và tính toán khoảng cách tương đồng giữa các sản phẩm dựa trên hành vi của đám đông.
- **Theo vết Hành vi (Implicit Feedback)**: Ghi nhận mọi tương tác của người dùng với các trọng số (Weights) khác nhau: Mua hàng (5 điểm), Thêm giỏ/Checkout (4 điểm), Thích (3 điểm), Tìm kiếm (2 điểm), Xem (1 điểm)... để đo lường độ quan tâm chính xác.
- **Thuật toán Lai (Hybrid Scoring)**: Điểm gợi ý cá nhân hóa (Personalized Recommendations) trên trang chủ là kết quả kết hợp (50% CBF + 50% CF), giúp khắc phục nhược điểm "Cold Start" của hệ thống truyền thống.
- **Gợi ý theo Ngữ cảnh (Contextual)**: Hỗ trợ gợi ý dựa trên từ khóa tìm kiếm gần đây hoặc tự động fallback về các sản phẩm Thịnh hành (Trending) nếu người dùng hoàn toàn mới.

---

## 📦 Cấu trúc Thư mục

```text
e_commerce/
├── backend/
│   ├── config/db.js          # Kết nối cơ sở dữ liệu MySQL pool
│   ├── controllers/          # Bộ điều khiển API (Auth, Cart, Orders, Recommendations, Products)
│   ├── middleware/auth.js    # JWT Authentication Middleware
│   ├── routes/               # Định nghĩa các Route API
│   ├── utils/                # Thuật toán gợi ý Content-Based Filtering
│   ├── .env                  # Cấu hình môi trường (Port, Database, JWT secret)
│   ├── schema.sql            # File khởi tạo cấu trúc bảng MySQL
│   ├── seed.js               # Script tạo dữ liệu mẫu phong phú
│   ├── server.js             # File khởi chạy server chính
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/       # Component dùng chung (Header/Navbar)
    │   ├── context/          # Quản lý state toàn cục (AppContext)
    │   ├── pages/            # Các trang giao diện chính (Home, Detail, Cart, Orders, Seller, Auth)
    │   ├── App.jsx           # Cấu hình Routing và Toast notifications
    │   ├── index.css         # Hệ thống giao diện CSS đẹp mắt
    │   └── main.jsx
    └── package.json
```

---

## 🚀 Hướng dẫn Cài đặt & Chạy ứng dụng

### 1. Cấu hình Cơ sở dữ liệu (MySQL)
Mở file `backend/.env` và cập nhật thông tin tài khoản MySQL của bạn:
```env
PORT=5000
DB_HOST=localhost
DB_USER=tên_user_mysql        # Ví dụ: root
DB_PASSWORD=mật_khẩu_mysql    # Điền mật khẩu MySQL của bạn vào đây
DB_NAME=shopee_db
JWT_SECRET=shopee_clone_secret_key_12345
```

### 2. Khởi tạo Cơ sở dữ liệu & Tạo Dữ liệu mẫu (Seed Data)
Mở terminal tại thư mục `/backend` và chạy lệnh sau để tự động tạo cơ sở dữ liệu, các bảng và dữ liệu tương tác mẫu:
```bash
cd backend
npm run seed
```

### 3. Chạy Backend
Khởi chạy server backend (chạy trên cổng `5000`):
```bash
npm run dev
```

### 4. Chạy Frontend
Mở một terminal khác tại thư mục `/frontend` và chạy:
```bash
cd frontend
npm run dev
```
Trình duyệt sẽ tự động mở ứng dụng tại địa chỉ `http://localhost:5173`.

---

## 💡 Cách Kiểm thử Hệ thống Gợi ý (Content-Based Filtering)

Hệ thống gợi ý hoạt động trên hai khía cạnh chính:

### A. Gợi ý Sản phẩm Tương tự (Similar Products)
1. Truy cập vào trang chi tiết bất kỳ sản phẩm nào (ví dụ: **Laptop ASUS TUF Gaming**).
2. Cuộn xuống chân trang, bạn sẽ thấy mục **"Sản phẩm tương tự"** hiển thị danh sách các sản phẩm máy tính khác (Dell XPS, Macbook Air) kèm tỷ lệ trùng khớp (ví dụ: **Khớp 84%**).
3. Độ trùng khớp này được tính bằng **Cosine Similarity** dựa trên các tags của sản phẩm.

### B. Gợi ý Cá nhân hóa (Personalized Recommendations)
Dữ liệu mẫu (Seed Data) được cấu hình sẵn 2 tài khoản test với hành vi sở thích khác nhau:

1. **Tài khoản Khách hàng thích Công nghệ (`customer1`)**:
    *   *Đăng nhập*: Username: `customer1` | Mật khẩu: `123456`.
    *   *Hành vi mẫu*: Đã xem Laptop Asus, đã thích Chuột Logitech, đã thêm vào giỏ Bàn phím Akko.
    *   *Kết quả gợi ý*: Tại trang chủ, mục **"Gợi ý dành riêng cho bạn"** sẽ ưu tiên đề xuất các sản phẩm công nghệ khác như *Laptop Dell XPS*, *Macbook Air*, *Tai nghe JBL* với tỷ lệ phần trăm tương đồng cao.

2. **Tài khoản Khách hàng thích Thời trang (`customer2`)**:
    *   *Đăng nhập*: Username: `customer2` | Mật khẩu: `123456`.
    *   *Hành vi mẫu*: Đã xem Váy đầm nữ dáng xòe, đã mua Chân váy tennis, đã thích Áo thun tay lỡ.
    *   *Kết quả gợi ý*: Mục gợi ý trang chủ sẽ đề xuất các trang phục thời trang nữ khác.

3. **Tính năng đăng bán sản phẩm & gán tags của Người bán (`seller1`)**:
    *   *Đăng nhập*: Username: `seller1` | Mật khẩu: `123456`.
    *   *Hành động*: Vào **Kênh người bán** ở menu dropdown góc phải, đăng bán sản phẩm mới và gán các **tags** phù hợp. Thuật toán gợi ý sẽ tự động phân tích sản phẩm mới này để đề xuất đến những khách hàng có sở thích tương thích ngay lập tức!
