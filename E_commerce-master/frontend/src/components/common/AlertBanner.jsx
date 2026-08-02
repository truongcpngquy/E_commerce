import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';
import './AlertBanner.css';

export default function AlertBanner({
  type = 'error', // 'error' | 'warning' | 'success' | 'info'
  title,
  message,
  onClose,
  className = '',
  action,
}) {
  if (!message && !title) return null;

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="alert-icon success-icon" size={20} />;
      case 'warning':
        return <AlertTriangle className="alert-icon warning-icon" size={20} />;
      case 'info':
        return <Info className="alert-icon info-icon" size={20} />;
      case 'error':
      default:
        return <XCircle className="alert-icon error-icon" size={20} />;
    }
  };

  return (
    <div className={`alert-banner alert-${type} ${className} fade-in`}>
      <div className="alert-content-left">
        {renderIcon()}
        <div className="alert-text-body">
          {title && <h4 className="alert-title">{title}</h4>}
          {message && <div className="alert-message">{message}</div>}
        </div>
      </div>

      <div className="alert-content-right">
        {action && <div className="alert-action-slot">{action}</div>}
        {onClose && (
          <button type="button" className="alert-close-btn" onClick={onClose} aria-label="Đóng thông báo">
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
