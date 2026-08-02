const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const storeRoutes = require('./routes/storeRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Cấu hình Middleware
app.use(cors());
app.use(express.json());

// Mount Routes trên cả 2 prefix: /api (Tương thích 100% FE hiện tại) và /api/v1 (Enterprise Specs)
const apiRouters = [
  { path: '/auth', router: authRoutes },
  { path: '/users', router: userRoutes },
  { path: '/products', router: productRoutes },
  { path: '/cart', router: cartRoutes },
  { path: '/orders', router: orderRoutes },
  { path: '/recommendations', router: recommendationRoutes },
  { path: '/wishlist', router: wishlistRoutes },
  { path: '/reviews', router: reviewRoutes },
  { path: '/seller', router: sellerRoutes },
  { path: '/stores', router: storeRoutes },
  { path: '/admin', router: adminRoutes },
];

apiRouters.forEach(({ path, router }) => {
  app.use(`/api${path}`, router);
  app.use(`/api/v1${path}`, router);
});

// Route kiểm tra sức khỏe hệ thống (Health Check)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Smart E-Commerce API v2.0 is running!' });
});

// Khởi chạy Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Smart E-Commerce Server is running on port ${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api & http://localhost:${PORT}/api/v1`);
});
