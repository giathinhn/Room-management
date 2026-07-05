import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { FiUser, FiMail, FiLock } from 'react-icons/fi';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { register } from '../../services/auth.service';
import userService from '../../services/user.service';
import './CreateUserModal.css';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const INITIAL_FORM = {
  email: '',
  fullName: '',
  password: '',
  confirmPassword: '',
  role: 'user',
};

/**
 * CreateUserModal — allows admin to create a new user account with a chosen role.
 * Strategy: POST /api/auth/register → if role ≠ 'user', PATCH /api/users/:id/role
 */
function CreateUserModal({ isOpen, onClose, onCreated }) {
  const { t } = useTranslation();
  const [form, setForm]     = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const rolesConfig = [
    { value: 'user',     label: t('roles.user'),    emoji: '⚫' },
    { value: 'approver', label: t('roles.approver'),  emoji: '🔵' },
    { value: 'admin',    label: t('roles.admin'),         emoji: '🔴' },
  ];

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = t('validation.emailInvalid');
    }

    if (!form.fullName.trim()) {
      newErrors.fullName = t('validation.fullNameRequired');
    } else if (form.fullName.trim().length < 2) {
      newErrors.fullName = t('validation.fullNameMinLength');
    }

    if (!form.password) {
      newErrors.password = t('validation.passwordRequired');
    } else if (!PASSWORD_REGEX.test(form.password)) {
      newErrors.password = t('validation.passwordComplexity');
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = t('validation.confirmPasswordRequired');
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = t('validation.passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // Step 1: Register the user
      const registerResult = await register(
        form.email.trim(),
        form.password,
        form.fullName.trim()
      );

      let finalUser = registerResult.data?.user || registerResult.user;

      // Step 2: Update role if not default 'user'
      if (form.role !== 'user' && finalUser?.id) {
        const roleResult = await userService.updateUserRole(finalUser.id, form.role);
        finalUser = roleResult.data || finalUser;
      }

      toast.success(t('users.createUserSuccess', { name: form.fullName.trim() }));
      onCreated(finalUser);
      setForm(INITIAL_FORM);
      setErrors({});
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg?.toLowerCase().includes('email')) {
        setErrors((prev) => ({ ...prev, email: t('users.emailUsed') }));
      } else {
        toast.error(msg || t('users.createUserFailed'));
      }
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      setForm(INITIAL_FORM);
      setErrors({});
      onClose();
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('users.createUserTitle')}>
      <form className="create-user-form" onSubmit={handleSubmit} noValidate>
        <Input
          id="create-user-email"
          name="email"
          type="email"
          label={t('auth.email') + ' *'}
          placeholder="example@company.com"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          leftIcon={<FiMail />}
        />

        <Input
          id="create-user-fullname"
          name="fullName"
          type="text"
          label={t('users.fullName') + ' *'}
          placeholder={t('users.fullNamePlaceholder')}
          value={form.fullName}
          onChange={handleChange}
          error={errors.fullName}
          leftIcon={<FiUser />}
        />

        <Input
          id="create-user-password"
          name="password"
          type="password"
          label={t('auth.password') + ' *'}
          placeholder={t('users.passwordPlaceholder')}
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          hint={t('users.passwordHint')}
          leftIcon={<FiLock />}
        />

        <Input
          id="create-user-confirm-password"
          name="confirmPassword"
          type="password"
          label={t('auth.confirmPassword') + ' *'}
          placeholder={t('auth.confirmPassword') + '...'}
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          leftIcon={<FiLock />}
        />

        {/* Role selector */}
        <div className="create-user-form__field">
          <label className="create-user-form__label">{t('users.roleLabel')}</label>
          <div className="create-user-form__role-group" role="group" aria-label={t('users.selectRoleLabel')}>
            {rolesConfig.map((role) => (
              <button
                key={role.value}
                type="button"
                id={`create-user-role-${role.value}`}
                className={`role-chip ${form.role === role.value ? 'role-chip--active' : ''}`}
                onClick={() => setForm((prev) => ({ ...prev, role: role.value }))}
              >
                <span>{role.emoji}</span>
                <span>{role.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="create-user-form__actions">
          <Button variant="ghost" type="button" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            {t('users.addUser')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateUserModal;
