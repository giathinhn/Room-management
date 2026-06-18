import React, { useState } from 'react';
import './RejectModal.css';

/**
 * RejectModal — modal dialog to enter rejection reason.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onConfirm: (reason: string) => void,
 *   isLoading?: boolean,
 * }} props
 */
function RejectModal({ isOpen, onClose, onConfirm, isLoading = false }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do từ chối');
      return;
    }
    if (reason.trim().length > 500) {
      setError('Lý do không được vượt quá 500 ký tự');
      return;
    }
    setError('');
    onConfirm(reason.trim());
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <div className="reject-modal-overlay" onClick={handleClose}>
      <div
        className="reject-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-modal-title"
      >
        <div className="reject-modal__header">
          <h2 id="reject-modal-title" className="reject-modal__title">
            ✗ Từ chối booking
          </h2>
          <button
            id="reject-modal-close"
            className="reject-modal__close"
            onClick={handleClose}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <div className="reject-modal__body">
          <p className="reject-modal__desc">
            Vui lòng nhập lý do từ chối để người đặt phòng được biết.
          </p>
          <label className="reject-modal__label" htmlFor="rejection-reason">
            Lý do từ chối <span className="required">*</span>
          </label>
          <textarea
            id="rejection-reason"
            className={`reject-modal__textarea ${error ? 'has-error' : ''}`}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder="Ví dụ: Phòng đang bảo trì, đã có lịch khác..."
            rows={4}
            maxLength={500}
          />
          <div className="reject-modal__meta">
            {error && <p className="reject-modal__error">{error}</p>}
            <span className="reject-modal__char-count">{reason.length}/500</span>
          </div>
        </div>

        <div className="reject-modal__footer">
          <button
            id="reject-modal-cancel-btn"
            className="reject-modal__btn reject-modal__btn--cancel"
            onClick={handleClose}
            disabled={isLoading}
          >
            Hủy bỏ
          </button>
          <button
            id="reject-modal-confirm-btn"
            className="reject-modal__btn reject-modal__btn--confirm"
            onClick={handleConfirm}
            disabled={isLoading || !reason.trim()}
          >
            {isLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RejectModal;
