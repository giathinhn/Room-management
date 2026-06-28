import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import Button from '../common/Button';
import userService from '../../services/user.service';
import './ChangeRoleModal.css';

const ROLES = [
  {
    value: 'admin',
    label: 'Admin',
    emoji: '🔴',
    desc: 'Toàn quyền quản trị hệ thống, quản lý user và phòng họp',
    gradient: 'linear-gradient(135deg, #6366f1, #ec4899)',
  },
  {
    value: 'approver',
    label: 'Người duyệt',
    emoji: '🔵',
    desc: 'Duyệt / từ chối lịch đặt phòng, xem báo cáo',
    gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
  },
  {
    value: 'user',
    label: 'Nhân viên',
    emoji: '⚫',
    desc: 'Đặt phòng cơ bản, hủy lịch của bản thân',
    gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
  },
];

/**
 * ChangeRoleModal — allows admin to change a user's role via card selector.
 * @param {{ isOpen: boolean, onClose: Function, onSaved: Function, user: object|null }} props
 */
function ChangeRoleModal({ isOpen, onClose, onSaved, user }) {
  const [selectedRole, setSelectedRole] = useState('user');
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    if (user) setSelectedRole(user.role || 'user');
  }, [user]);

  const isDowngrade = user?.role === 'admin' && selectedRole !== 'admin';
  const unchanged   = selectedRole === user?.role;

  async function handleConfirm() {
    if (unchanged) { onClose(); return; }

    setLoading(true);
    try {
      const updated = await userService.updateUserRole(user.id, selectedRole);
      toast.success(`Đã đổi vai trò thành công!`);
      onSaved(updated.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể đổi vai trò');
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔄 Thay đổi vai trò">
      <div className="change-role-modal">
        {/* User info */}
        <div className="change-role-modal__user-info">
          <div
            className="change-role-modal__avatar"
            style={{ background: ROLES.find((r) => r.value === user.role)?.gradient }}
          >
            {user.fullName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="change-role-modal__user-name">{user.fullName}</p>
            <p className="change-role-modal__user-email">{user.email}</p>
          </div>
        </div>

        {/* Role cards */}
        <div className="change-role-modal__roles">
          {ROLES.map((role) => (
            <button
              key={role.value}
              type="button"
              id={`role-card-${role.value}`}
              className={`role-card ${selectedRole === role.value ? 'role-card--selected' : ''}`}
              onClick={() => setSelectedRole(role.value)}
            >
              <div className="role-card__indicator" style={{ background: role.gradient }} />
              <div className="role-card__content">
                <p className="role-card__label">
                  <span>{role.emoji}</span> {role.label}
                </p>
                <p className="role-card__desc">{role.desc}</p>
              </div>
              {selectedRole === role.value && (
                <span className="role-card__check">✓</span>
              )}
            </button>
          ))}
        </div>

        {/* Downgrade warning */}
        {isDowngrade && (
          <div className="change-role-modal__warning">
            ⚠️ Bạn đang hạ quyền của một Admin. Hành động này sẽ thu hồi toàn bộ quyền quản trị.
          </div>
        )}

        {/* Actions */}
        <div className="change-role-modal__actions">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            variant={isDowngrade ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={loading}
            disabled={unchanged}
          >
            {unchanged ? 'Không thay đổi' : 'Xác nhận'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ChangeRoleModal;
