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
Dự án được tích hợp một hệ thống Trí tuệ Nhân tạo (AI) chuyên sâu về phân tích dữ liệu và gợi ý sản phẩm lai (Hybrid Recommendation System). Hệ thống này hoạt động theo thời gian thực (Real-time) và kết hợp tinh hoa của nhiều mô hình tính toán để tối ưu hóa tỷ lệ chuyển đổi (Conversion Rate) và trải nghiệm người dùng (UX):

#### A. Kiến trúc Thuật toán (Algorithm Architecture)
1. **Content-Based Filtering (CBF - Lọc theo nội dung)**:
   - **Xử lý Ngôn ngữ Tự nhiên (NLP)**: Hệ thống sử dụng bộ Tokenizer tự xây dựng kết hợp danh sách từ dừng (Stop-words) của tiếng Việt và tiếng Anh để lọc sạch nhiễu.
   - **Mô hình Hóa Văn bản (Text Vectorization)**: Áp dụng thuật toán **TF-IDF (Term Frequency-Inverse Document Frequency)** để phân tích tổng hợp các trường dữ liệu: Tên sản phẩm, Mô tả chi tiết, Tags từ khóa và Danh mục. Thuật toán này giúp xác định các từ khóa đặc trưng nhất của mỗi sản phẩm.
   - **Đo lường Khoảng cách (Cosine Similarity)**: Tính toán góc giữa các vector TF-IDF của sản phẩm để tìm ra mức độ tương đồng (0 đến 1).
   - **Category Synergy Multiplier**: Tích hợp cơ chế nhân hệ số tương đồng lên **1.35 lần (Bonus 35%)** nếu hai sản phẩm cùng danh mục, giúp kết quả gợi ý sát với nhu cầu thực tế hơn.

2. **Item-Based Collaborative Filtering (CF - Lọc cộng tác theo vật phẩm)**:
   - Thay vì so sánh người dùng với nhau (User-Based), hệ thống xây dựng **Ma trận Item-User** từ lịch sử hành vi của toàn bộ hệ thống.
   - Bằng cách phân tích độ lớn vector người dùng tương tác (Item Magnitudes) và tích vô hướng (Dot Product) của các sản phẩm, mô hình sẽ tính được độ tương đồng chéo giữa các vật phẩm thông qua hành vi của đám đông (Ví dụ: "Khách hàng mua điện thoại A cũng thường mua ốp lưng B").

3. **Thuật toán Gợi ý Lai (Weighted Hybrid Scoring)**:
   - Để khắc phục triệt để nhược điểm "Cold Start" (Thiếu dữ liệu của người dùng mới), điểm số cá nhân hóa cuối cùng là phép lai (Hybrid) có trọng số: **50% điểm CBF + 50% điểm CF**.

#### B. Cơ chế Theo dõi Hành vi (Implicit Feedback Tracking)
Mọi thao tác của người dùng trên nền tảng đều được thu thập dưới dạng phản hồi ẩn (Implicit Feedback) và lưu vào cơ sở dữ liệu `user_behavior_logs` với các trọng số (Weights) được tinh chỉnh:
- **Mua hàng (Purchase)**: 5 điểm (Tương tác mạnh nhất, thể hiện nhu cầu chắc chắn).
- **Thêm vào giỏ / Tiến hành thanh toán (Cart/Checkout)**: 4 điểm (Tương tác mua sắm cao).
- **Yêu thích (Like/Wishlist)**: 3 điểm (Sự quan tâm rõ rệt).
- **Tìm kiếm & Click (Search_Click)**: 2 điểm (Tương tác có chủ đích).
- **Xem sản phẩm (View/Dwell_time)**: 1 điểm (Tương tác khám phá).

Hệ thống sẽ tổng hợp Vector Sở thích (User Profile Vector) từ các trọng số này để so khớp (Cosine Similarity) với tập sản phẩm chưa tương tác. Các sản phẩm đã Mua (trọng số >= 5) sẽ được lọc khỏi danh sách đề xuất để tránh spam gợi ý lại.

#### C. Kịch bản Đề xuất Linh hoạt (Recommendation Scenarios)
1. **Sản phẩm Tương tự (Similar Products)**: Hiển thị ngay dưới chân trang Chi tiết Sản phẩm dựa thuần túy vào thuật toán TF-IDF (CBF).
2. **Gợi ý Cá nhân hóa (Personalized Recommendations)**: Hiển thị ở Trang chủ, tính toán theo thời gian thực (Real-time) từ thuật toán Hybrid, thay đổi ngay lập tức sau mỗi lượt click của người dùng.
3. **Gợi ý theo Ngữ cảnh (Contextual / Search-based)**: Tự động trích xuất các từ khóa (Keywords) trong 5 lượt tìm kiếm gần nhất để gợi ý sản phẩm khớp từ khóa.
4. **Fallback Cơ chế Thịnh hành (Trending Products)**: Khi người dùng hoàn toàn mới (Incognito / No-history), hệ thống mặc định rẽ nhánh về việc đề xuất các Sản phẩm Nổi bật có điểm Popularity Score cao nhất.

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
