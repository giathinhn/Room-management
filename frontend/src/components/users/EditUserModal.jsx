import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import userService from '../../services/user.service';
import './EditUserModal.css';

/**
 * EditUserModal — allows admin to change a user's fullName and isActive status.
 * @param {{ isOpen: boolean, onClose: Function, onSaved: Function, user: object|null }} props
 */
function EditUserModal({ isOpen, onClose, onSaved, user }) {
  const [fullName, setFullName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // Sync state when user changes
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setIsActive(user.isActive ?? true);
      setError('');
    }
  }, [user]);

  function validate() {
    if (!fullName.trim()) {
      setError('Họ tên không được để trống');
      return false;
    }
    if (fullName.trim().length < 2) {
      setError('Họ tên phải có ít nhất 2 ký tự');
      return false;
    }
    setError('');
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const updated = await userService.updateUser(user.id, {
        fullName: fullName.trim(),
        isActive,
      });
      toast.success('Cập nhật thông tin thành công!');
      onSaved(updated.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="✏️ Chỉnh sửa người dùng">
      <form className="edit-user-form" onSubmit={handleSubmit}>
        {/* Email — read only */}
        <div className="edit-user-form__field">
          <label className="edit-user-form__label">Email</label>
          <div className="edit-user-form__readonly">{user.email}</div>
        </div>

        {/* Full name */}
        <Input
          label="Họ tên"
          id="edit-user-fullname"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={error}
          placeholder="Nhập họ tên..."
        />

        {/* Active toggle */}
        <div className="edit-user-form__field">
          <label className="edit-user-form__label">Trạng thái tài khoản</label>
          <div className="edit-user-form__toggle-row">
            <button
              type="button"
              id="edit-user-toggle-active"
              className={`toggle-switch ${isActive ? 'toggle-switch--on' : 'toggle-switch--off'}`}
              onClick={() => setIsActive((v) => !v)}
              aria-pressed={isActive}
              aria-label="Kích hoạt tài khoản"
            >
              <span className="toggle-switch__thumb" />
            </button>
            <span className={`toggle-switch__label ${isActive ? 'toggle-switch__label--active' : 'toggle-switch__label--inactive'}`}>
              {isActive ? '✅ Đang hoạt động' : '🚫 Đã vô hiệu hóa'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="edit-user-form__actions">
          <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default EditUserModal;
