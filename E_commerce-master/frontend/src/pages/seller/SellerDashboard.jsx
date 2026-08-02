import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../hooks/useReduxHooks';
import sellerApi from '../../api/sellerApi';
import productApi from '../../api/productApi';
import AlertBanner from '../../components/common/AlertBanner';
import ConfirmModal from '../../components/common/ConfirmModal';
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
  Plus,
  ExternalLink,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  CheckCircle2,
  Layers,
  Award
} from 'lucide-react';
import { Spin, Modal, Button, Progress, Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import './SellerDashboard.css';

export default function SellerDashboard({ activeTab = 'overview', setActiveTab, selectedStoreId, setSelectedStoreId, storesList, loadStoresData }) {
  const user = useAppSelector((state) => state.auth.user);
  const categories = useAppSelector((state) => state.product.categories);

  // Stats
  const [stats, setStats] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Products state
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productSearch, setProductSearch] = useState('');

  // Product Form State (New & Edit)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodForm, setProdForm] = useState({
    store_id: '',
    name: '',
    price: '',
    original_price: '',
    stock: '',
    category_id: '',
    image_url: '',
    tags: '',
    description: ''
  });
  const [submittingProd, setSubmittingProd] = useState(false);
  const [aiPredictedCategories, setAiPredictedCategories] = useState([]);

  // AI Category Prediction dựa trên Tên sản phẩm khi nhập Form
  useEffect(() => {
    if (prodForm.name && prodForm.name.trim().length >= 2) {
      const timer = setTimeout(() => {
        productApi.predictCategory(prodForm.name.trim())
          .then((res) => {
            setAiPredictedCategories(res.predictions || []);
          })
          .catch(() => setAiPredictedCategories([]));
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setAiPredictedCategories([]);
    }
  }, [prodForm.name]);

  // Delete product confirmation
  const [deletingProdId, setDeletingProdId] = useState(null);
  const [deletingProdLoading, setDeletingProdLoading] = useState(false);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Store profile / Create store form state
  const [editingStoreId, setEditingStoreId] = useState('');
  const [storeForm, setStoreForm] = useState({
    name: '',
    description: '',
    logo_url: '',
    banner_url: ''
  });
  const [savingStore, setSavingStore] = useState(false);
  const [isCreateStoreModalOpen, setIsCreateStoreModalOpen] = useState(false);
  const [newStoreForm, setNewStoreForm] = useState({
    name: '',
    description: '',
    logo_url: '',
    banner_url: ''
  });
  const [creatingStore, setCreatingStore] = useState(false);

  // Messages
  const [bannerError, setBannerError] = useState(null);
  const [bannerSuccess, setBannerSuccess] = useState(null);

  // Trigger reload when selectedStoreId or user changes
  useEffect(() => {
    if (user && (user.role === 'seller' || (user.roles && user.roles.includes('seller')))) {
      loadAnalyticsData(selectedStoreId);
      loadProductsData(selectedStoreId);
      loadOrdersData(selectedStoreId);
    }
  }, [user, selectedStoreId]);

  // Sync Store Profile form when editingStoreId or storesList changes
  useEffect(() => {
    if (storesList && storesList.length > 0) {
      let targetId = editingStoreId;
      if (!targetId || !storesList.some(s => String(s.id) === String(targetId))) {
        targetId = selectedStoreId !== 'all' ? selectedStoreId : storesList[0].id;
      }
      selectStoreToEdit(targetId);
    }
  }, [storesList, selectedStoreId]);

  const selectStoreToEdit = (storeId) => {
    const targetStore = storesList.find(s => String(s.id) === String(storeId)) || storesList[0];
    if (targetStore) {
      setEditingStoreId(targetStore.id);
      setStoreForm({
        name: targetStore.name || '',
        description: targetStore.description || '',
        logo_url: targetStore.logo_url || '',
        banner_url: targetStore.banner_url || ''
      });
    }
  };

  const loadAnalyticsData = async (storeId) => {
    setLoadingAnalytics(true);
    try {
      const data = await sellerApi.getAnalytics(storeId);
      setStats(data);
    } catch (err) {
      console.error('Lỗi tải thống kê seller:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadProductsData = async (storeId) => {
    setLoadingProducts(true);
    try {
      const data = await sellerApi.getProducts(storeId);
      setProducts(data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách sản phẩm seller:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadOrdersData = async (storeId) => {
    setLoadingOrders(true);
    try {
      const data = await sellerApi.getOrders(storeId);
      setOrders(data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách đơn hàng seller:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  // Product Handlers
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    const defaultStore = selectedStoreId !== 'all' ? selectedStoreId : (storesList[0]?.id || '');
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
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setProdForm({
      store_id: prod.store_id || '',
      name: prod.name || '',
      price: prod.price || '',
      original_price: prod.original_price || prod.price || '',
      stock: prod.stock !== undefined ? prod.stock : '',
      category_id: prod.category_id || '',
      image_url: prod.image_url || '',
      tags: prod.tags || '',
      description: prod.description || ''
    });
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setBannerError(null);
    setBannerSuccess(null);

    if (!prodForm.name.trim() || !prodForm.price || !prodForm.category_id || !prodForm.store_id) {
      setBannerError('Vui lòng điền đầy đủ các trường bắt buộc (Gian hàng, Tên sản phẩm, Giá bán, Danh mục)!');
      return;
    }

    setSubmittingProd(true);
    try {
      const defaultImages = {
        1: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500',
        2: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500',
        3: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500',
        4: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500',
        5: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500',
      };

      const finalImageUrl = prodForm.image_url.trim() || defaultImages[prodForm.category_id] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';

      const payload = {
        store_id: Number(prodForm.store_id),
        name: prodForm.name.trim(),
        description: prodForm.description.trim(),
        price: Number(prodForm.price),
        original_price: Number(prodForm.original_price) || Number(prodForm.price),
        stock: Number(prodForm.stock) || 0,
        image_url: finalImageUrl,
        category_id: Number(prodForm.category_id),
        tags: prodForm.tags.toLowerCase().trim()
      };

      if (editingProduct) {
        await sellerApi.updateProduct(editingProduct.id, payload);
        setBannerSuccess(`Đã cập nhật thành công sản phẩm "${payload.name}"!`);
      } else {
        await sellerApi.createProduct(payload);
        setBannerSuccess(`Đã đăng bán thành công sản phẩm mới "${payload.name}"!`);
      }

      setIsAddModalOpen(false);
      loadProductsData(selectedStoreId);
      loadAnalyticsData(selectedStoreId);
    } catch (err) {
      setBannerError(err.response?.data?.message || 'Lỗi lưu thông tin sản phẩm.');
    } finally {
      setSubmittingProd(false);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deletingProdId) return;
    setDeletingProdLoading(true);
    try {
      await sellerApi.deleteProduct(deletingProdId);
      setBannerSuccess('Đã lưu trữ / ngừng bán sản phẩm thành công!');
      loadProductsData(selectedStoreId);
      loadAnalyticsData(selectedStoreId);
    } catch (err) {
      setBannerError(err.response?.data?.message || 'Lỗi khi ngừng bán sản phẩm.');
    } finally {
      setDeletingProdLoading(false);
      setDeletingProdId(null);
    }
  };

  // Order Handlers
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await sellerApi.updateOrderStatus(orderId, newStatus);
      setBannerSuccess(`Đã cập nhật trạng thái đơn hàng #${orderId} sang "${newStatus}"!`);
      loadOrdersData(selectedStoreId);
    } catch (err) {
      setBannerError(err.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng.');
    }
  };

  // Store Profile Handlers
  const handleSaveStoreProfile = async (e) => {
    e.preventDefault();
    if (!editingStoreId) return;
    setSavingStore(true);
    setBannerError(null);
    setBannerSuccess(null);
    try {
      await sellerApi.updateStore(editingStoreId, storeForm);
      setBannerSuccess(`Cập nhật thông tin Gian Hàng "${storeForm.name}" thành công!`);
      if (loadStoresData) await loadStoresData();
    } catch (err) {
      setBannerError(err.response?.data?.message || 'Không thể cập nhật thông tin cửa hàng.');
    } finally {
      setSavingStore(false);
    }
  };

  const handleCreateNewStore = async (e) => {
    e.preventDefault();
    if (!newStoreForm.name.trim()) return;
    setCreatingStore(true);
    setBannerError(null);
    setBannerSuccess(null);
    try {
      const created = await sellerApi.createStore(newStoreForm);
      setBannerSuccess(`Tạo thành công Gian Hàng mới "${created.name}"!`);
      setIsCreateStoreModalOpen(false);
      setNewStoreForm({ name: '', description: '', logo_url: '', banner_url: '' });
      if (loadStoresData) await loadStoresData();
      setSelectedStoreId(created.id);
      selectStoreToEdit(created.id);
    } catch (err) {
      setBannerError(err.response?.data?.message || 'Không thể tạo Gian Hàng mới.');
    } finally {
      setCreatingStore(false);
    }
  };

  // Filtered Products & Orders
  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.tags?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(o => {
    if (orderStatusFilter === 'all') return true;
    return o.status === orderStatusFilter;
  });

  const currentStoreObj = storesList.find(s => String(s.id) === String(selectedStoreId));
  const activeEditingStoreObj = storesList.find(s => String(s.id) === String(editingStoreId));

  if (!user || (user.role !== 'seller' && (!user.roles || !user.roles.includes('seller')))) {
    return (
      <div className="seller-access-denied fade-in">
        <ShieldAlert size={64} className="text-red-500" />
        <h2>Quyền truy cập bị từ chối!</h2>
        <p>Tài khoản của bạn chưa được cấp quyền Người bán hàng (Seller Portal).</p>
      </div>
    );
  }

  return (
    <div className="seller-dashboard-container fade-in">
      {/* GLOBAL ALERTS */}
      {bannerError && (
        <AlertBanner
          type="error"
          title="Thông báo hệ thống"
          message={bannerError}
          onClose={() => setBannerError(null)}
        />
      )}
      {bannerSuccess && (
        <AlertBanner
          type="success"
          title="Thành công"
          message={bannerSuccess}
          onClose={() => setBannerSuccess(null)}
        />
      )}

      {/* ========================================================== */}
      {/* 1. TAB OVERVIEW (TỔNG QUAN) */}
      {/* ========================================================== */}
      {activeTab === 'overview' && (
        <div className="tab-overview space-y-6">
          {/* WELCOME HERO BANNER */}
          <div className="overview-header-banner">
            <div className="banner-content">
              <div className="banner-badge">
                <Sparkles size={14} /> Shopee Seller Analytics Pro
              </div>
              <h2 className="welcome-title">
                Tổng Quan Kinh Doanh Kênh Người Bán
              </h2>
              <p className="welcome-sub">
                Đang xem dữ liệu: <strong>{currentStoreObj ? `Gian Hàng: ${currentStoreObj.name}` : `Tất cả ${storesList.length} Gian Hàng sở hữu`}</strong>.
              </p>
            </div>
            <div className="banner-actions">
              <Button
                icon={<Plus size={16} />}
                onClick={() => setIsCreateStoreModalOpen(true)}
                className="btn-glass"
              >
                Mở Gian Hàng Mới
              </Button>
              <Button
                type="primary"
                danger
                icon={<PlusCircle size={16} />}
                onClick={handleOpenAddModal}
                className="btn-glow-orange"
              >
                Đăng Sản Phẩm Mới
              </Button>
            </div>
          </div>

          {/* STATS CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="stat-card group">
              <div className="stat-header">
                <div className="stat-icon-bg revenue">
                  <DollarSign size={24} />
                </div>
                <span className="trend-badge positive">
                  <TrendingUp size={12} /> +14.2%
                </span>
              </div>
              <div className="stat-info">
                <span className="stat-label">Tổng Doanh Thu</span>
                <h3 className="stat-value">{formatPrice(stats?.total_revenue || 0)}</h3>
                <span className="stat-sub">Đã xác nhận thanh toán</span>
              </div>
            </div>

            <div className="stat-card group">
              <div className="stat-header">
                <div className="stat-icon-bg products">
                  <Package size={24} />
                </div>
                <span className="trend-badge neutral">
                  <Layers size={12} /> {products.length} Mẫu
                </span>
              </div>
              <div className="stat-info">
                <span className="stat-label">Sản Phẩm Đang Bán</span>
                <h3 className="stat-value">{stats?.total_products || products.length || 0}</h3>
                <span className="stat-sub">Hiển thị công khai trên Shop</span>
              </div>
            </div>

            <div className="stat-card group">
              <div className="stat-header">
                <div className="stat-icon-bg orders">
                  <ShoppingBag size={24} />
                </div>
                <span className="trend-badge positive">
                  <TrendingUp size={12} /> +8.5%
                </span>
              </div>
              <div className="stat-info">
                <span className="stat-label">Đơn Hàng Shop</span>
                <h3 className="stat-value">{orders.length || stats?.total_purchases || 0}</h3>
                <span className="stat-sub">Lượt mua thành công</span>
              </div>
            </div>

            <div className="stat-card group">
              <div className="stat-header">
                <div className="stat-icon-bg rating">
                  <Star size={24} />
                </div>
                <span className="trend-badge star">
                  <Award size={12} /> Xuất Sắc
                </span>
              </div>
              <div className="stat-info">
                <span className="stat-label">Đánh Giá Trung Bình</span>
                <h3 className="stat-value">
                  {Number(stats?.avg_seller_rating || currentStoreObj?.rating_avg || 5.0).toFixed(1)} / 5.0
                </h3>
                <span className="stat-sub">Dựa trên phản hồi khách hàng</span>
              </div>
            </div>
          </div>

          {/* RECENT PRODUCTS & AI TIPS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h3 className="text-base font-bold text-gray-800 m-0 flex items-center gap-2">
                  <Package size={18} className="text-orange-500" /> Sản Phẩm Vừa Cập Nhật
                </h3>
                <button className="text-xs text-orange-600 font-bold hover:underline flex items-center gap-1" onClick={() => setActiveTab('products')}>
                  Xem tất cả ({products.length}) <ArrowUpRight size={14} />
                </button>
              </div>

              {loadingProducts ? (
                <div className="py-12 text-center"><Spin tip="Đang tải danh sách..." /></div>
              ) : products.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">Chưa có sản phẩm nào thuộc bộ lọc hiện tại.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {products.slice(0, 5).map(p => (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/50 p-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <img src={p.image_url} alt={p.name} className="w-12 h-12 object-cover rounded-xl border border-gray-100 shadow-sm" />
                        <div>
                          <h4 className="font-bold text-xs text-gray-800 m-0 line-clamp-1">{p.name}</h4>
                          <span className="text-[11px] text-gray-400">
                            Kho: <strong className="text-gray-700">{p.stock}</strong> • Gian hàng: <strong className="text-orange-600">{p.store_name || 'N/A'}</strong>
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-xs text-red-600">{formatPrice(p.price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI RECOMMENDATION TIPS */}
            <div className="ai-recommendation-card">
              <div className="ai-card-badge">
                <Sparkles size={14} /> AI Recommendation Engine
              </div>
              <h3 className="text-base font-bold text-orange-950 mb-2">
                Thuật Toán TF-IDF Cosine Similarity
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed mb-4">
                Hệ thống tự động phân tích vector nội dung sản phẩm thuộc từng Cửa hàng để tối ưu gợi ý cá nhân hóa cho Khách hàng.
              </p>

              <div className="space-y-3">
                <div className="bg-white/80 backdrop-blur rounded-xl p-3 border border-orange-100 text-xs">
                  <div className="font-bold text-orange-800 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" /> Tối ưu thẻ Tags sản phẩm
                  </div>
                  <p className="text-[11px] text-gray-600 m-0">Thêm tag ngắn gọn, chính xác thương hiệu để tăng 40% khả năng gợi ý.</p>
                </div>

                <div className="bg-white/80 backdrop-blur rounded-xl p-3 border border-orange-100 text-xs">
                  <div className="font-bold text-orange-800 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" /> Quản lý Đa Gian Hàng
                  </div>
                  <p className="text-[11px] text-gray-600 m-0">Chia nhóm gian hàng chuyên biệt để tăng tỷ lệ chuyển đổi đơn hàng.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 2. TAB PRODUCTS (QUẢN LÝ SẢN PHẨM) */}
      {/* ========================================================== */}
      {activeTab === 'products' && (
        <div className="tab-products space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-96 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Tìm sản phẩm theo tên, tags, thương hiệu..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <Button
              type="primary"
              danger
              icon={<PlusCircle size={16} />}
              onClick={handleOpenAddModal}
              className="btn-glow-orange font-bold"
            >
              Đăng Sản Phẩm Mới
            </Button>
          </div>

          {/* PRODUCTS TABLE */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loadingProducts ? (
              <div className="py-16 text-center"><Spin tip="Đang tải danh sách sản phẩm..." /></div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-xs">
                Không tìm thấy sản phẩm nào phù hợp.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="seller-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Gian hàng (Store)</th>
                      <th>Danh mục</th>
                      <th>Giá bán</th>
                      <th>Tồn kho</th>
                      <th>Lượt xem</th>
                      <th>Lượt mua</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <img src={p.image_url} alt={p.name} className="w-12 h-12 object-cover rounded-xl border border-gray-100 shadow-sm" />
                            <div>
                              <div className="font-bold text-xs text-gray-800 line-clamp-1">{p.name}</div>
                              <div className="text-[10px] text-gray-400">SKU: {p.sku || `#${p.id}`}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="store-pill-tag">
                            🏪 {p.store_name || 'Store'}
                          </span>
                        </td>
                        <td><span className="text-xs text-gray-600 font-medium">{p.category_name || 'N/A'}</span></td>
                        <td><strong className="text-xs text-red-600">{formatPrice(p.price)}</strong></td>
                        <td>
                          <div className="space-y-1">
                            <span className="text-xs text-gray-700 font-bold">{p.stock}</span>
                            <Progress percent={Math.min(100, (p.stock / 50) * 100)} showInfo={false} size="small" strokeColor={p.stock > 10 ? '#10b981' : '#f59e0b'} />
                          </div>
                        </td>
                        <td><span className="text-xs text-gray-500 font-medium">{p.views_count || 0}</span></td>
                        <td><span className="text-xs text-gray-500 font-medium">{p.purchases_count || 0}</span></td>
                        <td>
                          <span className={`status-pill ${p.status === 'archived' ? 'archived' : 'active'}`}>
                            {p.status === 'archived' ? 'Đã lưu trữ' : 'Đang bán'}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Tooltip title="Chỉnh sửa sản phẩm">
                              <button
                                className="action-icon-btn edit"
                                onClick={() => handleOpenEditModal(p)}
                              >
                                <Edit size={14} />
                              </button>
                            </Tooltip>
                            <Tooltip title="Ngừng bán / Lưu trữ">
                              <button
                                className="action-icon-btn delete"
                                onClick={() => setDeletingProdId(p.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 3. TAB ORDERS (QUẢN LÝ ĐƠN HÀNG) */}
      {/* ========================================================== */}
      {activeTab === 'orders' && (
        <div className="tab-orders space-y-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-gray-500 mr-2">Trạng thái đơn:</span>
            {[
              { key: 'all', label: 'Tất cả đơn' },
              { key: 'pending', label: 'Chờ xác nhận' },
              { key: 'processing', label: 'Đang xử lý' },
              { key: 'shipping', label: 'Đang giao' },
              { key: 'completed', label: 'Hoàn thành' },
              { key: 'cancelled', label: 'Đã hủy' }
            ].map(tab => (
              <button
                key={tab.key}
                className={`filter-tab-btn ${orderStatusFilter === tab.key ? 'active' : ''}`}
                onClick={() => setOrderStatusFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loadingOrders ? (
            <div className="py-16 text-center"><Spin tip="Đang tải danh sách đơn hàng..." /></div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-xs">Không có đơn hàng nào thuộc bộ lọc hiện tại.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {filteredOrders.map(order => (
                <div key={order.id} className="order-card-wrapper">
                  <div className="order-card-header">
                    <div>
                      <span className="font-bold text-gray-800 text-sm">Đơn hàng #{order.id}</span>
                      <span className="text-xs text-gray-400 ml-3">
                        Khách hàng: <strong>{order.customer_name || 'Khách hàng'}</strong> {order.customer_phone && `(${order.customer_phone})`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">Cập nhật trạng thái:</span>
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className="order-status-select"
                      >
                        <option value="pending">Chờ xác nhận</option>
                        <option value="processing">Đang xử lý</option>
                        <option value="shipping">Đang giao hàng</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </div>
                  </div>

                  <div className="py-4 space-y-3">
                    {order.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <img src={item.image_url} alt={item.product_name} className="w-11 h-11 object-cover rounded-xl border border-gray-100" />
                          <div>
                            <span className="font-semibold text-gray-800 text-xs">{item.product_name} x{item.quantity}</span>
                            {item.store_name && <div className="text-[10px] text-orange-600 font-medium">🏪 {item.store_name}</div>}
                          </div>
                        </div>
                        <span className="font-bold text-gray-800">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                    <div>Địa chỉ giao: <strong>{order.shipping_address}</strong></div>
                    <div>Tổng đơn: <strong className="text-red-600 text-sm font-bold">{formatPrice(order.total_amount)}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* 4. TAB STORE PROFILE & MULTI-STORE MANAGEMENT */}
      {/* ========================================================== */}
      {activeTab === 'store' && (
        <div className="tab-store space-y-6 max-w-5xl">
          {/* HEADER ACTION */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800 m-0 flex items-center gap-2">
                <Store size={20} className="text-orange-500" /> Danh Sách Gian Hàng Sở Hữu ({storesList.length} Stores)
              </h2>
              <p className="text-xs text-gray-500 m-0 mt-1">Nhấn "Chọn Chỉnh Sửa" trên thẻ Gian Hàng bên dưới để cập nhật thông tin tương ứng.</p>
            </div>

            <Button
              type="primary"
              danger
              icon={<Plus size={16} />}
              onClick={() => setIsCreateStoreModalOpen(true)}
              className="btn-glow-orange font-bold"
            >
              Mở Gian Hàng Mới
            </Button>
          </div>

          {/* STORE CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {storesList.map(st => {
              const isEditingThis = String(st.id) === String(editingStoreId);
              return (
                <div
                  key={st.id}
                  className={`store-profile-card ${isEditingThis ? 'selected' : ''}`}
                >
                  <div
                    className="store-card-banner"
                    style={{ backgroundImage: `url(${st.banner_url || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800'})` }}
                  >
                    {st.is_official === 1 && <span className="mall-tag">Shopee Mall</span>}
                  </div>

                  <div className="store-card-body">
                    <div className="flex items-start gap-4">
                      <img src={st.logo_url || 'https://via.placeholder.com/60'} alt={st.name} className="store-logo-avatar" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-gray-800 m-0 line-clamp-1">{st.name}</h3>
                        <p className="text-xs text-gray-400 m-0 mt-1 line-clamp-2">{st.description || 'Chưa có mô tả'}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                          <span className="text-amber-500 font-bold">★ {st.rating_avg || '5.0'}</span>
                          <span>•</span>
                          <span>{st.followers_count || 0} người theo dõi</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <button
                        onClick={() => selectStoreToEdit(st.id)}
                        className={`btn-select-store ${isEditingThis ? 'active' : ''}`}
                      >
                        <Edit size={14} /> {isEditingThis ? 'Đang Chỉnh Sửa' : 'Chọn Chỉnh Sửa'}
                      </button>

                      <Link
                        to={`/store/${st.slug}`}
                        target="_blank"
                        className="text-xs font-semibold text-gray-600 hover:text-orange-600 flex items-center gap-1"
                      >
                        <ExternalLink size={13} /> Trang Công Khai
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* STORE PROFILE EDIT FORM */}
          {activeEditingStoreObj && (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
              <div className="pb-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-gray-800 m-0">
                    Chỉnh Sửa Hồ Sơ Gian Hàng: <span className="text-orange-600">{activeEditingStoreObj.name}</span>
                  </h3>
                  <span className="text-xs text-gray-400">ID: #{activeEditingStoreObj.id} • Slug: {activeEditingStoreObj.slug}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-600">Đổi Gian Hàng Sửa:</span>
                  <select
                    value={editingStoreId}
                    onChange={(e) => selectStoreToEdit(e.target.value)}
                    className="px-3 py-1.5 border border-orange-300 rounded-xl text-xs font-bold text-gray-800 bg-orange-50 outline-none"
                  >
                    {storesList.map(s => (
                      <option key={s.id} value={s.id}>{s.name} {s.is_official ? '(Mall)' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LIVE PREVIEW OF LOGO & BANNER */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="md:col-span-2">
                  <span className="text-[11px] font-bold text-gray-500 block mb-1">Xem trước Ảnh Banner Cửa Hàng:</span>
                  <div
                    className="h-28 rounded-xl bg-cover bg-center border border-gray-200"
                    style={{ backgroundImage: `url(${storeForm.banner_url || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800'})` }}
                  ></div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-gray-500 block mb-1">Xem trước Logo:</span>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200">
                    <img src={storeForm.logo_url || 'https://via.placeholder.com/60'} alt="Logo" className="w-12 h-12 object-cover rounded-full border border-orange-500" />
                    <div>
                      <span className="font-bold text-xs text-gray-800 block line-clamp-1">{storeForm.name || 'Tên Cửa Hàng'}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">Active Store</span>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveStoreProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tên Gian Hàng *</label>
                  <input
                    type="text"
                    value={storeForm.name}
                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mô tả Gian Hàng</label>
                  <textarea
                    rows="4"
                    value={storeForm.description}
                    onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl text-xs outline-none focus:border-orange-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Logo / Avatar Cửa hàng (URL)</label>
                  <input
                    type="text"
                    value={storeForm.logo_url}
                    onChange={(e) => setStoreForm({ ...storeForm, logo_url: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ảnh Banner Cửa hàng (URL)</label>
                  <input
                    type="text"
                    value={storeForm.banner_url}
                    onChange={(e) => setStoreForm({ ...storeForm, banner_url: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    type="primary"
                    danger
                    htmlType="submit"
                    loading={savingStore}
                    className="btn-glow-orange font-bold px-6"
                  >
                    Lưu Thay Đổi Gian Hàng
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* MODAL THÊM / SỬA SẢN PHẨM */}
      <Modal
        title={<span className="font-bold text-base">{editingProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Đăng Bán Sản Phẩm Mới'}</span>}
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        footer={null}
        width={680}
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 pt-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Chọn Gian Hàng Mục Tiêu (Store) *</label>
            <select
              value={prodForm.store_id}
              onChange={(e) => setProdForm({ ...prodForm, store_id: e.target.value })}
              required
              className="w-full px-3 py-2 border border-orange-300 bg-orange-50 rounded-xl text-xs font-bold outline-none focus:border-orange-500"
            >
              {storesList.map(s => (
                <option key={s.id} value={s.id}>🏪 {s.name} {s.is_official ? '(Mall)' : ''}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tên sản phẩm *</label>
              <input
                type="text"
                value={prodForm.name}
                onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                placeholder="Nhập tên sản phẩm (VD: Laptop ASUS TUF, Áo thun Nike)..."
                required
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-orange-500"
              />

              {/* AI CATEGORY SUGGESTION BADGE */}
              {aiPredictedCategories && aiPredictedCategories.length > 0 && (
                <div className="mt-2 p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 flex items-center justify-between flex-wrap gap-2 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs text-amber-900 font-medium">
                    <Sparkles size={14} className="text-amber-500 animate-bounce" />
                    <span>AI Gợi Ý Danh Mục:</span>
                    <strong className="text-orange-600 font-bold">[{aiPredictedCategories[0].name}]</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProdForm({ ...prodForm, category_id: aiPredictedCategories[0].id })}
                    className="px-2.5 py-1 bg-orange-500 text-white rounded-lg text-[11px] font-bold hover:bg-orange-600 transition-all shadow-sm cursor-pointer"
                  >
                    + Áp dụng ngay
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Danh mục *</label>
              <select
                value={prodForm.category_id}
                onChange={(e) => setProdForm({ ...prodForm, category_id: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-orange-500"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Giá bán (VNĐ) *</label>
              <input
                type="number"
                value={prodForm.price}
                onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                placeholder="100000"
                min="0"
                required
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Giá gốc (VNĐ)</label>
              <input
                type="number"
                value={prodForm.original_price}
                onChange={(e) => setProdForm({ ...prodForm, original_price: e.target.value })}
                placeholder="150000"
                min="0"
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tồn kho</label>
              <input
                type="number"
                value={prodForm.stock}
                onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                placeholder="10"
                min="0"
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Ảnh sản phẩm (URL)</label>
            <input
              type="text"
              value={prodForm.image_url}
              onChange={(e) => setProdForm({ ...prodForm, image_url: e.target.value })}
              placeholder="Để trống nếu muốn tự động lấy ảnh Unsplash mẫu..."
              className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tags thuật toán AI (Phân cách bằng dấu phẩy)</label>
            <input
              type="text"
              value={prodForm.tags}
              onChange={(e) => setProdForm({ ...prodForm, tags: e.target.value })}
              placeholder="laptop, gaming, asus, intel"
              className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Mô tả sản phẩm</label>
            <textarea
              rows="4"
              value={prodForm.description}
              onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
              placeholder="Mô tả đặc điểm nổi bật sản phẩm..."
              className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-orange-500"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button onClick={() => setIsAddModalOpen(false)}>Hủy bỏ</Button>
            <Button type="primary" danger htmlType="submit" loading={submittingProd} className="btn-glow-orange font-bold">
              {editingProduct ? 'Cập Nhật Sản Phẩm' : 'Đăng Bán Ngay'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL TẠO GIAN HÀNG MỚI */}
      <Modal
        title={<span className="font-bold text-base">Tạo Gian Hàng (Store) Mới</span>}
        open={isCreateStoreModalOpen}
        onCancel={() => setIsCreateStoreModalOpen(false)}
        footer={null}
        width={550}
      >
        <form onSubmit={handleCreateNewStore} className="space-y-4 pt-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tên Gian Hàng *</label>
            <input
              type="text"
              value={newStoreForm.name}
              onChange={(e) => setNewStoreForm({ ...newStoreForm, name: e.target.value })}
              placeholder="Ví dụ: Shopee Smart Tech Store"
              required
              className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Mô tả Gian Hàng</label>
            <textarea
              rows="3"
              value={newStoreForm.description}
              onChange={(e) => setNewStoreForm({ ...newStoreForm, description: e.target.value })}
              placeholder="Giới thiệu về các mặt hàng chuyên bán của Gian hàng..."
              className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-orange-500"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Logo / Avatar Cửa hàng (URL)</label>
            <input
              type="text"
              value={newStoreForm.logo_url}
              onChange={(e) => setNewStoreForm({ ...newStoreForm, logo_url: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Ảnh Banner Cửa hàng (URL)</label>
            <input
              type="text"
              value={newStoreForm.banner_url}
              onChange={(e) => setNewStoreForm({ ...newStoreForm, banner_url: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button onClick={() => setIsCreateStoreModalOpen(false)}>Hủy bỏ</Button>
            <Button type="primary" danger htmlType="submit" loading={creatingStore} className="btn-glow-orange font-bold">
              Mở Gian Hàng Ngay
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={Boolean(deletingProdId)}
        title="Ngừng bán sản phẩm"
        message="Bạn có chắc chắn muốn lưu trữ / ngừng bán sản phẩm này không?"
        confirmText="Ngừng bán ngay"
        cancelText="Hủy"
        confirmVariant="danger"
        isLoading={deletingProdLoading}
        onConfirm={handleConfirmDeleteProduct}
        onCancel={() => setDeletingProdId(null)}
      />
    </div>
  );
}
