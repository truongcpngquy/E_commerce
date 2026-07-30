import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ShoppingCart, Search, User, LogOut, LayoutDashboard, ClipboardList } from 'lucide-react';
import './Header.css';

export default function Header() {
  const { user, logout, cartCount, searchQuery, setSearchQuery } = useApp();
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    navigate('/');
  };

  const handleLogoClick = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  return (
    <header className="shopee-header">
      <div className="header-container">
        {/* Logo */}
        <Link to="/" onClick={handleLogoClick} className="logo-section">
          <span className="logo-text">Shopee</span>
          <span className="logo-subtext">Recommendation</span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="search-section">
          <input
            type="text"
            className="search-input"
            placeholder="Tìm sản phẩm, thương hiệu và tags..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="search-btn">
            <Search size={18} />
          </button>
        </form>

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
                    <button onClick={logout} className="dropdown-item logout-btn">
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
