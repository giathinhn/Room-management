import React, { useState } from 'react';
import toast from 'react-hot-toast';
import templateService from '../../services/template.service';

/**
 * SaveAsTemplate — a "💾 Lưu làm mẫu" button shown on BookingDetailPage.
 *
 * Props:
 *   booking  — the booking object (must have id, title, startTime, endTime, roomId)
 */
function SaveAsTemplate({ booking }) {
  const [showModal, setShowModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOpen = () => {
    // Pre-fill name suggestion from booking title
    setTemplateName(booking.title ? `${booking.title}` : '');
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setTemplateName('');
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error('Vui lòng nhập tên mẫu');
      return;
    }
    setIsLoading(true);
    try {
      await templateService.createFromBooking(booking.id, templateName.trim());
      toast.success('Đã lưu làm mẫu đặt phòng!');
      handleClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Lưu mẫu thất bại';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  return (
    <>
      <button
        id="save-as-template-btn"
        className="save-tpl-btn"
        onClick={handleOpen}
        title="Lưu booking này làm mẫu đặt phòng"
      >
        💾 Lưu làm mẫu
      </button>

      {showModal && (
        <div
          className="save-tpl-backdrop"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
        >
          <div className="save-tpl-modal">
            <h3 className="save-tpl-modal__title">💾 Lưu làm mẫu đặt phòng</h3>
            <p className="save-tpl-modal__desc">
              Nhập tên để nhận diện mẫu này trong tương lai.
            </p>

            <div className="save-tpl-modal__field">
              <label htmlFor="save-tpl-name" className="save-tpl-modal__label">
                Tên mẫu
              </label>
              <input
                id="save-tpl-name"
                type="text"
                className="save-tpl-modal__input"
                placeholder="vd: Họp sprint hàng tuần"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                maxLength={100}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>

            <div className="save-tpl-modal__footer">
              <button
                id="save-tpl-cancel"
                className="save-tpl-modal__btn save-tpl-modal__btn--cancel"
                onClick={handleClose}
                disabled={isLoading}
              >
                Hủy
              </button>
              <button
                id="save-tpl-confirm"
                className="save-tpl-modal__btn save-tpl-modal__btn--save"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? 'Đang lưu...' : '💾 Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .save-tpl-btn {
          padding: 8px 16px;
          background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3);
          border-radius: var(--radius-md);
          color: #a5b4fc;
          font-size: var(--font-size-sm);
          font-weight: 600;
          font-family: var(--font-family);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .save-tpl-btn:hover {
          background: rgba(99,102,241,0.25);
          color: #fff;
          box-shadow: 0 4px 12px rgba(99,102,241,0.25);
        }
        .save-tpl-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        .save-tpl-modal {
          background: var(--color-surface);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: var(--radius-xl);
          padding: 28px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.6);
          animation: modalSlideIn 0.25s cubic-bezier(0.34,1.2,0.64,1);
        }
        .save-tpl-modal__title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 8px;
        }
        .save-tpl-modal__desc {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin: 0 0 20px;
        }
        .save-tpl-modal__field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 20px;
        }
        .save-tpl-modal__label {
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .save-tpl-modal__input {
          padding: 10px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: var(--radius-md);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
          font-family: var(--font-family);
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .save-tpl-modal__input:focus {
          outline: none;
          border-color: var(--color-primary-light);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }
        .save-tpl-modal__footer {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        .save-tpl-modal__btn {
          padding: 9px 18px;
          border: none;
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          font-weight: 600;
          font-family: var(--font-family);
          cursor: pointer;
          transition: all 0.15s;
        }
        .save-tpl-modal__btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .save-tpl-modal__btn--cancel {
          background: rgba(255,255,255,0.06);
          color: var(--color-text-secondary);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .save-tpl-modal__btn--cancel:hover:not(:disabled) {
          background: rgba(255,255,255,0.1);
          color: var(--color-text-primary);
        }
        .save-tpl-modal__btn--save {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          box-shadow: 0 4px 12px rgba(99,102,241,0.3);
        }
        .save-tpl-modal__btn--save:hover:not(:disabled) {
          box-shadow: 0 6px 18px rgba(99,102,241,0.5);
          transform: translateY(-1px);
        }
      `}</style>
    </>
  );
}

export default SaveAsTemplate;
