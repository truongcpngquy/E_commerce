---
name: e-commerce-project-overview
description: High-level architectural overview, API schema, database structure, AI content-based recommendation system details, frontend state management, and file layout for the E_commerce project (Shopee Recommendation App).
---

# Project Overview: E-Commerce Shopee Recommendation App

Hệ thống thương mại điện tử thông minh tích hợp **Giải thuật Gợi ý Cá nhân hóa dựa trên Nội dung (Content-Based Filtering với TF-IDF & Cosine Similarity)**, mô phỏng giao diện và trải nghiệm mua sắm của Shopee Vietnam.

---

## 🏗️ 1. Architecture Overview

- **Monorepo Split**:
  - `backend/`: Node.js, Express.js, MySQL (`mysql2/promise`), JWT Auth, TF-IDF Recommendation Engine.
  - `frontend/`: React 19, Vite, Redux Toolkit, React Router v7, Ant Design, TailwindCSS v4, Axios.

- **Ports & Environment**:
  - Backend API: `http://localhost:5000/api`
  - Database: MySQL database `shopee_db` on `localhost:3306` (User: `root`, Password: ``)
  - Frontend: Vite Dev Server (standard `http://localhost:5173`)

---

## 🗄️ 2. Database Schema (`shopee_db`)

1. **`users`**:
   - `id`, `username`, `password` (hashed), `email`, `role` (`'customer'` | `'seller'`), `full_name`, `phone`, `gender`, `date_of_birth`, `city`, `district`, `price_sensitivity` (`'budget'` | `'mid-range'` | `'premium'`), `created_at`
2. **`stores`**:
   - `id`, `user_id`, `name`, `slug`, `description`, `avatar_url`, `banner_url`, `rating_avg`, `is_official` (Shopee Mall flag), `response_rate`, `response_time`, `follower_count`, `created_at`
3. **`categories`**:
   - `id`, `parent_id`, `name`, `slug`, `icon`, `level`
4. **`products`**:
   - `id`, `store_id`, `category_id`, `name`, `description`, `price`, `original_price`, `stock`, `image_url`, `tags` (comma-separated string), `rating_avg`, `rating_count`, `sales_count`, `view_count`, `created_at`
5. **`cart_items`**:
   - `id`, `user_id`, `product_id`, `quantity`, `created_at`
6. **`orders`**:
   - `id`, `user_id`, `total_amount`, `status` (`'pending'` | `'processing'` | `'shipping'` | `'completed'` | `'cancelled'`), `shipping_address`, `payment_method`, `created_at`
7. **`order_items`**:
   - `id`, `order_id`, `product_id`, `quantity`, `price`
8. **`user_interactions`**:
   - `id`, `user_id`, `product_id`, `interaction_type` (`'view'` | `'like'` | `'cart'` | `'buy'`), `weight` (`view`=1, `like`=2, `cart`=3, `buy`=5), `created_at`
9. **`reviews`** & **`wishlists`**:
   - Product user ratings and saved favorite items.

---

## 🤖 3. AI Recommendation Engine (`backend/utils/recommendationEngine.js`)

- **Core Algorithm**: Content-Based Filtering using TF-IDF (Term Frequency - Inverse Document Frequency) & Cosine Similarity.
- **Product Vector Construction**:
  - Text fields normalized: `name` (weight x3), `category_name` (weight x2), `tags` (weight x3), `description` (weight x1).
  - TF-IDF matrix constructed over the product corpus.
- **User Profile Vector**:
  - Aggregated from `user_interactions` with weights: `view` = 1, `like` = 2, `cart` = 3, `buy` = 5.
- **Similarity Scoring**:
  - `Personalized Recommendation`: Cosine similarity between User Profile Vector and Product Vectors.
  - `Similar Products`: Cosine similarity between Reference Product Vector and all Candidate Vectors.
  - `Search-Based Recommendation`: Cosine similarity between Query TF-IDF Vector and Product Vectors.

---

## 📁 4. Key Directory Structure

```
E_commerce/
├── backend/
│   ├── config/
│   │   └── db.js                 # MySQL Pool & Auto DB creation
│   ├── controllers/              # Route controllers
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT token validation & seller role check
│   ├── routes/
│   │   ├── authRoutes.js         # POST /login, POST /signup, GET /me
│   │   ├── productRoutes.js      # GET /, GET /:id, POST /, GET /tags/popular
│   │   ├── storeRoutes.js        # GET /, GET /:slug, GET /:slug/products
│   │   ├── cartRoutes.js         # GET /, POST /add, PUT /update, DELETE /:id
│   │   ├── orderRoutes.js        # GET /, POST /create, PUT /:id/status
│   │   ├── recommendationRoutes.js # GET /personalized, GET /similar/:id, POST /track
│   │   └── userRoutes.js         # GET /profile, PUT /profile
│   ├── services/                 # Database querying logic & business operations
│   ├── utils/
│   │   └── recommendationEngine.js # TF-IDF & Cosine Similarity calculation logic
│   ├── schema.sql                # SQL database table structure
│   ├── seed.js                   # Seeding initial categories, stores, products, interactions
│   └── server.js                 # Express server initialization
│
└── frontend/
    ├── src/
    │   ├── api/                  # Axios HTTP client & API endpoints mapping
    │   │   ├── axiosClient.js    # Base Axios client with Auth Interceptor & Error formatting
    │   │   ├── authApi.js
    │   │   ├── productApi.js
    │   │   ├── cartApi.js
    │   │   ├── orderApi.js
    │   │   ├── recommendationApi.js
    │   │   └── storeApi.js
    │   ├── components/
    │   │   ├── common/           # AlertBanner, ConfirmModal, ErrorBoundary
    │   │   ├── home/             # BannerSection, CategoryNavSection, OfficialStoresSection, TagCloudSection
    │   │   ├── product/          # ProductCard
    │   │   └── store/            # StoreCardWidget, StoreHeroBanner
    │   ├── hooks/
    │   │   ├── useProductTracking.js # Auto-logs 'view' interactions to AI backend
    │   │   └── useReduxHooks.js      # Typed hooks (useAppDispatch, useAppSelector)
    │   ├── pages/
    │   │   ├── auth/Auth.jsx     # Login / Signup form with role selector
    │   │   ├── customer/
    │   │   │   ├── home/Home.jsx # Main catalog with AI recommendation feed & infinite scroll
    │   │   │   ├── products/ProductDetail.jsx # Product detail & similar products
    │   │   │   ├── checkout/Checkout.jsx       # Delivery info & order confirmation
    │   │   │   ├── my-shopping/Cart.jsx        # Cart management & deletion modal
    │   │   │   ├── my-orders/Orders.jsx        # Order status & VietQR Payment modal
    │   │   │   ├── my-orders/StoreDetail.jsx   # Individual seller storefront
    │   │   │   └── profile/Profile.jsx         # User profile & shopping sensitivity
    │   │   ├── seller/
    │   │   │   └── SellerDashboard.jsx         # Seller Multi-Store portal & management
    │   ├── routes/
    │   │   ├── AppRoutes.jsx     # App route definitions
    │   │   ├── ProtectedRoute.jsx # Auth & role guards
    │   │   └── layouts/MainLayout.jsx # App Layout, Toast notifications & ErrorBoundary
    │   └── store/
    │       ├── index.js          # Redux Store config
    │       └── slices/           # authSlice, cartSlice, orderSlice, productSlice, recommendationSlice, uiSlice
```

---

## ⚡ 5. Redux State Architecture (`frontend/src/store/slices/`)

- `authSlice`: Manages logged-in user info, JWT token in `localStorage.getItem('shopee_token')`.
- `productSlice`: Product list, selected product detail, categories, active search queries & filter categories.
- `cartSlice`: Cart item list, loading state, optimistic cart count update.
- `orderSlice`: User purchase order list, order creation status.
- `recommendationSlice`: `personalizedList`, `searchBasedList`, `similarList`, triggers `trackUserInteraction` thunk.
- `uiSlice`: `toasts` array, `globalLoading` state.

---

## 🛠️ 6. Common Workflows & Conventions

1. **Adding a New API Endpoint**:
   - Define SQL service method in `backend/services/<feature>Service.js`.
   - Add controller action and map route in `backend/routes/<feature>Routes.js`.
   - Add endpoint method in `frontend/src/api/<feature>Api.js`.
   - Create async thunk in `frontend/src/store/slices/<feature>Slice.js`.

2. **Form Error Handling**:
   - Use `AlertBanner.jsx` (`error`, `warning`, `success`, `info`) inside forms to display human-readable inline error messages.
   - Do NOT use browser native `alert()` or `confirm()`.

3. **Running the Application**:
   - Start Backend: `cd backend && npm run start`
   - Start Frontend: `cd frontend && npm run dev`
