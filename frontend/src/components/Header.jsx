import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useReduxHooks';
import { setSearchQuery } from '../store/slices/productSlice';
import { logoutUser } from '../store/slices/authSlice';
import { trackUserInteraction } from '../store/slices/recommendationSlice';
import {
  ShoppingCart,
  Search,
  User,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  Sparkles,
  Tag,
  Store,
  ChevronDown,
  ShieldCheck,
  Building2
} from 'lucide-react';
import useDebounce from '../hooks/useDebounce';
import productApi from '../api/productApi';
import '../styles/header.css';

export default function Header() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const user = useAppSelector((state) => state.auth.user);
  const cartItems = useAppSelector((state) => state.cart.cartItems);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const isSeller = user && (user.role === 'seller' || (user.roles && user.roles.includes('seller')));
  const isAdmin = user && (user.role === 'admin' || (user.roles && user.roles.includes('admin')));

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [keywordSuggestions, setKeywordSuggestions] = useState([]);
  const [matchedProducts, setMatchedProducts] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 300);
  const suggestionRef = useRef(null);
  const userDropdownRef = useRef(null);

  // Đồng bộ search input khi URL query thay đổi
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearchInput(urlSearch);
    dispatch(setSearchQuery(urlSearch));
  }, [searchParams, dispatch]);

  const [isFallbackSuggest, setIsFallbackSuggest] = useState(false);
  const [suggestTokens, setSuggestTokens] = useState([]);

  // Gọi API Smart Auto-complete Suggest (/products/search/suggest?q=...) khi gõ
  useEffect(() => {
    if (debouncedSearch.trim().length >= 1) {
      productApi.searchSuggest(debouncedSearch.trim())
        .then((res) => {
          setKeywordSuggestions(res.suggestions || []);
          setMatchedProducts(res.products || []);
          setIsFallbackSuggest(Boolean(res.isFallback));
          setSuggestTokens(res.tokens || []);
        })
        .catch(() => {
          setKeywordSuggestions([]);
          setMatchedProducts([]);
          setIsFallbackSuggest(false);
          setSuggestTokens([]);
        });
    } else {
      setKeywordSuggestions([]);
      setMatchedProducts([]);
      setIsFallbackSuggest(false);
      setSuggestTokens([]);
    }
  }, [debouncedSearch]);

  // Click ra ngoài để ẩn khung gợi ý & dropdown avatar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!searchInput.trim()) return;
    dispatch(setSearchQuery(searchInput.trim()));
    setShowSuggestions(false);
    navigate(`/?search=${encodeURIComponent(searchInput.trim())}`);
  };

  const handleKeywordClick = (keyword) => {
    setSearchInput(keyword);
    dispatch(setSearchQuery(keyword));
    setShowSuggestions(false);
    navigate(`/?search=${encodeURIComponent(keyword)}`);
  };

  const handleProductSuggestionClick = (productId) => {
    setShowSuggestions(false);
    dispatch(trackUserInteraction({ productId, type: 'search_click' }));
    navigate(`/product/${productId}`);
  };

  const handleLogoClick = () => {
    setSearchInput('');
    dispatch(setSearchQuery(''));
    navigate('/');
  };

  const handleLogout = () => {
    setShowDropdown(false);
    dispatch(logoutUser());
  };

  const hasSuggestions = keywordSuggestions.length > 0 || matchedProducts.length > 0;

  return (
    <header className="shopee-header">
      <div className="header-container">
        {/* Logo */}
        <Link to="/" onClick={handleLogoClick} className="logo-section">
          <span className="logo-text">Shopee</span>
          <span className="logo-subtext">Recommendation</span>
        </Link>

        {/* Smart Search Bar & Auto-complete dropdown */}
        <div className="search-wrapper" ref={suggestionRef}>
          <form onSubmit={handleSearchSubmit} className="search-section">
            <input
              type="text"
              className="search-input"
              placeholder="Nhập từ khóa tìm kiếm (VD: laptop, iphone, váy, bàn phím)..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            <button type="submit" className="search-btn">
              <Search size={18} />
            </button>
          </form>

          {/* Smart Live Suggestions Dropdown */}
          {showSuggestions && hasSuggestions && (
            <div className="search-suggestions-dropdown">
              {keywordSuggestions.length > 0 && (
                <div className="suggestion-keywords-group">
                  <div className="suggestion-group-title">
                    <Sparkles size={14} className="icon-sparkle" />
                    Từ khóa xu hướng từ search logs:
                  </div>
                  <div className="keywords-pills">
                    {keywordSuggestions.map((kw, idx) => (
                      <span
                        key={idx}
                        className="keyword-pill"
                        onClick={() => handleKeywordClick(kw)}
                      >
                        <Tag size={12} />
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {matchedProducts.length > 0 && (
                <div className="suggestion-products-group">
                  <div className="suggestion-group-title">
                    {isFallbackSuggest && suggestTokens.length > 0
                      ? `🔍 Gợi ý theo từ khóa: #${suggestTokens.join(', #')}`
                      : 'Sản phẩm gợi ý khớp từ khóa:'}
                  </div>
                  {matchedProducts.map((item) => (
                    <div
                      key={item.id}
                      className="suggestion-item"
                      onClick={() => handleProductSuggestionClick(item.id)}
                    >
                      <img src={item.image_url} alt={item.name} className="suggestion-img" />
                      <div className="suggestion-info">
                        <span className="suggestion-name">{item.name}</span>
                        <div className="suggestion-meta">
                          <span className="suggestion-cat">{item.category_name}</span>
                          <span className="suggestion-price">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="actions-section">
          {/* Nút Kênh Người Bán Nổi Bật cho Tài khoản Seller */}
          {isSeller && (
            <Link to="/seller" className="seller-portal-header-btn">
              <Store size={16} />
              <span>Kênh Người Bán</span>
            </Link>
          )}

          {/* Nút Kênh Quản Trị nổi bật cho Tài khoản Admin */}
          {isAdmin && (
            <Link to="/admin" className="admin-portal-header-btn">
              <ShieldCheck size={16} />
              <span>Kênh Quản Trị</span>
            </Link>
          )}

          <Link to="/cart" className="cart-icon-container">
            <ShoppingCart size={24} />
            {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
          </Link>

          {/* USER AVATAR POPUP DROPDOWN MENU */}
          <div className="user-profile-section" ref={userDropdownRef}>
            {user ? (
              <div className="avatar-dropdown-wrapper">
                <button
                  type="button"
                  className={`avatar-trigger-btn ${showDropdown ? 'active' : ''}`}
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <div className="avatar-circle">
                    {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="username-label">{user.full_name || user.username}</span>
                  <ChevronDown size={14} className={`chevron-icon ${showDropdown ? 'rotate' : ''}`} />
                </button>

                {/* FLOATING POPUP CARD DROPDOWN */}
                {showDropdown && (
                  <div className="user-popup-menu fade-in-down">
                    <div className="popup-arrow"></div>

                    {/* POPUP HEADER USER INFO */}
                    <div className="popup-user-header">
                      <div className="popup-avatar">
                        {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="popup-user-details">
                        <h4 className="popup-user-name">{user.full_name || user.username}</h4>
                        <span className="popup-user-email">{user.email || `@${user.username}`}</span>
                        <div className="popup-role-pill">
                          {isAdmin ? (
                            <span className="role-tag admin flex items-center gap-1">
                              <ShieldCheck size={12} /> Quản Trị Viên
                            </span>
                          ) : isSeller ? (
                            <span className="role-tag seller flex items-center gap-1">
                              <ShieldCheck size={12} /> Người Bán Pro
                            </span>
                          ) : (
                            <span className="role-tag customer">🛒 Khách Hàng</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="popup-divider"></div>

                    {/* MENU LIST ITEMS */}
                    <div className="popup-menu-list">
                      <Link
                        to="/profile"
                        className="popup-menu-item"
                        onClick={() => setShowDropdown(false)}
                      >
                        <User size={16} className="menu-icon" />
                        <span>Hồ Sơ Cá Nhân</span>
                      </Link>

                      <Link
                        to="/orders"
                        className="popup-menu-item"
                        onClick={() => setShowDropdown(false)}
                      >
                        <ClipboardList size={16} className="menu-icon" />
                        <span>Đơn Mua Của Tôi</span>
                      </Link>

                      <Link
                        to="/store"
                        className="popup-menu-item"
                        onClick={() => setShowDropdown(false)}
                      >
                        <Building2 size={16} className="menu-icon" />
                        <span>Khám Phá Shopee Mall</span>
                      </Link>

                      {isSeller && (
                        <Link
                          to="/seller"
                          className="popup-menu-item seller-highlight"
                          onClick={() => setShowDropdown(false)}
                        >
                          <LayoutDashboard size={16} className="menu-icon text-orange-500" />
                          <span>Kênh Người Bán Pro</span>
                        </Link>
                      )}

                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="popup-menu-item admin-highlight"
                          onClick={() => setShowDropdown(false)}
                        >
                          <ShieldCheck size={16} className="menu-icon text-indigo-500" />
                          <span>Kênh Quản Trị Admin</span>
                        </Link>
                      )}
                    </div>

                    <div className="popup-divider"></div>

                    {/* LOGOUT BUTTON */}
                    <button onClick={handleLogout} className="popup-logout-btn">
                      <LogOut size={16} />
                      <span>Đăng Xuất Tài Khoản</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/auth" className="login-link">
                <User size={18} />
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
