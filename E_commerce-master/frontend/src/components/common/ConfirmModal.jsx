import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import './ConfirmModal.css';

export default function ConfirmModal({
  isOpen,
  title = 'Xác nhận thao tác',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này không?',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  confirmVariant = 'danger', // 'danger' | 'primary'
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay fade-in">
      <div className="confirm-modal-card">
        <div className="confirm-modal-header">
          <div className={`confirm-icon-wrapper ${confirmVariant}`}>
            {confirmVariant === 'danger' ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
          </div>
          <h3 className="confirm-modal-title">{title}</h3>
        </div>

        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>

        <div className="confirm-modal-footer">
          <button
            type="button"
            className="confirm-btn cancel-btn"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`confirm-btn submit-btn ${confirmVariant}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
