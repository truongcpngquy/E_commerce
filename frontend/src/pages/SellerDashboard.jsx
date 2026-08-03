import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import sellerApi from '../api/sellerApi';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Package,
  ShoppingBag,
  Star,
  PlusCircle,
  Edit,
  Trash2,
  ShieldAlert,
  Search,
  Store,
  ExternalLink,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Layers,
  Award,
  Filter,
  User,
  MapPin,
  Calendar,
  Phone,
  ArrowUpRight
} from 'lucide-react';
import './SellerDashboard.css';

export default function SellerDashboard() {
  const { user, categories, login, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('analytics'); // analytics | products | orders | stores
  const [selectedStoreId, setSelectedStoreId] = useState('all');

  // Stats & Financial Analytics
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Products CRUD State
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productSearch, setProductSearch] = useState('');

  // Product Form Modal (Add / Edit)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodForm, setProdForm] = useState({
    store_id: '',
    name: '',
    price: '',
    original_price: '',
    stock: '15',
    category_id: '',
    image_url: '',
    tags: '',
    description: ''
  });
  const [aiPredictedCategory, setAiPredictedCategory] = useState(null);
  const [submittingProd, setSubmittingProd] = useState(false);

  // Orders Management State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Stores Management State
  const [stores, setStores] = useState([]);
  const [editingStoreId, setEditingStoreId] = useState('');
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [storeForm, setStoreForm] = useState({ name: '', description: '', logo_url: '', banner_url: '' });
  const [savingStore, setSavingStore] = useState(false);

  // Format Price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  // Load Initial Seller Data
  useEffect(() => {
    if (user && (user.role === 'seller' || user.role === 'admin')) {
      loadSellerStores();
      loadAnalyticsData();
      loadProductsData();
      loadOrdersData();
    }
  }, [user, selectedStoreId]);

  // AI Category Prediction when typing Product Name in Modal
  useEffect(() => {
    if (prodForm.name && prodForm.name.trim().length >= 2) {
      const timer = setTimeout(() => {
        fetch(`http://localhost:5000/api/products/categories/suggest?name=${encodeURIComponent(prodForm.name.trim())}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.predictions && data.predictions.length > 0) {
              setAiPredictedCategory(data.predictions[0]);
            } else {
              setAiPredictedCategory(null);
            }
          })
          .catch(() => setAiPredictedCategory(null));
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setAiPredictedCategory(null);
    }
  }, [prodForm.name]);

  const loadSellerStores = async () => {
    try {
      const list = await sellerApi.getStores();
      setStores(list || []);
      if (list && list.length > 0 && !editingStoreId) {
        setEditingStoreId(list[0].id);
        setIsCreatingStore(false);
        setStoreForm({
          name: list[0].name || '',
          description: list[0].description || '',
          logo_url: list[0].logo_url || '',
          banner_url: list[0].banner_url || ''
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAnalyticsData = async () => {
    setLoadingAnalytics(true);
    try {
      const data = await sellerApi.getAnalytics(selectedStoreId);
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadProductsData = async () => {
    setLoadingProducts(true);
    try {
      const list = await sellerApi.getProducts(selectedStoreId);
      setProducts(list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadOrdersData = async () => {
    setLoadingOrders(true);
    try {
      const list = await sellerApi.getOrders(selectedStoreId);
      setOrders(list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Product CRUD Handlers
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    const defaultStore = selectedStoreId !== 'all' ? selectedStoreId : (stores[0]?.id || '');
    setProdForm({
      store_id: defaultStore,
      name: '',
      price: '',
      original_price: '',
      stock: '15',
      category_id: categories.length > 0 ? categories[0].id : '',
      image_url: '',
      tags: '',
      description: ''
    });
    setAiPredictedCategory(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingProduct(p);
    setProdForm({
      store_id: p.store_id || '',
      name: p.name || '',
      price: p.price || '',
      original_price: p.original_price || p.price || '',
      stock: p.stock !== undefined ? p.stock : '',
      category_id: p.category_id || '',
      image_url: p.image_url || '',
      tags: p.tags || '',
      description: p.description || ''
    });
    setAiPredictedCategory(null);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!prodForm.name.trim() || !prodForm.price || !prodForm.category_id) {
      showToast('Vui lòng điền đầy đủ các trường bắt buộc (Tên, Giá, Danh mục)!', 'error');
      return;
    }

    setSubmittingProd(true);
    try {
      const payload = {
        store_id: Number(prodForm.store_id || stores[0]?.id || 1),
        name: prodForm.name.trim(),
        description: prodForm.description.trim(),
        price: Number(prodForm.price),
        original_price: Number(prodForm.original_price) || Number(prodForm.price),
        stock: Number(prodForm.stock) || 0,
        image_url: prodForm.image_url.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
        category_id: Number(prodForm.category_id),
        tags: prodForm.tags.toLowerCase().trim()
      };

      if (editingProduct) {
        await sellerApi.updateProduct(editingProduct.id, payload);
        showToast(`Đã cập nhật sản phẩm "${payload.name}" thành công!`, 'success');
      } else {
        await sellerApi.createProduct(payload);
        showToast(`Đã đăng bán thành công sản phẩm mới "${payload.name}"!`, 'success');
      }

      setIsProductModalOpen(false);
      loadProductsData();
      loadAnalyticsData();
    } catch (err) {
      showToast(err.message || 'Lỗi lưu thông tin sản phẩm!', 'error');
    } finally {
      setSubmittingProd(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn ngừng bán / xóa sản phẩm này?')) return;
    try {
      await sellerApi.deleteProduct(id);
      showToast('Đã xóa / ngừng bán sản phẩm thành công!', 'success');
      loadProductsData();
      loadAnalyticsData();
    } catch (err) {
      showToast(err.message || 'Lỗi xóa sản phẩm!', 'error');
    }
  };

  // Order Status Handler
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await sellerApi.updateOrderStatus(orderId, newStatus);
      showToast(`Cập nhật trạng thái đơn hàng #${orderId} sang "${newStatus}" thành công!`, 'success');
      loadOrdersData();
    } catch (err) {
      showToast(err.message || 'Lỗi cập nhật trạng thái đơn hàng!', 'error');
    }
  };

  // Store Save Handler
  const handleSaveStore = async (e) => {
    e.preventDefault();
    if (!storeForm.name.trim()) {
      showToast('Vui lòng nhập tên gian hàng!', 'error');
      return;
    }

    setSavingStore(true);
    try {
      if (isCreatingStore) {
        await sellerApi.createStore(storeForm);
        showToast(`Tạo gian hàng mới "${storeForm.name}" thành công!`, 'success');
      } else {
        await sellerApi.updateStore(editingStoreId, storeForm);
        showToast(`Đã cập nhật thông tin gian hàng "${storeForm.name}" thành công!`, 'success');
      }
      setIsCreatingStore(false);
      loadSellerStores();
      loadAnalyticsData();
    } catch (err) {
      showToast(err.message || 'Lỗi lưu thông tin gian hàng!', 'error');
    } finally {
      setSavingStore(false);
    }
  };

  const handleStartCreateStore = () => {
    setIsCreatingStore(true);
    setEditingStoreId('');
    setStoreForm({
      name: '',
      description: '',
      logo_url: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=200',
      banner_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1000'
    });
  };

  // Quick Login for Demo
  const handleQuickLoginSeller = async (demoUsername) => {
    setSubmittingProd(true);
    await login(demoUsername, '123456');
    setSubmittingProd(false);
  };

  // Lock Screen: Only Seller can access
  if (!user || user.role !== 'seller') {
    return (
      <div className="seller-dashboard error-seller fade-in">
        <ShieldAlert size={64} className="icon-shield-alert" />
        <h2>Quyền Truy Cấp Bị Từ Chối (Kênh Người Bán)</h2>
        <p>
          {!user
            ? 'Vui lòng đăng nhập tài khoản Người bán (Seller) để vào Kênh Quản Lý Sản Phẩm & Gian Hàng.'
            : `Tài khoản hiện tại (${user.username}) đang ở vai trò "${user.role.toUpperCase()}". Tài khoản Admin hoặc Khách hàng không thể truy cập Kênh Người Bán.`}
        </p>

        <div className="quick-login-box">
          <button onClick={() => handleQuickLoginSeller('seller1')} disabled={submittingProd} className="btn-quick-seller">
            🏪 Đăng nhập Seller mẫu (seller1 / 123456)
          </button>
          <Link to="/" className="back-link">Quay lại trang chủ</Link>
        </div>
      </div>
    );
  }

  // Filtered Products List
  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.tags?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku?.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Filtered Orders List
  const filteredOrders = orders.filter(o =>
    orderStatusFilter === 'all' ? true : o.status === orderStatusFilter
  );

  return (
    <div className="seller-portal-container fade-in">
      {/* Top Header Portal */}
      <div className="seller-header-banner">
        <div className="seller-banner-title">
          <h1>Kênh Quản Lý Người Bán Shopee</h1>
          <p>Hệ thống Quản lý Đa Gian Hàng, Đơn Hàng từ Quán, Sản Phẩm & Dashboard Tài Chính AI</p>
        </div>

        {/* Store Selector */}
        {stores.length > 0 && (
          <div className="store-selector-box">
            <Store size={18} className="text-orange" />
            <span>Chọn Gian Hàng:</span>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="store-select"
            >
              <option value="all">Tất cả gian hàng ({stores.length} Shops)</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>🏪 {s.name} {s.is_official ? '(Mall)' : ''}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Tab Navigation */}
      <div className="seller-tabs-nav">
        <button
          className={`seller-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp size={18} /> Tổng Quan & Tài Chính
        </button>

        <button
          className={`seller-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Package size={18} /> Quản Lý Sản Phẩm ({products.length})
        </button>

        <button
          className={`seller-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ShoppingBag size={18} /> Đơn Hàng Từ Quán ({orders.length})
        </button>

        <button
          className={`seller-tab-btn ${activeTab === 'stores' ? 'active' : ''}`}
          onClick={() => setActiveTab('stores')}
        >
          <Store size={18} /> Quản Lý Gian Hàng ({stores.length})
        </button>
      </div>

      {/* TAB 1: FINANICAL DASHBOARD & ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="tab-content-wrapper space-y-6">
          {/* Stat Cards */}
          <div className="stat-cards-grid">
            <div className="stat-card revenue">
              <div className="stat-icon-wrapper red">
                <DollarSign size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Tổng Doanh Thu Tài Chính</span>
                <h3 className="stat-value">{formatPrice(analytics?.totalRevenue || 0)}</h3>
                <span className="stat-sub text-emerald">↑ +18.5% so với tháng trước</span>
              </div>
            </div>

            <div className="stat-card orders">
              <div className="stat-icon-wrapper orange">
                <ShoppingBag size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Đơn Hàng Mua Từ Quán</span>
                <h3 className="stat-value">{analytics?.totalOrders || 0} Đơn</h3>
                <span className="stat-sub text-gray">Tất cả gian hàng sở hữu</span>
              </div>
            </div>

            <div className="stat-card products">
              <div className="stat-icon-wrapper blue">
                <Package size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Sản Phẩm Đang Bán</span>
                <h3 className="stat-value">{analytics?.totalProducts || 0} Sản phẩm</h3>
                <span className="stat-sub text-emerald">Chuẩn hóa danh mục 3NF</span>
              </div>
            </div>

            <div className="stat-card rating">
              <div className="stat-icon-wrapper yellow">
                <Star size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Đánh Giá Trung Bình</span>
                <h3 className="stat-value">{analytics?.avgRating || '5.0'} / 5.0 ⭐</h3>
                <span className="stat-sub text-orange">Điểm uy tín Shopee Mall</span>
              </div>
            </div>
          </div>

          {/* Revenue Chart Visual Bar */}
          <div className="analytics-section-card">
            <div className="card-header-flex">
              <div>
                <h2>📊 Biểu Đồ Doanh Thu Tài Chính Các Tháng</h2>
                <p>Thống kê theo dòng tiền đơn hàng đã hoàn tất từ các gian hàng</p>
              </div>
              <span className="badge-sparkle"><Sparkles size={14} /> AI Financial Analytics</span>
            </div>

            <div className="monthly-bars-container">
              {analytics?.monthlySales?.map((item, idx) => {
                const maxVal = Math.max(...analytics.monthlySales.map(s => s.revenue || 1));
                const heightPct = Math.max(15, Math.round((item.revenue / maxVal) * 100));
                return (
                  <div key={idx} className="bar-item-col">
                    <div className="bar-val-tooltip">{formatPrice(item.revenue)}</div>
                    <div className="bar-fill-wrapper">
                      <div className="bar-fill" style={{ height: `${heightPct}%` }}></div>
                    </div>
                    <span className="bar-month-label">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS MANAGEMENT CRUD */}
      {activeTab === 'products' && (
        <div className="tab-content-wrapper space-y-6">
          {/* Header Action & Search */}
          <div className="table-actions-bar">
            <div className="search-input-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Tìm sản phẩm theo tên, SKU, thẻ tag..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>

            <button onClick={handleOpenAddModal} className="btn-add-product">
              <PlusCircle size={18} /> Đăng Bán Sản Phẩm Mới
            </button>
          </div>

          {/* Products Table */}
          <div className="table-container-card">
            {loadingProducts ? (
              <div className="empty-loading-box">Đang tải danh sách sản phẩm...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-loading-box">Chưa có sản phẩm nào phù hợp.</div>
            ) : (
              <table className="seller-custom-table">
                <thead>
                  <tr>
                    <th>Sản Phẩm</th>
                    <th>Gian Hàng</th>
                    <th>Danh Mục</th>
                    <th>Giá Bán</th>
                    <th>Tồn Kho</th>
                    <th>Trạng Thái</th>
                    <th>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="product-row-flex">
                          <img src={p.image_url} alt={p.name} className="product-thumb-img" />
                          <div>
                            <div className="product-row-name">{p.name}</div>
                            <div className="product-row-sku">SKU: {p.sku || `#${p.id}`}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="store-tag-pill">🏪 {p.store_name || 'Store'}</span>
                      </td>
                      <td><span className="cat-name-text">{p.category_name || 'N/A'}</span></td>
                      <td>
                        <div className="price-stack">
                          <span className="price-main">{formatPrice(p.price)}</span>
                          {p.original_price > p.price && (
                            <span className="price-orig">{formatPrice(p.original_price)}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`stock-badge ${p.stock > 5 ? 'good' : 'low'}`}>
                          {p.stock} sản phẩm
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${p.status === 'archived' ? 'archived' : 'active'}`}>
                          {p.status === 'archived' ? 'Đã lưu trữ' : 'Đang bán'}
                        </span>
                      </td>
                      <td>
                        <div className="actions-flex">
                          <button onClick={() => handleOpenEditModal(p)} className="btn-action edit" title="Chỉnh sửa">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="btn-action delete" title="Xóa/Lưu trữ">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STORE ORDERS MANAGEMENT CRUD */}
      {activeTab === 'orders' && (
        <div className="tab-content-wrapper space-y-6">
          {/* Status Filter Tabs */}
          <div className="order-filter-tabs">
            <span className="filter-title"><Filter size={16} /> Bộ Lọc Đơn Hàng:</span>
            {[
              { key: 'all', label: 'Tất cả đơn' },
              { key: 'pending', label: 'Chờ xác nhận' },
              { key: 'processing', label: 'Đang xử lý' },
              { key: 'shipping', label: 'Đang giao' },
              { key: 'completed', label: 'Hoàn thành' },
              { key: 'cancelled', label: 'Đã hủy' }
            ].map(f => (
              <button
                key={f.key}
                className={`order-filter-btn ${orderStatusFilter === f.key ? 'active' : ''}`}
                onClick={() => setOrderStatusFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Orders Cards List */}
          {loadingOrders ? (
            <div className="empty-loading-box">Đang tải danh sách đơn hàng từ quán...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-loading-box">Không có đơn hàng nào thuộc bộ lọc này.</div>
          ) : (
            <div className="orders-cards-stack">
              {filteredOrders.map((ord) => (
                <div key={ord.id} className="seller-order-card">
                  {/* Card Header */}
                  <div className="order-card-top flex justify-between items-center">
                    <div className="order-id-group">
                      <span className="order-id-badge">Đơn hàng #{ord.id}</span>
                      <span className="order-date-text">
                        <Calendar size={13} /> {new Date(ord.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    {/* Change Status Select Form */}
                    <div className="order-status-change-box">
                      <span className="status-label-text">Cập nhật trạng thái:</span>
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                        className={`status-select-control status-${ord.status}`}
                      >
                        <option value="pending">Chờ xác nhận</option>
                        <option value="processing">Đang xử lý</option>
                        <option value="shipping">Đang giao hàng</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </div>
                  </div>

                  {/* Customer Info Section */}
                  <div className="customer-info-banner">
                    <div className="customer-meta-item">
                      <User size={14} /> <span>Khách hàng: <strong>{ord.customer_name || 'Khách hàng'}</strong></span>
                    </div>
                    {ord.customer_phone && (
                      <div className="customer-meta-item">
                        <Phone size={14} /> <span>SĐT: <strong>{ord.customer_phone}</strong></span>
                      </div>
                    )}
                    <div className="customer-meta-item">
                      <MapPin size={14} /> <span>Địa chỉ: <strong>{ord.shipping_address}</strong></span>
                    </div>
                  </div>

                  {/* Order Items Table */}
                  <div className="order-items-list">
                    {ord.items?.map((item) => (
                      <div key={item.id} className="order-item-row">
                        <img src={item.image_url} alt={item.product_name} className="order-item-img" />
                        <div className="order-item-info">
                          <span className="order-item-name">{item.product_name || item.name}</span>
                          <span className="order-item-qty">Số lượng: x{item.quantity}</span>
                        </div>
                        <span className="order-item-price">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Order Card Footer */}
                  <div className="order-card-footer flex justify-between items-center">
                    <span className="payment-method-text">Phương thức: {ord.payment_method?.toUpperCase() || 'COD'}</span>
                    <div className="total-amount-box">
                      <span>Tổng giá trị đơn:</span>
                      <strong className="total-price-text">{formatPrice(ord.total_amount)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: STORES MANAGEMENT */}
      {activeTab === 'stores' && (
        <div className="tab-content-wrapper space-y-6">
          <div className="table-actions-bar">
            <h2 className="section-heading-text">🏢 Quản Lý Gian Hàng & Thương Hiệu ({stores.length} Shops)</h2>
            <button onClick={handleStartCreateStore} className="btn-add-product">
              <PlusCircle size={18} /> + Tạo Gian Hàng Mới
            </button>
          </div>

          <div className="stores-grid-layout">
            {/* Store Edit Profile Form */}
            <div className="store-form-card">
              <h2>{isCreatingStore ? '➕ Tạo Gian Hàng Mới' : '🏪 Chỉnh Sửa Thông Tin Gian Hàng'}</h2>

              {/* Store Live Preview Box */}
              <div className="store-preview-banner-box">
                <div
                  className="banner-bg-preview"
                  style={{ backgroundImage: `url(${storeForm.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1000'})` }}
                >
                  <div className="banner-overlay-dark">
                    <img
                      src={storeForm.logo_url || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=200'}
                      alt={storeForm.name || 'Store Logo'}
                      className="logo-img-preview"
                    />
                    <div className="banner-text-preview">
                      <h3>{storeForm.name || 'Tên Gian Hàng Mới'}</h3>
                      <p>{storeForm.description || 'Mô tả gian hàng...'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveStore} className="store-edit-form">
                <div className="input-group">
                  <label>Tên Gian Hàng *</label>
                  <input
                    type="text"
                    value={storeForm.name}
                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                    placeholder="Ví dụ: ROG Official Store, Apple Authorised Reseller..."
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Mô tả Gian Hàng</label>
                  <textarea
                    rows="3"
                    value={storeForm.description}
                    onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                    placeholder="Giới thiệu về gian hàng, chính sách bảo hành, cam kết chất lượng..."
                  ></textarea>
                </div>

                <div className="input-group">
                  <label>Logo URL (Hình vuông)</label>
                  <input
                    type="text"
                    value={storeForm.logo_url}
                    onChange={(e) => setStoreForm({ ...storeForm, logo_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="input-group">
                  <label>Banner URL (Hình chữ nhật)</label>
                  <input
                    type="text"
                    value={storeForm.banner_url}
                    onChange={(e) => setStoreForm({ ...storeForm, banner_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <div className="form-buttons-flex">
                  {isCreatingStore && (
                    <button type="button" onClick={() => setIsCreatingStore(false)} className="btn-cancel-modal">
                      Hủy Bỏ
                    </button>
                  )}
                  <button type="submit" disabled={savingStore} className="btn-save-store">
                    {savingStore ? 'Đang lưu...' : (isCreatingStore ? 'Tạo Gian Hàng Ngay' : 'Lưu Thay Đổi Hồ Sơ Store')}
                  </button>
                </div>
              </form>
            </div>

            {/* Store Preview List */}
            <div className="stores-list-card">
              <h2>Các Gian Hàng Sở Hữu ({stores.length})</h2>
              <div className="stores-cards-stack">
                {stores.map((st) => (
                  <div key={st.id} className={`store-item-card ${editingStoreId === st.id && !isCreatingStore ? 'selected' : ''}`}>
                    <img src={st.logo_url || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=200'} alt={st.name} className="store-item-logo" />
                    <div className="store-item-details">
                      <span className="store-item-title">{st.name} {st.is_official ? '⭐ (Shopee Mall)' : ''}</span>
                      <span className="store-item-sub">ID: #{st.id} • Slug: {st.slug}</span>
                    </div>
                    <button
                      onClick={() => {
                        setIsCreatingStore(false);
                        setEditingStoreId(st.id);
                        setStoreForm({
                          name: st.name || '',
                          description: st.description || '',
                          logo_url: st.logo_url || '',
                          banner_url: st.banner_url || ''
                        });
                      }}
                      className="btn-select-store"
                    >
                      {editingStoreId === st.id && !isCreatingStore ? 'Đang Sửa' : 'Chỉnh Sửa'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM / CHỈNH SỬA SẢN PHẨM (WITH AI CATEGORY PREDICTION BADGE & POLISHED MARGIN/PADDING) */}
      {isProductModalOpen && (
        <div className="modal-backdrop-overlay">
          <div className="modal-content-card modal-product-custom">
            <div className="modal-header-flex">
              <h3>{editingProduct ? '✏️ Chỉnh Sửa Sản Phẩm' : '➕ Đăng Bán Sản Phẩm Mới'}</h3>
              <button onClick={() => setIsProductModalOpen(false)} className="modal-close-btn">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="modal-form-body">
              <div className="form-grid-2">
                <div className="input-group">
                  <label htmlFor="modal-store">Chọn Gian Hàng *</label>
                  <select
                    id="modal-store"
                    value={prodForm.store_id}
                    onChange={(e) => setProdForm({ ...prodForm, store_id: e.target.value })}
                    required
                  >
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>🏪 {s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="modal-category">Danh Mục Sản Phẩm *</label>
                  <select
                    id="modal-category"
                    value={prodForm.category_id}
                    onChange={(e) => setProdForm({ ...prodForm, category_id: e.target.value })}
                    required
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Name with AI Badge */}
              <div className="input-group">
                <label htmlFor="modal-name">Tên Sản Phẩm *</label>
                <input
                  type="text"
                  id="modal-name"
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  placeholder="Nhập tên sản phẩm (VD: Laptop ASUS TUF, Áo Polo Nike)..."
                  required
                />

                {/* AI CATEGORY SUGGESTION BADGE */}
                {aiPredictedCategory && (
                  <div className="ai-category-badge-box">
                    <div className="ai-badge-label">
                      <Sparkles size={14} className="icon-sparkle-anim" />
                      <span>AI Gợi Ý Danh Mục:</span>
                      <strong>[{aiPredictedCategory.name}]</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProdForm({ ...prodForm, category_id: aiPredictedCategory.id })}
                      className="btn-apply-ai-cat"
                    >
                      + Áp dụng ngay
                    </button>
                  </div>
                )}
              </div>

              <div className="form-grid-3">
                <div className="input-group">
                  <label htmlFor="modal-price">Giá Bán (VNĐ) *</label>
                  <input
                    type="number"
                    id="modal-price"
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                    placeholder="250000"
                    min="0"
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="modal-orig-price">Giá Gốc (VNĐ)</label>
                  <input
                    type="number"
                    id="modal-orig-price"
                    value={prodForm.original_price}
                    onChange={(e) => setProdForm({ ...prodForm, original_price: e.target.value })}
                    placeholder="350000"
                    min="0"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="modal-stock">Số Lượng Tồn Kho</label>
                  <input
                    type="number"
                    id="modal-stock"
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                    placeholder="15"
                    min="0"
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="modal-image">Link Ảnh Sản Phẩm (URL)</label>
                <input
                  type="text"
                  id="modal-image"
                  value={prodForm.image_url}
                  onChange={(e) => setProdForm({ ...prodForm, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="input-group">
                <label htmlFor="modal-tags">Tags Thẻ Gợi Ý AI (Cách nhau bằng dấu phẩy)</label>
                <input
                  type="text"
                  id="modal-tags"
                  value={prodForm.tags}
                  onChange={(e) => setProdForm({ ...prodForm, tags: e.target.value })}
                  placeholder="laptop, gaming, asus, intel"
                />
              </div>

              <div className="input-group">
                <label htmlFor="modal-desc">Mô Tả Sản Phẩm</label>
                <textarea
                  id="modal-desc"
                  rows="3"
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  placeholder="Mô tả các đặc điểm nổi bật của sản phẩm..."
                ></textarea>
              </div>

              <div className="modal-actions-flex">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="btn-cancel-modal">
                  Hủy Bỏ
                </button>
                <button type="submit" disabled={submittingProd} className="btn-submit-modal">
                  {submittingProd ? 'Đang lưu...' : (editingProduct ? 'Cập Nhật Sản Phẩm' : 'Đăng Bán Ngay')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
