import Modal from './Modal';

/**
 * ConfirmDialog — modal that asks user to confirm a destructive action.
 *
 * Props:
 *   isOpen     {boolean}   Whether the dialog is visible
 *   onConfirm  {Function}  Called when user clicks "Confirm"
 *   onCancel   {Function}  Called when user cancels
 *   title      {string}    Dialog title
 *   message    {string}    Warning message body
 *   confirmLabel {string}  Text for confirm button (default: "Xác nhận")
 *   isLoading  {boolean}   Disable buttons while action is in flight
 */
function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Xác nhận',
  message,
  confirmLabel = 'Xác nhận',
  isLoading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <div className="confirm-dialog">
        <p className="confirm-dialog__message">{message}</p>
        <div className="confirm-dialog__actions">
          <button
            id="confirm-dialog-cancel-btn"
            className="btn btn--secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            id="confirm-dialog-confirm-btn"
            className="btn btn--danger"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Đang xử lý…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
