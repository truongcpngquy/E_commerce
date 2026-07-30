import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import { loginUser, signupUser } from '../../store/slices/authSlice';
import './Auth.css';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('customer');
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password || (!isLogin && !email)) {
      alert('Vui lòng điền đầy đủ các thông tin!');
      return;
    }

    setIsLoading(true);
    if (isLogin) {
      const action = await dispatch(loginUser({ username, password }));
      if (loginUser.fulfilled.match(action)) {
        navigate('/');
      }
    } else {
      const action = await dispatch(signupUser({ username, password, email, role }));
      if (signupUser.fulfilled.match(action)) {
        setIsLogin(true);
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
        </form>
      </div>
    </div>
  );
}
