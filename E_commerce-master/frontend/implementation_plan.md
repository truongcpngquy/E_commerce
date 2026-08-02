# Implementation Plan: FE Architecture Refactoring & Smart E-Commerce Integration

Với vai trò **Kỹ sư Trưởng (Lead Fullstack Engineer 10+ năm kinh nghiệm)**, bản kế hoạch tái cấu trúc mã nguồn Frontend này được thiết kế theo các tiêu chuẩn kiến trúc hiện đại (**Feature-First / Domain-Driven Architecture**), đáp ứng tính mở rộng (scalability), hiệu năng cao (performance) và tối ưu trải nghiệm người dùng với hệ thống **E-Commerce Thông minh (Smart Recommendation & Search System)**.

---

## 🏗 System Architectural Vision (Góc nhìn Kỹ sư 10 năm kinh nghiệm)

Hiện tại, mã nguồn Frontend đang mắc phải những hạn chế kiến trúc của một ứng dụng thử nghiệm (MVP):
1. **Monolithic State Management**: Toàn bộ state (Auth, Cart, Products, Orders, Recommendations, UI Toasts) bị dồn chung trong một `AppContext.jsx` duy nhất (> 380 dòng code). Điều này gây ra hiện tượng **Unnecessary Re-renders** trên toàn bộ cây thành phần khi bất kỳ state nhỏ nào thay đổi.
2. **Raw `fetch` API Calls & Duplicate Logic**: Các hàm gọi API dùng `fetch` thủ công phân tán ở khắp nơi, thiếu cơ chế Interceptors để quản lý JWT Token, Error handling tập trung, Retry mechanism và Request cancellation.
3. **Flat Routing & Lack of Guarding**: Router chỉ sử dụng các `<Route>` đơn giản, chưa tách Layout (Main Layout, Auth Layout, Seller Layout), chưa có Protected Guard kiểm tra phân quyền (Customer vs Seller).
4. **Smart Search & Tracking chưa tối ưu trên FE**: Lợi thế của thuật toán **Content-Based Recommendation Engine** ở Backend chưa phát huy tối đa do Frontend chưa tích hợp Search Debouncing, URL Query Syncing và Auto Behavioral Tracking (lưu vết tương tác view / cart / buy).

---

## 🎯 Mục Tiêu Tái Cấu Trúc (Refactoring Goals)

1. **API Infrastructure (`axios`)**: Xây dựng lớp HTTP Service chuyên nghiệp với `axiosClient` hỗ trợ Request/Response Interceptors, Auto Bearer Token Authorization Header, Error Handler chuẩn hóa.
2. **State Management (`redux-toolkit`)**: Tách biệt state thành các **Redux Slices** theo domain (`authSlice`, `productSlice`, `cartSlice`, `orderSlice`, `recommendationSlice`, `uiSlice`).
3. **Router Architecture (`react-router-dom`)**: Xây dựng Router có cấu trúc Layouts, Auth Guard & Role Guard (Seller Dashboard), đồng bộ state Tìm kiếm thông minh với URL Search Params (`useSearchParams`).
4. **Smart Recommendation & Search Integration**: 
   - **Smart Search Bar**: Tích hợp Auto-suggestion, Keyword Debouncing (300ms), Search History.
   - **Behavioral Tracking Service**: Tự động ghi nhận log tương tác (Xem sản phẩm = 1đ, Thêm giỏ hàng = 3đ, Mua hàng = 5đ) để huấn luyện mô hình gợi ý theo thời gian thực.
   - **Personalized Feed & Similar Products Widgets**: Hiển thị sản phẩm gợi ý cá nhân hóa và sản phẩm tương tự dựa trên vector thuộc tính.

---

## 📐 Kiến Trúc Thư Mục Mục Tiêu (Target Folder Structure)

```text
frontend/src/
├── api/                        # Axios Client & Modular API Services
│   ├── axiosClient.js          # Base Axios Instance + Interceptors
│   ├── authApi.js              # Authentication APIs
│   ├── productApi.js           # Products & Search APIs
│   ├── cartApi.js              # Shopping Cart APIs
│   ├── orderApi.js             # Order Processing APIs
│   └── recommendationApi.js   # Smart Search & AI Recommendation APIs
│
├── store/                      # Redux Toolkit Central Store & Slices
│   ├── index.js                # Store Configuration
│   └── slices/
│       ├── authSlice.js        # User state, Auth status, Token
│       ├── productSlice.js     # Product list, Selected product, Filters
│       ├── cartSlice.js        # Cart items, Totals, Quantities
│       ├── orderSlice.js       # User orders history
│       ├── recommendationSlice.js # Personalized & Similar product suggestions
│       └── uiSlice.js          # Toast notifications, Global modals/loaders
│
├── routes/                     # Router Configuration & Guards
│   ├── AppRoutes.jsx           # Main Route Definitions with Layouts
│   ├── ProtectedRoute.jsx      # Authentication & Role Authorization Guard
│   └── layouts/
│       ├── MainLayout.jsx      # Header, Main Content, Footer, Recommendation Toast
│       └── SellerLayout.jsx    # Dedicated Layout for Seller Dashboard
│
├── components/                 # Reusable UI & Smart Components
│   ├── common/                 # Header, Footer, Toast, Loading Spinner, Modal
│   ├── search/                 # Smart Search Input, Search Dropdown, History
│   ├── recommendation/         # Recommendation Banner, Similar Product Carousel
│   └── product/                # ProductCard, ProductGrid, ProductFilter
│
├── pages/                      # Page Components (Consumers of Slices)
│   ├── Home.jsx
│   ├── ProductDetail.jsx
│   ├── Cart.jsx
│   ├── Checkout.jsx
│   ├── Orders.jsx
│   ├── Auth.jsx
│   └── SellerDashboard.jsx
│
└── hooks/                      # Custom React Hooks
    ├── useReduxHooks.js        # Typed useAppDispatch & useAppSelector
    ├── useDebounce.js          # Debounce hook for Smart Search
    └── useProductTracking.js   # Hook tự động track vết tương tác người dùng
```

---

## 📋 Quyết Định Kỹ Thuật Cần User Review (User Review Required)

> [!IMPORTANT]
> 1. **Cài đặt thư viện mới**: Chúng ta sẽ cài đặt thêm `axios` vào dự án `frontend`. Redux Toolkit (`@reduxjs/toolkit`) và `react-redux` đã sẵn có trong `package.json`.
> 2. **Loại bỏ `AppContext`**: Sau khi chuyển đổi toàn bộ sang Redux Toolkit & Axios, `AppContext.jsx` sẽ được gỡ bỏ hoàn toàn để tránh dư thừa và xung đột state.

---

## ❓ Open Questions

Không có câu hỏi chặn. Tất cả yêu cầu và lộ trình kỹ thuật đã rõ ràng.

---

## 🛠 Proposed Changes & Implementation Phases

### Phase 1: Tách Lớp API với Axios (`axiosClient` & Services)

#### [NEW] [axiosClient.js](file:///d:/hethong-thongminh/E_commerce/frontend/src/api/axiosClient.js)
- Xây dựng instance `axios.create()` kết nối tới `http://localhost:5000/api`.
- Request Interceptor: Tự động trích xuất `shopee_token` từ `localStorage` và đính kèm header `Authorization: Bearer <token>`.
- Response Interceptor: Xử lý dữ liệu trả về chuẩn `response.data`. Tự động bắt lỗi HTTP `401 Unauthorized` để xóa token hết hạn và dispatch action logout.

#### [NEW] [authApi.js](file:///d:/hethong-thongminh/E_commerce/frontend/src/api/authApi.js)
- Định nghĩa các endpoint: `login`, `signup`, `getMe`.

#### [NEW] [productApi.js](file:///d:/hethong-thongminh/E_commerce/frontend/src/api/productApi.js)
- Định nghĩa các endpoint: `getProducts(params)`, `getProductById(id)`, `getCategories()`, `createProduct(data)`.

#### [NEW] [cartApi.js](file:///d:/hethong-thongminh/E_commerce/frontend/src/api/cartApi.js)
- Định nghĩa các endpoint: `getCart()`, `addToCart(productId, quantity)`, `updateCart(productId, quantity)`, `removeFromCart(productId)`.

#### [NEW] [orderApi.js](file:///d:/hethong-thongminh/E_commerce/frontend/src/api/orderApi.js)
- Định nghĩa các endpoint: `createOrder(shippingAddress)`, `getOrders()`.

#### [NEW] [recommendationApi.js](file:///d:/hethong-thongminh/E_commerce/frontend/src/api/recommendationApi.js)
- Định nghĩa các endpoint của Hệ thống Thông minh:
  - `trackInteraction({ productId, type })`: Gửi log hành vi tương tác.
  - `getPersonalizedRecommendations(limit)`: Lấy danh sách gợi ý cá nhân hóa.
  - `getSimilarProducts(productId, limit)`: Lấy gợi ý sản phẩm tương đồng dựa trên Content Vector.

---

### Phase 2: Chuyển Đổi Quản Lý State Sang Redux Toolkit

#### [NEW] [uiSlice.js](file:///d:/hethong-thongminh/E_commerce/frontend/src/store/slices/uiSlice.js)
- Quản lý Toast notification system (`showToast`, `removeToast`) và Global Loading states.

#### [NEW] [authSlice.js](file:///d:/hethong-thongminh/E_commerce/frontend/src/store/slices/authSlice.js)
- Redux Thunks: `loginUser`, `signupUser`, `fetchCurrentUser`, `logoutUser`.
- Quản lý state: `user`, `token`, `status`, `error`.

#### [NEW] [productSlice.js](file:///d:/hethong-thongminh/E_commerce/frontend/src/store/slices/productSlice.js)
- Redux Thunks: `fetchProducts`, `fetchProductById`, `fetchCategories`, `createProduct`.
- Quản lý state: `items`, `selectedProduct`, `categories`, `searchQuery`, `selectedCategory`, `loading`, `error`.

#### [NEW] [cartSlice.js](file:///d:/hethong-thongminh/E_commerce/frontend/src/store/slices/cartSlice.js)
- Redux Thunks: `fetchCart`, `addToCart`, `updateCartItem`, `removeFromCart`.
- Quản lý state: `cartItems`, `cartCount`, `loading`.

#### [NEW] [orderSlice.js](file:///d:/hethong-thongminh/E_commerce/frontend/src/store/slices/orderSlice.js)
- Redux Thunks: `fetchOrders`, `createOrder`.
- Quản lý state: `orders`, `loading`, `currentOrder`.

#### [NEW] [recommendationSlice.js](file:///d:/hethong-thongminh/E_commerce/frontend/src/store/slices/recommendationSlice.js)
- Redux Thunks: `fetchPersonalizedRecommendations`, `fetchSimilarProducts`, `trackUserInteraction`.
- Quản lý state: `personalizedList`, `similarList`, `trackingStatus`.

#### [NEW] [index.js](file:///d:/hethong-thongminh/E_commerce/frontend/src/store/index.js)
- Cấu hình Redux Store kết hợp tất cả các slices.

---

### Phase 3: Nâng Cấp Router & Layout Architecture (`react-router-dom`)

#### [NEW] [MainLayout.jsx](file:///d:/hethong-thongminh/E_commerce/frontend/src/routes/layouts/MainLayout.jsx)
- Đóng gói Header, Main Outlet, Footer, Toast Container.

#### [NEW] [ProtectedRoute.jsx](file:///d:/hethong-thongminh/E_commerce/frontend/src/routes/ProtectedRoute.jsx)
- Kiểm tra trạng thái đăng nhập. Nếu chưa đăng nhập -> Redirect đến `/auth`.
- Hỗ trợ `allowedRoles`: Ví dụ chỉ tài khoản role `seller` mới truy cập được trang `/seller`.

#### [MODIFY] [AppRoutes.jsx](file:///d:/hethong-thongminh/E_commerce/frontend/src/routes/AppRoutes.tsx) -> `AppRoutes.jsx`
- Đăng ký danh sách route rõ ràng, bọc bởi `MainLayout` và các Guard.

---

### Phase 4: Nâng Cấp Tính Năng Tìm Kiếm Thông Minh & Recommendation Widgets

#### [NEW] [useDebounce.js](file:///d:/hethong-thongminh/E_commerce/frontend/src/hooks/useDebounce.js)
- Tránh việc gửi API request liên tục mỗi khi gõ phím trong ô tìm kiếm. Trễ 300ms trước khi kích hoạt search.

#### [NEW] [useProductTracking.js](file:///d:/hethong-thongminh/E_commerce/frontend/src/hooks/useProductTracking.js)
- Custom hook tự động ghi nhận vết tương tác khi người dùng xem chi tiết sản phẩm hoặc thực hiện tìm kiếm.

#### [MODIFY] [Header.jsx](file:///d:/hethong-thongminh/E_commerce/frontend/src/components/Header.jsx)
- Tích hợp Smart Search Bar với Live Suggestions, đồng bộ từ khóa với URL qua `useSearchParams`. Tích hợp Redux Selectors (`cartCount`, `user`, `logout`).

#### [MODIFY] [Home.jsx](file:///d:/hethong-thongminh/E_commerce/frontend/src/pages/Home.jsx)
- Kết nối Redux `productSlice` & `recommendationSlice`. Hiển thị Widget "Gợi Ý Cá Nhân Hóa Dành Cho Bạn" dựa trên AI Content Filtering.

#### [MODIFY] [ProductDetail.jsx](file:///d:/hethong-thongminh/E_commerce/frontend/src/pages/ProductDetail.jsx)
- Tự động gửi log tương tác view (`trackUserInteraction`). Hiển thị Section "Sản Phẩm Tương Tự" từ `recommendationSlice`.

#### [DELETE] [AppContext.jsx](file:///d:/hethong-thongminh/E_commerce/frontend/src/context/AppContext.jsx)
- Xóa bỏ tập tin sau khi toàn bộ ứng dụng đã chuyển đổi hoàn toàn sang Redux Toolkit & Axios.

---

## 🧪 Verification Plan

### 1. Automated Verification & Build Check
- **NPM Package Verification**: Cài đặt `axios` và kiểm tra `npm run build` hoặc `npx oxlint` / `vite build` đảm bảo không có lỗi TypeScript/JSX syntax.
- **Redux DevTools Check**: Kiểm tra state flow của `auth`, `products`, `cart`, `recommendations` hoạt động nhất quán trên Redux DevTools.

### 2. Manual End-to-End Verification
- **Smart Search Flow**: 
  - Gõ từ khóa tìm kiếm (vd: "giày", "điện thoại") -> Kiểm tra Debounce -> URL cập nhật `?search=...` -> Danh sách sản phẩm cập nhật đúng.
- **Recommendation Engine Flow**:
  - Đăng nhập tài khoản -> Xem sản phẩm A -> Thêm vào giỏ hàng -> Quay lại trang Home -> Kiểm tra Widget "Gợi Ý Dành Cho Bạn" hiển thị sản phẩm liên quan đến A dựa trên thuộc tính category/tags/price.
  - Xem chi tiết sản phẩm B -> Kiểm tra khối "Sản Phẩm Tương Tự" load danh sách sản phẩm trùng độ tương đồng cao nhất.
- **Auth & Role Guard Flow**:
  - Truy cập `/seller` bằng tài khoản customer -> Bị từ chối và thông báo hoặc chuyển hướng.
  - Truy cập `/seller` bằng tài khoản seller -> Truy cập thành công Seller Dashboard.
