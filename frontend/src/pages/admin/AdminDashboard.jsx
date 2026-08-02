import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import { showToast } from '../../store/slices/uiSlice';
import adminApi from '../../api/adminApi';
import {
  Users,
  ShoppingBag,
  Store,
  ClipboardList,
  BarChart3,
  Search,
  Lock,
  Unlock,
  Shield,
  Trash2,
  RefreshCw,
  TrendingUp,
  DollarSign,
  UserCheck,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Truck
} from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // States for data
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  // Search/Filter states
  const [userSearch, setUserSearch] = useState('');
  const [storeSearch, setStoreSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Load stats
  const fetchStats = async () => {
    try {
      const res = await adminApi.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      dispatch(showToast(err.message || 'Lỗi tải thống kê hệ thống', 'error'));
    }
  };

  // Load current tab data
  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        await fetchStats();
        const resOrders = await adminApi.getOrders();
        if (resOrders.success) {
          setOrders(resOrders.data);
        }
      } else if (activeTab === 'users') {
        const res = await adminApi.getUsers();
        if (res.success) {
          setUsers(res.data);
        }
      } else if (activeTab === 'stores') {
        const res = await adminApi.getStores();
        if (res.success) {
          setStores(res.data);
        }
      } else if (activeTab === 'products') {
        const res = await adminApi.getProducts();
        if (res.success) {
          setProducts(res.data);
        }
      } else if (activeTab === 'orders') {
        const res = await adminApi.getOrders();
        if (res.success) {
          setOrders(res.data);
        }
      }
    } catch (err) {
      dispatch(showToast(err.message || 'Lỗi tải dữ liệu', 'error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Actions
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await adminApi.updateUserStatus(userId, newStatus);
      if (res.success) {
        dispatch(showToast(res.message || 'Cập nhật trạng thái tài khoản thành công', 'success'));
        // Cập nhật state local
        setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        fetchStats();
      }
    } catch (err) {
      dispatch(showToast(err.message || 'Lỗi cập nhật trạng thái', 'error'));
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const res = await adminApi.updateUserRole(userId, newRole);
      if (res.success) {
        dispatch(showToast(res.message || 'Thay đổi vai trò thành công', 'success'));
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        fetchStats();
      }
    } catch (err) {
      dispatch(showToast(err.message || 'Lỗi cập nhật vai trò', 'error'));
    }
  };

  const handleToggleStoreStatus = async (storeId, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await adminApi.updateStoreStatus(storeId, newStatus);
      if (res.success) {
        dispatch(showToast(res.message || 'Cập nhật trạng thái cửa hàng thành công', 'success'));
        setStores(stores.map(s => s.id === storeId ? { ...s, status: newStatus } : s));
        fetchStats();
      }
    } catch (err) {
      dispatch(showToast(err.message || 'Lỗi cập nhật trạng thái cửa hàng', 'error'));
    }
  };

  const handleArchiveProduct = async (productId) => {
    if (!window.confirm('Bạn có chắc chắn muốn khóa/gỡ sản phẩm này khỏi hệ thống không?')) return;
    try {
      const res = await adminApi.deleteProduct(productId);
      if (res.success) {
        dispatch(showToast(res.message || 'Đã gỡ sản phẩm thành công', 'success'));
        setProducts(products.map(p => p.id === productId ? { ...p, status: 'archived' } : p));
        fetchStats();
      }
    } catch (err) {
      dispatch(showToast(err.message || 'Lỗi gỡ sản phẩm', 'error'));
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await adminApi.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        dispatch(showToast(res.message || 'Cập nhật đơn hàng thành công', 'success'));
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        fetchStats();
      }
    } catch (err) {
      dispatch(showToast(err.message || 'Lỗi cập nhật đơn hàng', 'error'));
    }
  };

  // Helper formats
  const formatVND = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOrderStatusPill = (status) => {
    switch (status) {
      case 'completed':
        return <span className="status-pill status-completed"><CheckCircle2 size={12} /> Hoàn thành</span>;
      case 'cancelled':
        return <span className="status-pill status-cancelled"><XCircle size={12} /> Đã hủy</span>;
      case 'refunded':
        return <span className="status-pill status-refunded"><AlertCircle size={12} /> Trả hàng</span>;
      case 'shipping':
        return <span className="status-pill status-shipping"><Truck size={12} /> Đang giao</span>;
      case 'confirmed':
      case 'processing':
        return <span className="status-pill status-processing"><Clock size={12} /> Xử lý</span>;
      case 'pending':
      default:
        return <span className="status-pill status-pending"><Clock size={12} /> Chờ duyệt</span>;
    }
  };

  // Filter lists
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(userSearch.toLowerCase()));
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredStores = stores.filter(s => {
    return (
      s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
      s.owner_username.toLowerCase().includes(storeSearch.toLowerCase()) ||
      s.owner_email.toLowerCase().includes(storeSearch.toLowerCase())
    );
  });

  const filteredProducts = products.filter(p => {
    return (
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.store_name && p.store_name.toLowerCase().includes(productSearch.toLowerCase())) ||
      (p.category_name && p.category_name.toLowerCase().includes(productSearch.toLowerCase()))
    );
  });

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.id.toString().includes(orderSearch) ||
      o.customer_username.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(orderSearch.toLowerCase()));
    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <Shield size={24} className="brand-icon" />
          <div>
            <h3>Shopee Admin</h3>
            <span>System Manager</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 size={18} />
            <span>Tổng quan hệ thống</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} />
            <span>Quản lý người dùng</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'stores' ? 'active' : ''}`}
            onClick={() => setActiveTab('stores')}
          >
            <Store size={18} />
            <span>Quản lý cửa hàng</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <ShoppingBag size={18} />
            <span>Kiểm duyệt sản phẩm</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ClipboardList size={18} />
            <span>Quản lý đơn hàng</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Top Header */}
        <header className="admin-top-header">
          <div className="header-title">
            <h2>
              {activeTab === 'overview' && 'Tổng quan hệ thống'}
              {activeTab === 'users' && 'Quản lý người dùng'}
              {activeTab === 'stores' && 'Quản lý cửa hàng'}
              {activeTab === 'products' && 'Kiểm duyệt sản phẩm'}
              {activeTab === 'orders' && 'Quản lý đơn hàng'}
            </h2>
            <p>Hệ thống giám sát và quản trị Smart E-Commerce</p>
          </div>
          <button className="refresh-btn" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Làm mới</span>
          </button>
        </header>

        {loading ? (
          <div className="admin-loading-spinner">
            <RefreshCw size={40} className="spin text-indigo-600" />
            <p>Đang tải dữ liệu hệ thống...</p>
          </div>
        ) : (
          <div className="admin-content-body fade-in">
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && stats && (
              <div className="overview-tab-content">
                {/* Stats Cards */}
                <div className="stats-cards-grid">
                  <div className="stat-card card-revenue">
                    <div className="card-header">
                      <div className="icon-wrapper bg-emerald-100 text-emerald-600">
                        <DollarSign size={24} />
                      </div>
                      <span className="card-label">Doanh thu hệ thống</span>
                    </div>
                    <div className="card-value">{formatVND(stats.orders.completedRevenue)}</div>
                    <p className="card-trend"><TrendingUp size={14} /> Dựa trên đơn hoàn thành</p>
                  </div>

                  <div className="stat-card card-users">
                    <div className="card-header">
                      <div className="icon-wrapper bg-indigo-100 text-indigo-600">
                        <Users size={24} />
                      </div>
                      <span className="card-label">Tổng người dùng</span>
                    </div>
                    <div className="card-value">{stats.users.total}</div>
                    <div className="card-sub-stats">
                      <span>{stats.users.customers} Khách</span>
                      <span>•</span>
                      <span>{stats.users.sellers} Shop</span>
                    </div>
                  </div>

                  <div className="stat-card card-stores">
                    <div className="card-header">
                      <div className="icon-wrapper bg-amber-100 text-amber-600">
                        <Store size={24} />
                      </div>
                      <span className="card-label">Tổng số gian hàng</span>
                    </div>
                    <div className="card-value">{stats.stores}</div>
                    <p className="card-trend text-amber-600"><UserCheck size={14} /> Đang hoạt động trên sàn</p>
                  </div>

                  <div className="stat-card card-orders">
                    <div className="card-header">
                      <div className="icon-wrapper bg-rose-100 text-rose-600">
                        <ClipboardList size={24} />
                      </div>
                      <span className="card-label">Tổng số đơn hàng</span>
                    </div>
                    <div className="card-value">{stats.orders.total}</div>
                    <p className="card-trend text-rose-600">Phát sinh từ giỏ hàng</p>
                  </div>
                </div>

                {/* Dashboard Sub-layouts */}
                <div className="overview-details-grid">
                  {/* Left Column: Order Status Distribution */}
                  <div className="overview-card order-distribution-card">
                    <h3>Phân bố trạng thái đơn hàng</h3>
                    <div className="status-bars-container">
                      {stats.orders.statusStats && stats.orders.statusStats.length > 0 ? (
                        stats.orders.statusStats.map((item, idx) => {
                          const percent = stats.orders.total > 0
                            ? Math.round((item.count / stats.orders.total) * 100)
                            : 0;
                          return (
                            <div key={idx} className="status-bar-row">
                              <div className="status-bar-info">
                                <span className="status-name text-capitalize">{item.status}</span>
                                <span className="status-count">{item.count} đơn ({percent}%)</span>
                              </div>
                              <div className="status-bar-track">
                                <div
                                  className={`status-bar-fill fill-${item.status}`}
                                  style={{ width: `${percent}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="no-data-text">Chưa có dữ liệu đơn hàng trên hệ thống.</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Recent Orders */}
                  <div className="overview-card recent-orders-card">
                    <div className="card-title-action">
                      <h3>Đơn hàng mới gần đây</h3>
                      <button className="view-all-link" onClick={() => setActiveTab('orders')}>Xem tất cả</button>
                    </div>
                    <div className="recent-orders-list">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="recent-order-item">
                          <div className="order-main-info">
                            <span className="order-id">Đơn #{order.id}</span>
                            <span className="order-customer">{order.customer_name || order.customer_username}</span>
                          </div>
                          <div className="order-meta-info">
                            <span className="order-amount">{formatVND(order.total_amount)}</span>
                            {getOrderStatusPill(order.status)}
                          </div>
                        </div>
                      ))}
                      {orders.length === 0 && (
                        <p className="no-data-text">Không có đơn hàng nào gần đây.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. USERS TAB */}
            {activeTab === 'users' && (
              <div className="admin-card">
                <div className="table-controls">
                  <div className="search-box">
                    <Search size={18} />
                    <input
                      type="text"
                      placeholder="Tìm kiếm user theo username, email, tên..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                  <div className="filter-select">
                    <span className="filter-label">Vai trò:</span>
                    <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
                      <option value="all">Tất cả</option>
                      <option value="customer">Customer</option>
                      <option value="seller">Seller Pro</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Tài khoản</th>
                        <th>Thông tin liên hệ</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                        <th className="text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className={user.status === 'suspended' ? 'row-muted' : ''}>
                          <td><strong>#{user.id}</strong></td>
                          <td>
                            <div className="user-info-cell">
                              <span className="cell-username">{user.username}</span>
                              <span className="cell-fullname">{user.full_name || 'Chưa cập nhật họ tên'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="user-contact-cell">
                              <span>{user.email}</span>
                              <span className="cell-phone">{user.phone || 'Chưa có SĐT'}</span>
                            </div>
                          </td>
                          <td>
                            <select
                              className="role-selector"
                              value={user.role}
                              onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                              disabled={user.role === 'admin' && user.username === 'admin'} // Khóa bảo vệ tài khoản root admin
                            >
                              <option value="customer">Khách hàng</option>
                              <option value="seller">Người bán</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td>
                            <span className={`status-badge badge-${user.status}`}>
                              {user.status === 'active' ? 'Đang hoạt động' : 'Đã bị khóa'}
                            </span>
                          </td>
                          <td>{formatDate(user.created_at)}</td>
                          <td className="text-right">
                            {user.username !== 'admin' ? (
                              <button
                                className={`action-btn-icon btn-${user.status === 'suspended' ? 'activate' : 'suspend'}`}
                                onClick={() => handleToggleUserStatus(user.id, user.status)}
                                title={user.status === 'suspended' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                              >
                                {user.status === 'suspended' ? <Unlock size={16} /> : <Lock size={16} />}
                              </button>
                            ) : (
                              <span className="action-disabled">Root Admin</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan="7" className="text-center no-results">Không tìm thấy người dùng phù hợp.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. STORES TAB */}
            {activeTab === 'stores' && (
              <div className="admin-card">
                <div className="table-controls">
                  <div className="search-box">
                    <Search size={18} />
                    <input
                      type="text"
                      placeholder="Tìm kiếm gian hàng theo tên shop, chủ sở hữu..."
                      value={storeSearch}
                      onChange={(e) => setStoreSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Gian hàng</th>
                        <th>Chủ sở hữu</th>
                        <th>Đánh giá trung bình</th>
                        <th>Người theo dõi</th>
                        <th>Trạng thái</th>
                        <th>Ngày đăng ký</th>
                        <th className="text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStores.map((store) => (
                        <tr key={store.id} className={store.status === 'suspended' ? 'row-muted' : ''}>
                          <td><strong>#{store.id}</strong></td>
                          <td>
                            <div className="store-info-cell">
                              {store.logo_url && <img src={store.logo_url} alt="" className="store-avatar-mini" />}
                              <div className="store-name-block">
                                <span className="cell-store-name">{store.name}</span>
                                {store.is_official === 1 && <span className="mall-badge">Mall</span>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="owner-info-cell">
                              <span>{store.owner_username}</span>
                              <span className="owner-email">{store.owner_email}</span>
                            </div>
                          </td>
                          <td>
                            <div className="rating-cell">
                              <span>★ {parseFloat(store.rating_avg).toFixed(2)}</span>
                            </div>
                          </td>
                          <td>{store.followers_count.toLocaleString()}</td>
                          <td>
                            <span className={`status-badge badge-${store.status}`}>
                              {store.status === 'active' ? 'Đang bán' : 'Đóng băng'}
                            </span>
                          </td>
                          <td>{formatDate(store.created_at)}</td>
                          <td className="text-right">
                            <button
                              className={`action-btn-icon btn-${store.status === 'suspended' ? 'activate' : 'suspend'}`}
                              onClick={() => handleToggleStoreStatus(store.id, store.status)}
                              title={store.status === 'suspended' ? 'Mở băng cửa hàng' : 'Đóng băng cửa hàng'}
                            >
                              {store.status === 'suspended' ? <Unlock size={16} /> : <Lock size={16} />}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredStores.length === 0 && (
                        <tr>
                          <td colSpan="8" className="text-center no-results">Không tìm thấy gian hàng nào.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. PRODUCTS TAB */}
            {activeTab === 'products' && (
              <div className="admin-card">
                <div className="table-controls">
                  <div className="search-box">
                    <Search size={18} />
                    <input
                      type="text"
                      placeholder="Tìm kiếm sản phẩm, danh mục, gian hàng..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Hình ảnh</th>
                        <th>Tên sản phẩm</th>
                        <th>Gian hàng</th>
                        <th>Danh mục</th>
                        <th>Giá bán</th>
                        <th>Tồn kho</th>
                        <th>Trạng thái</th>
                        <th className="text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((prod) => (
                        <tr key={prod.id} className={prod.status === 'archived' ? 'row-muted' : ''}>
                          <td><strong>#{prod.id}</strong></td>
                          <td>
                            <img src={prod.image_url} alt="" className="table-product-image" />
                          </td>
                          <td className="max-w-xs truncate-cell" title={prod.name}>
                            <strong>{prod.name}</strong>
                          </td>
                          <td>{prod.store_name || 'N/A'}</td>
                          <td>{prod.category_name || 'Chưa phân loại'}</td>
                          <td><span className="text-orange-500 font-semibold">{formatVND(prod.price)}</span></td>
                          <td>{prod.stock}</td>
                          <td>
                            <span className={`status-badge badge-${prod.status}`}>
                              {prod.status === 'active' && 'Đang bán'}
                              {prod.status === 'draft' && 'Bản nháp'}
                              {prod.status === 'out_of_stock' && 'Hết hàng'}
                              {prod.status === 'archived' && 'Bị khóa/Ẩn'}
                            </span>
                          </td>
                          <td className="text-right text-nowrap">
                            {prod.status !== 'archived' ? (
                              <button
                                className="action-btn-icon btn-delete"
                                onClick={() => handleArchiveProduct(prod.id)}
                                title="Khóa sản phẩm"
                              >
                                <Trash2 size={16} />
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">Đã khóa</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan="9" className="text-center no-results">Không tìm thấy sản phẩm phù hợp.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="admin-card">
                <div className="table-controls">
                  <div className="search-box">
                    <Search size={18} />
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo mã đơn, tên khách hàng..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                    />
                  </div>
                  <div className="filter-select">
                    <span className="filter-label">Trạng thái đơn:</span>
                    <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}>
                      <option value="all">Tất cả</option>
                      <option value="pending">Chờ duyệt (Pending)</option>
                      <option value="confirmed">Đã xác nhận</option>
                      <option value="processing">Đang xử lý</option>
                      <option value="shipping">Đang giao hàng</option>
                      <option value="completed">Đã hoàn thành</option>
                      <option value="cancelled">Đã hủy</option>
                      <option value="refunded">Trả hàng/Hoàn tiền</option>
                    </select>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Khách mua hàng</th>
                        <th>Tổng tiền</th>
                        <th>Thanh toán</th>
                        <th>Ngày đặt hàng</th>
                        <th>Địa chỉ giao hàng</th>
                        <th>Trạng thái hiện tại</th>
                        <th className="text-right">Thay đổi trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((ord) => (
                        <tr key={ord.id}>
                          <td><strong>#{ord.id}</strong></td>
                          <td>
                            <div className="customer-info-cell">
                              <span className="cell-username">{ord.customer_name || ord.customer_username}</span>
                              <span className="cell-sub">@{ord.customer_username}</span>
                            </div>
                          </td>
                          <td><span className="font-semibold text-emerald-600">{formatVND(ord.total_amount)}</span></td>
                          <td>
                            <span className="payment-method-tag">{ord.payment_method.toUpperCase()}</span>
                          </td>
                          <td>{formatDate(ord.created_at)}</td>
                          <td className="max-w-xs truncate-cell" title={ord.shipping_address}>
                            {ord.shipping_address}
                          </td>
                          <td>{getOrderStatusPill(ord.status)}</td>
                          <td className="text-right">
                            <select
                              className="order-status-selector"
                              value={ord.status}
                              onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                            >
                              <option value="pending">Chờ duyệt</option>
                              <option value="confirmed">Đã xác nhận</option>
                              <option value="processing">Đang xử lý</option>
                              <option value="shipping">Đang giao</option>
                              <option value="completed">Hoàn thành</option>
                              <option value="cancelled">Hủy bỏ</option>
                              <option value="refunded">Hoàn tiền</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan="8" className="text-center no-results">Không tìm thấy đơn hàng nào.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
