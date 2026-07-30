# Shopee Clone với Hệ thống Gợi ý (Content-Based Filtering)

Ứng dụng thương mại điện tử (Shopee Clone) hoàn chỉnh bao gồm Frontend (ReactJS), Backend (Node.js/Express) và Cơ sở dữ liệu (MySQL) tích hợp công nghệ gợi ý sản phẩm cá nhân hóa.

---

## 🛠️ Công nghệ Sử dụng

*   **Frontend**: ReactJS (Vite), React Router DOM, Lucide Icons.
    *   *UI Framework*: **Không sử dụng** (Dự án được thiết kế thủ công bằng **Vanilla CSS/CSS Modules** tùy chỉnh, không dùng Tailwind CSS, Bootstrap hay Material-UI).
*   **Backend**: Node.js, Express, MySQL2 (Promise pool), JWT, BcryptJS.
*   **Thuật toán Gợi ý (Content-Based Filtering)**: TF-IDF (Term Frequency-Inverse Document Frequency) kết hợp Cosine Similarity.

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
