import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Auth from './pages/Auth';
import SellerDashboard from './pages/SellerDashboard';
import { useApp } from './context/AppContext';
import { CheckCircle, AlertTriangle } from 'lucide-react';

function App() {
  const { toasts } = useApp();

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Header />
        
        {/* Main Content Area */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/seller" element={<SellerDashboard />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <div className="footer-content">
            <p>© 2026 Shopee Recommendation App. Built with ReactJS & Node.js.</p>
            <p>Giải thuật Content-Based Filtering tối ưu trải nghiệm khách hàng.</p>
          </div>
        </footer>

        {/* Toast Notification Portal */}
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.type}`}>
              {t.type === 'error' ? (
                <AlertTriangle size={18} color="#ff3333" />
              ) : (
                <CheckCircle size={18} color="#00bfa5" />
              )}
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      </div>
    </BrowserRouter>
  );
}

// Thêm một số style nhỏ cho layout chính
const style = document.createElement('style');
style.textContent = `
  .app-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  .main-content {
    flex: 1;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 20px;
  }
  .app-footer {
    background: #eaeaea;
    color: var(--text-gray);
    padding: 30px 20px;
    text-align: center;
    border-top: 1px solid var(--border-color);
    font-size: 13px;
    margin-top: 40px;
  }
  .footer-content p {
    margin: 5px 0;
  }
`;
document.head.appendChild(style);

export default App;
