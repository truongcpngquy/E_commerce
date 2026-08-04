import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ShoppingCart, Search, User, LogOut, LayoutDashboard, ClipboardList, Tag, Sparkles, Loader2, Shield } from 'lucide-react';
import './Header.css';

const API_BASE_URL = 'http://localhost:5000/api';

export default function Header() {
  const { user, logout, cartCount, searchQuery, setSearchQuery } = useApp();
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [showDropdown, setShowDropdown] = useState(false);

  // Live Auto-complete Search State
  const [matchedProducts, setMatchedProducts] = useState([]);
  const [keywordSuggestions, setKeywordSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const searchContainerRef = useRef(null);
  const navigate = useNavigate();

  // Format VND
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/');
  };

  // Đồng bộ searchInput với searchQuery từ Context
  useEffect(() => {
    setSearchInput(searchQuery || '');
  }, [searchQuery]);

  // Gọi API Gợi Ý Tự Động (/api/products/search/suggest?q=...) khi gõ
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed.length < 1) {
      setMatchedProducts([]);
      setKeywordSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    const timer = setTimeout(() => {
      fetch(`${API_BASE_URL}/products/search/suggest?q=${encodeURIComponent(trimmed)}`)
        .then((res) => {
          if (!res.ok) throw new Error('Suggest API Error');
          return res.json();
        })
        .then((data) => {
          setMatchedProducts(data.products || []);
          setKeywordSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        })
        .catch(() => {
          setMatchedProducts([]);
          setKeywordSuggestions([]);
        })
        .finally(() => {
          setLoadingSuggestions(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Đóng gợi ý khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    setSearchQuery(searchInput);
    navigate('/');
  };

  const handleSelectSuggestionKeyword = (kw) => {
    setSearchInput(kw);
    setSearchQuery(kw);
    setShowSuggestions(false);
    navigate('/');
  };

  const handleSelectProduct = (productId) => {
    setShowSuggestions(false);
    navigate(`/product/${productId}`);
  };

  const handleLogoClick = () => {
    setSearchInput('');
    setSearchQuery('');
    setShowSuggestions(false);
  };

  return (
    <header className="shopee-header">
      <div className="header-container">
        {/* Logo */}
        <Link to="/" onClick={handleLogoClick} className="logo-section">
          <span className="logo-text">Shopee</span>
          <span className="logo-subtext">Recommendation</span>
        </Link>

        {/* Search Bar & Auto-complete Live Suggestions */}
        <div className="search-wrapper" ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit} className="search-section">
            <input
              type="text"
              className="search-input"
              placeholder="Tìm sản phẩm, thương hiệu và tags..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => {
                if (searchInput.trim().length >= 1) setShowSuggestions(true);
              }}
            />
            <button type="submit" className="search-btn">
              {loadingSuggestions ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            </button>
          </form>

          {/* Live Search Suggestions Dropdown Popup */}
          {showSuggestions && (keywordSuggestions.length > 0 || matchedProducts.length > 0) && (
            <div className="search-suggestions-dropdown">
              {/* Keyword suggestions */}
              {keywordSuggestions.length > 0 && (
                <div className="suggestion-group">
                  <div className="suggestion-title">
                    <Sparkles size={13} className="icon-sparkle" /> Từ khóa gợi ý
                  </div>
                  <div className="suggestion-tags">
                    {keywordSuggestions.map((kw, idx) => (
                      <button
                        key={idx}
                        className="suggestion-tag-btn"
                        onClick={() => handleSelectSuggestionKeyword(kw)}
                      >
                        <Tag size={12} /> {kw}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched product list */}
              {matchedProducts.length > 0 && (
                <div className="suggestion-group">
                  <div className="suggestion-title">
                    🛍️ Gợi ý sản phẩm phù hợp
                  </div>
                  <div className="suggestion-products-list">
                    {matchedProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="suggestion-product-item"
                        onClick={() => handleSelectProduct(prod.id)}
                      >
                        <img src={prod.image_url} alt={prod.name} className="suggestion-prod-img" />
                        <div className="suggestion-prod-info">
                          <span className="suggestion-prod-name">{prod.name}</span>
                          <div className="suggestion-prod-meta">
                            {prod.category_name && <span className="suggestion-cat-badge">{prod.category_name}</span>}
                            <span className="suggestion-prod-price">{formatPrice(prod.price)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="actions-section">
          {/* Nút Trang Admin: Chỉ Admin mới thấy */}
          {user && user.role === 'admin' && (
            <Link to="/admin" className="admin-channel-link">
              <Shield size={18} />
              <span>Trang Admin</span>
            </Link>
          )}

          {/* Nút Kênh Người Bán: Chỉ Seller mới thấy */}
          {user && user.role === 'seller' && (
            <Link to="/seller" className="seller-channel-link">
              <LayoutDashboard size={18} />
              <span>Kênh Người Bán</span>
            </Link>
          )}

          {/* Giỏ hàng */}
          <Link to="/cart" className="cart-icon-container">
            <ShoppingCart size={24} />
            {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
          </Link>

          {/* User Account */}
          <div className="user-profile-section">
            {user ? (
              <div
                className="user-profile-info"
                onClick={() => setShowDropdown(!showDropdown)}
                onMouseLeave={() => setShowDropdown(false)}
              >
                <div className="avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="username">{user.username}</span>

                {showDropdown && (
                  <div className="user-dropdown">
                    <Link to="/orders" className="dropdown-item">
                      <ClipboardList size={16} />
                      Đơn mua
                    </Link>

                    {/* Kênh người bán: Chỉ hiển thị cho Seller */}
                    {user.role === 'seller' && (
                      <Link to="/seller" className="dropdown-item">
                        <LayoutDashboard size={16} />
                        Kênh người bán
                      </Link>
                    )}

                    {/* Trang Admin: Chỉ hiển thị cho Admin */}
                    {user.role === 'admin' && (
                      <Link to="/admin" className="dropdown-item admin-item">
                        <Shield size={16} color="#4f46e5" />
                        Trang Admin
                      </Link>
                    )}

                    <button onClick={handleLogout} className="dropdown-item logout-btn">
                      <LogOut size={16} />
                      Đăng xuất
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
