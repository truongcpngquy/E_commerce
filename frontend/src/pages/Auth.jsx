import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './Auth.css';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('customer');
  const [isLoading, setIsLoading] = useState(false);

  const { login, signup } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password || (!isLogin && !email)) {
      alert('Vui lòng điền đầy đủ các thông tin!');
      return;
    }

    setIsLoading(true);
    if (isLogin) {
      const res = await login(username, password);
      if (res.success) {
        navigate('/');
      }
    } else {
      const res = await signup(username, password, email, role);
      if (res.success) {
        setIsLogin(true); // Chuyển sang form đăng nhập sau khi đăng ký thành công
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-page fade-in">
      <div className="auth-card">
        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Đăng nhập
          </button>
          <button
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Đăng ký
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2 className="auth-title">
            {isLogin ? 'Chào mừng quay trở lại!' : 'Tạo tài khoản mới'}
          </h2>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Đăng nhập để trải nghiệm hệ thống gợi ý cá nhân hóa Shopee.' 
              : 'Tham gia mua sắm và bán hàng trên nền tảng của chúng tôi.'}
          </p>

          <div className="input-group">
            <label htmlFor="username">Tên đăng nhập</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập..."
              required
            />
          </div>

          {!isLogin && (
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@shopee.vn"
                required
              />
            </div>
          )}

          <div className="input-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
            />
          </div>

          {!isLogin && (
            <div className="input-group">
              <label>Bạn tham gia với tư cách</label>
              <div className="role-selector">
                <label className={`role-option ${role === 'customer' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="customer"
                    checked={role === 'customer'}
                    onChange={() => setRole('customer')}
                  />
                  Khách mua hàng
                </label>
                <label className={`role-option ${role === 'seller' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="seller"
                    checked={role === 'seller'}
                    onChange={() => setRole('seller')}
                  />
                  Người bán hàng
                </label>
              </div>
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Đăng ký'}
          </button>

          {isLogin && (
            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#666', display: 'block', marginBottom: '10px' }}>
                🔑 Nhấp để điền nhanh tài khoản mẫu thử nghiệm:
              </span>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => { setUsername('customer1'); setPassword('123456'); }}
                  style={{ padding: '6px 12px', fontSize: '11px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}
                >
                  🛒 Khách hàng (customer1)
                </button>
                <button
                  type="button"
                  onClick={() => { setUsername('seller1'); setPassword('123456'); }}
                  style={{ padding: '6px 12px', fontSize: '11px', background: '#fff0ee', border: '1px solid #ffbbad', color: '#ee4d2d', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}
                >
                  🏪 Người bán (seller1)
                </button>
                <button
                  type="button"
                  onClick={() => { setUsername('admin'); setPassword('123456'); }}
                  style={{ padding: '6px 12px', fontSize: '11px', background: '#eef2ff', border: '1px solid #c7d2fe', color: '#4f46e5', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}
                >
                  🛡️ Admin (admin)
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
