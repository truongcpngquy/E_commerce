import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useReduxHooks';
import { setSearchQuery } from '../store/slices/productSlice';
import { logoutUser } from '../store/slices/authSlice';
import { trackUserInteraction } from '../store/slices/recommendationSlice';
import { ShoppingCart, Search, User, LogOut, LayoutDashboard, ClipboardList, Sparkles, Tag } from 'lucide-react';
import useDebounce from '../hooks/useDebounce';
import productApi from '../api/productApi';
import './Header.css';

export default function Header() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const user = useAppSelector((state) => state.auth.user);
  const cartItems = useAppSelector((state) => state.cart.cartItems);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [keywordSuggestions, setKeywordSuggestions] = useState([]);
  const [matchedProducts, setMatchedProducts] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const debouncedSearch = useDebounce(searchInput, 300);
  const suggestionRef = useRef(null);

  // Đồng bộ search input khi URL query thay đổi
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearchInput(urlSearch);
    dispatch(setSearchQuery(urlSearch));
  }, [searchParams, dispatch]);

  // Gọi API Smart Auto-complete Suggest (/products/search/suggest?q=...) khi gõ
  useEffect(() => {
    if (debouncedSearch.trim().length >= 1) {
      productApi.searchSuggest(debouncedSearch.trim())
        .then((res) => {
          setKeywordSuggestions(res.suggestions || []);
          setMatchedProducts(res.products || []);
        })
        .catch(() => {
          setKeywordSuggestions([]);
          setMatchedProducts([]);
        });
    } else {
      setKeywordSuggestions([]);
      setMatchedProducts([]);
    }
  }, [debouncedSearch]);

  // Click ra ngoài để ẩn khung gợi ý
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
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
    // Ghi vết tương tác search_click (weight = 2) cho AI Engine
    dispatch(trackUserInteraction({ productId, type: 'search_click' }));
    navigate(`/product/${productId}`);
  };

  const handleLogoClick = () => {
    setSearchInput('');
    dispatch(setSearchQuery(''));
    navigate('/');
  };

  const handleLogout = () => {
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
              {/* Phần 1: Đề xuất từ khóa phổ biến */}
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

              {/* Phần 2: Đề xuất sản phẩm khớp trực tiếp */}
              {matchedProducts.length > 0 && (
                <div className="suggestion-products-group">
                  <div className="suggestion-group-title">Sản phẩm gợi ý khớp từ khóa:</div>
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
          <Link to="/cart" className="cart-icon-container">
            <ShoppingCart size={24} />
            {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
          </Link>

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
                    {user.role === 'seller' && (
                      <Link to="/seller" className="dropdown-item">
                        <LayoutDashboard size={16} />
                        Kênh người bán
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
