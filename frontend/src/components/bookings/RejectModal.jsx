import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError(t('bookings.rejectModal.validation.reasonRequired'));
      return;
    }
    if (reason.trim().length > 500) {
      setError(t('bookings.rejectModal.validation.reasonMaxLength'));
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
            {t('bookings.rejectModal.title')}
          </h2>
          <button
            id="reject-modal-close"
            className="reject-modal__close"
            onClick={handleClose}
            aria-label={t('floorMap.close')}
          >
            ×
          </button>
        </div>

        <div className="reject-modal__body">
          <p className="reject-modal__desc">
            {t('bookings.rejectModal.desc')}
          </p>
          <label className="reject-modal__label" htmlFor="rejection-reason">
            {t('bookings.rejectionReason')} <span className="required">*</span>
          </label>
          <textarea
            id="rejection-reason"
            className={`reject-modal__textarea ${error ? 'has-error' : ''}`}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder={t('bookings.rejectModal.placeholder')}
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
            {t('bookings.rejectModal.cancelBtn')}
          </button>
          <button
            id="reject-modal-confirm-btn"
            className="reject-modal__btn reject-modal__btn--confirm"
            onClick={handleConfirm}
            disabled={isLoading || !reason.trim()}
          >
            {isLoading ? t('bookings.rejectModal.processing') : t('bookings.rejectModal.confirmBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RejectModal;
