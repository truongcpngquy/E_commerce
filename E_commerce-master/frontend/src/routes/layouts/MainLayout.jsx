import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../../components/Header';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { removeToast } from '../../store/slices/uiSlice';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export default function MainLayout() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.ui.toasts);

  const getToastIcon = (type) => {
    switch (type) {
      case 'error':
        return <XCircle size={20} className="toast-icon text-red-500" />;
      case 'warning':
        return <AlertTriangle size={20} className="toast-icon text-amber-500" />;
      case 'info':
        return <Info size={20} className="toast-icon text-blue-500" />;
      case 'success':
      default:
        return <CheckCircle2 size={20} className="toast-icon text-emerald-500" />;
    }
  };

  return (
    <div className="app-layout">
      <Header />
      
      {/* Main Content Area wrapped in ErrorBoundary */}
      <main className="main-content">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>© 2026 Shopee Recommendation App. Built with ReactJS & Node.js.</p>
          <p>Giải thuật Content-Based Filtering tối ưu trải nghiệm khách hàng.</p>
        </div>
      </footer>

      {/* Enhanced Toast Notification Portal */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type || 'success'} fade-in`}>
            {getToastIcon(t.type)}
            <span className="toast-message">{t.message}</span>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => dispatch(removeToast(t.id))}
              aria-label="Đóng"
            >
              <X size={14} />
            </button>
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
