import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../../components/Header';
import { useAppSelector } from '../../hooks/useReduxHooks';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function MainLayout() {
  const toasts = useAppSelector((state) => state.ui.toasts);

  return (
    <div className="app-layout">
      <Header />
      
      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
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
  );
}

// Inject layouts css styles
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
