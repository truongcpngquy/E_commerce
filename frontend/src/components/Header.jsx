import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useReduxHooks';
import { setSearchQuery } from '../store/slices/productSlice';
import { logoutUser } from '../store/slices/authSlice';
import { ShoppingCart, Search, User, LogOut, LayoutDashboard, ClipboardList } from 'lucide-react';
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
  const [suggestions, setSuggestions] = useState([]);
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

  // Gọi API lấy live suggestions khi người dùng nhập từ khóa
  useEffect(() => {
    if (debouncedSearch.trim().length >= 2) {
      productApi.getProducts({ search: debouncedSearch.trim(), limit: 5 })
        .then((res) => {
          setSuggestions(res || []);
        })
        .catch(() => {
          setSuggestions([]);
        });
    } else {
      setSuggestions([]);
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
    e.preventDefault();
    dispatch(setSearchQuery(searchInput));
    setShowSuggestions(false);
    navigate(`/?search=${encodeURIComponent(searchInput)}`);
  };

  const handleSuggestionClick = (productId) => {
    setShowSuggestions(false);
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

  return (
    <header className="shopee-header">
      <div className="header-container">
        {/* Logo */}
        <Link to="/" onClick={handleLogoClick} className="logo-section">
          <span className="logo-text">Shopee</span>
          <span className="logo-subtext">Recommendation</span>
        </Link>

        {/* Search Bar & Suggestions wrapper */}
        <div className="search-wrapper" ref={suggestionRef}>
          <form onSubmit={handleSearchSubmit} className="search-section">
            <input
              type="text"
              className="search-input"
              placeholder="Tìm sản phẩm, thương hiệu và tags..."
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
          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions-dropdown">
              {suggestions.map((item) => (
                <div
                  key={item.id}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(item.id)}
                >
                  <img src={item.image_url} alt={item.name} className="suggestion-img" />
                  <div className="suggestion-info">
                    <span className="suggestion-name">{item.name}</span>
                    <span className="suggestion-price">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="actions-section">
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
