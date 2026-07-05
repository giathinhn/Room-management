import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import Button from '../common/Button';
import userService from '../../services/user.service';
import './ChangeRoleModal.css';

/**
 * ChangeRoleModal — allows admin to change a user's role via card selector.
 * @param {{ isOpen: boolean, onClose: Function, onSaved: Function, user: object|null }} props
 */
function ChangeRoleModal({ isOpen, onClose, onSaved, user }) {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState('user');
  const [loading, setLoading]           = useState(false);

  const rolesConfig = [
    {
      value: 'admin',
      label: t('roles.admin'),
      emoji: '🔴',
      desc: t('users.adminDesc'),
      gradient: 'linear-gradient(135deg, #6366f1, #ec4899)',
    },
    {
      value: 'approver',
      label: t('roles.approver'),
      emoji: '🔵',
      desc: t('users.approverDesc'),
      gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    },
    {
      value: 'user',
      label: t('roles.user'),
      emoji: '⚫',
      desc: t('users.userDesc'),
      gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
    },
  ];

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
      toast.success(t('users.changeRoleSuccess'));
      onSaved(updated.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || t('users.changeRoleFailed'));
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('users.changeRoleTitle')}>
      <div className="change-role-modal">
        {/* User info */}
        <div className="change-role-modal__user-info">
          <div
            className="change-role-modal__avatar"
            style={{ background: rolesConfig.find((r) => r.value === user.role)?.gradient }}
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
          {rolesConfig.map((role) => (
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
            {t('users.downgradeWarning')}
          </div>
        )}

        {/* Actions */}
        <div className="change-role-modal__actions">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button
            variant={isDowngrade ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={loading}
            disabled={unchanged}
          >
            {unchanged ? t('users.noChange') : t('common.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ChangeRoleModal;
