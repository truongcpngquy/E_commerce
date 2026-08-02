import React, { useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { logoutUser } from '../../store/slices/authSlice';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Store,
  LogOut,
  ExternalLink,
  ShoppingBag as ShopeeBagIcon,
  UserCheck,
  Eye,
  Plus,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import './SellerLayout.css';

export default function SellerLayout({ activeTab, setActiveTab, selectedStoreId, setSelectedStoreId, storesList, setStoresList, loadStoresData }) {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && loadStoresData) {
      loadStoresData();
    }
  }, [user]);

  const currentStore = storesList.find(s => String(s.id) === String(selectedStoreId));

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/auth');
  };

  const navItems = [
    { key: 'overview', label: 'Tổng Quan & Thống Kê', icon: LayoutDashboard, badge: 'Hot' },
    { key: 'products', label: 'Quản Lý Sản Phẩm', icon: Package, count: null },
    { key: 'orders', label: 'Quản Lý Đơn Hàng', icon: ShoppingBag, count: null },
    { key: 'store', label: 'Gian Hàng & Hồ Sơ', icon: Store, count: storesList.length },
  ];

  return (
    <div className="seller-portal-layout">
      {/* SIDEBAR NAVIGATION */}
      <aside className="seller-sidebar">
        <div className="seller-brand">
          <div className="brand-logo-icon">
            <ShopeeBagIcon size={22} color="#ffffff" />
          </div>
          <div className="brand-titles">
            <span className="brand-name">Shopee Seller</span>
            <span className="brand-sub">
              <Sparkles size={10} /> Kênh Người Bán Pro
            </span>
          </div>
        </div>

        {/* STORE SELECTOR (1 Seller -> N Stores) */}
        <div className="store-selector-wrapper">
          <div className="store-selector-header">
            <span className="store-selector-label">
              <Store size={12} /> BỘ CHỌN GIAN HÀNG
            </span>
            <span className="store-count-tag">{storesList.length} Stores</span>
          </div>
          <div className="store-select-box">
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="store-dropdown-select"
            >
              <option value="all">🌐 Tất cả Gian Hàng ({storesList.length})</option>
              {storesList.map(s => (
                <option key={s.id} value={s.id}>
                  🏪 {s.name} {s.is_official ? '⭐ (Mall)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CURRENT STORE BADGE CARD */}
        <div className="seller-shop-badge-card">
          <div className="relative">
            {currentStore?.logo_url ? (
              <img src={currentStore.logo_url} alt={currentStore.name} className="shop-avatar-img" />
            ) : (
              <div className="shop-avatar">
                {currentStore?.name ? currentStore.name.charAt(0).toUpperCase() : (user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'S')}
              </div>
            )}
            <span className="online-indicator" title="Cửa hàng hoạt động"></span>
          </div>
          <div className="shop-info">
            <h4 className="shop-name">{currentStore ? currentStore.name : 'Tất Cả Gian Hàng'}</h4>
            <span className="shop-role-tag">
              <ShieldCheck size={12} className="text-emerald-600" /> Người bán đã xác thực
            </span>
          </div>
        </div>

        {/* NAVIGATION MENU */}
        <nav className="seller-nav-menu">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                className={`seller-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.key)}
              >
                <div className="nav-item-left">
                  <IconComponent size={18} />
                  <span>{item.label}</span>
                </div>
                {item.badge && <span className="nav-badge-pill">{item.badge}</span>}
                {item.count !== null && item.count !== undefined && (
                  <span className="nav-count-pill">{item.count}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="seller-sidebar-footer">
          {currentStore?.slug ? (
            <Link to={`/store/${currentStore.slug}`} target="_blank" className="sidebar-link-btn view-shop-btn">
              <Eye size={15} /> Xem Shop Công Khai <ChevronRight size={14} />
            </Link>
          ) : storesList.length > 0 && (
            <Link to={`/store/${storesList[0].slug}`} target="_blank" className="sidebar-link-btn view-shop-btn">
              <Eye size={15} /> Xem Shop Công Khai <ChevronRight size={14} />
            </Link>
          )}

          <Link to="/" className="sidebar-link-btn">
            <ExternalLink size={15} /> Quay lại Shopee Mua Sắm
          </Link>

          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <LogOut size={15} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="seller-main-wrapper">
        <header className="seller-top-header">
          <div className="header-left">
            <h2 className="header-title">Quản Lý Kênh Bán Hàng Shopee Pro</h2>
            <span className="header-subtitle">Hệ thống gợi ý & quản lý thương mại đa gian hàng</span>
          </div>

          <div className="header-right">
            <div className="header-store-badge">
              <span className="pulse-dot"></span>
              <Store size={14} className="text-orange-600" />
              <span>Đang chọn: <strong>{currentStore ? currentStore.name : 'Tất Cả Gian Hàng'}</strong></span>
            </div>

            <div className="header-user-badge">
              <div className="user-mini-avatar">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-mini-text">
                <span className="user-name">{user?.full_name || user?.username}</span>
                <span className="user-role">Seller Partner</span>
              </div>
            </div>
          </div>
        </header>

        <main className="seller-content-body">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
