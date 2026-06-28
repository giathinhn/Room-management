import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock } from 'react-icons/fi';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { register } from '../../services/auth.service';
import userService from '../../services/user.service';
import './CreateUserModal.css';

const ROLES = [
  { value: 'user',     label: 'Nhân viên',    emoji: '⚫' },
  { value: 'approver', label: 'Người duyệt',  emoji: '🔵' },
  { value: 'admin',    label: 'Admin',         emoji: '🔴' },
];

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
  const [form, setForm]     = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!form.fullName.trim()) {
      newErrors.fullName = 'Họ tên không được để trống';
    } else if (form.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
    }

    if (!form.password) {
      newErrors.password = 'Mật khẩu không được để trống';
    } else if (!PASSWORD_REGEX.test(form.password)) {
      newErrors.password = 'Mật khẩu cần ≥ 8 ký tự, chứa chữ hoa, số và ký tự đặc biệt';
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
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

      toast.success(`Tạo tài khoản "${form.fullName.trim()}" thành công!`);
      onCreated(finalUser);
      setForm(INITIAL_FORM);
      setErrors({});
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg?.toLowerCase().includes('email')) {
        setErrors((prev) => ({ ...prev, email: 'Email này đã được sử dụng' }));
      } else {
        toast.error(msg || 'Không thể tạo tài khoản. Vui lòng thử lại.');
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
    <Modal isOpen={isOpen} onClose={handleClose} title="➕ Tạo tài khoản mới">
      <form className="create-user-form" onSubmit={handleSubmit} noValidate>
        <Input
          id="create-user-email"
          name="email"
          type="email"
          label="Email *"
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
          label="Họ tên *"
          placeholder="Nguyễn Văn A"
          value={form.fullName}
          onChange={handleChange}
          error={errors.fullName}
          leftIcon={<FiUser />}
        />

        <Input
          id="create-user-password"
          name="password"
          type="password"
          label="Mật khẩu *"
          placeholder="Tối thiểu 8 ký tự..."
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          hint="Cần ít nhất 1 chữ hoa, 1 số, 1 ký tự đặc biệt"
          leftIcon={<FiLock />}
        />

        <Input
          id="create-user-confirm-password"
          name="confirmPassword"
          type="password"
          label="Xác nhận mật khẩu *"
          placeholder="Nhập lại mật khẩu..."
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          leftIcon={<FiLock />}
        />

        {/* Role selector */}
        <div className="create-user-form__field">
          <label className="create-user-form__label">Vai trò</label>
          <div className="create-user-form__role-group" role="group" aria-label="Chọn vai trò">
            {ROLES.map((role) => (
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
            Hủy
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Tạo tài khoản
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateUserModal;
