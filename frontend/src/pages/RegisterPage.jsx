import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiUserPlus } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import './LoginPage.css';
import './RegisterPage.css';

const RegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  // ── Password strength helper ──────────────────────────────────────────────────
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', checks: getChecks('') };
    const checks = getChecks(password);
    const score = Object.values(checks).filter(Boolean).length;
    const labels = [
      '',
      t('auth.strength.veryWeak'),
      t('auth.strength.weak'),
      t('auth.strength.medium'),
      t('auth.strength.strong'),
      t('auth.strength.veryStrong'),
    ];
    return { score, label: labels[score] || '', checks };
  };

  const getChecks = (pw) => ({
    length: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  });

  const strength = getPasswordStrength(form.password);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = t('validation.fullNameRequired');
    else if (form.fullName.trim().length < 2) errs.fullName = t('validation.fullNameRequired');

    if (!form.email) errs.email = t('validation.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t('validation.emailInvalid');

    if (!form.password) errs.password = t('validation.passwordRequired');
    else if (form.password.length < 6) errs.password = t('validation.passwordTooShort');

    if (!form.confirmPassword) errs.confirmPassword = t('validation.confirmPasswordRequired');
    else if (form.password !== form.confirmPassword) errs.confirmPassword = t('validation.passwordMismatch');

    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await register(form.email, form.password, form.fullName.trim());
      toast.success(t('auth.registerSuccess'));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code || 'INTERNAL_ERROR';
      const msg = t(`errors.${errorCode}`);
      toast.error(msg);
      if (err?.response?.data?.error?.code === 'EMAIL_ALREADY_EXISTS') {
        setErrors({ email: t('errors.EMAIL_ALREADY_EXISTS') });
      }
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = ['', '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#10b981'];
  const strengthColor = strengthColors[strength.score] || '';

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb--1" />
        <div className="auth-orb auth-orb--2" />
        <div className="auth-orb auth-orb--3" />
      </div>

      <div className="auth-card animate-fade-in-up" style={{ maxWidth: 460 }}>
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#grad2)" />
              <path d="M7 10h14M7 14h10M7 18h6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
              <defs>
                <linearGradient id="grad2" x1="0" y1="0" x2="28" y2="28">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="auth-logo-text">RoomBook</span>
        </div>

        <h1 className="auth-title">{t('auth.registerTitle')}</h1>
        <p className="auth-subtitle">{t('auth.registerSubtitle')}</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Input
            id="reg-fullname"
            type="text"
            name="fullName"
            label={t('auth.fullName')}
            placeholder="Nguyễn Văn An"
            value={form.fullName}
            onChange={handleChange}
            error={errors.fullName}
            leftIcon={<FiUser />}
            autoComplete="name"
          />

          <Input
            id="reg-email"
            type="email"
            name="email"
            label={t('auth.email')}
            placeholder="you@company.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            leftIcon={<FiMail />}
            autoComplete="email"
          />

          <div>
            <Input
              id="reg-password"
              type="password"
              name="password"
              label={t('auth.password')}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              leftIcon={<FiLock />}
              autoComplete="new-password"
            />

            {/* Password strength bar */}
            {touched.password && form.password && (
              <div className="pw-strength">
                <div className="pw-strength__bar">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="pw-strength__segment"
                      style={{
                        background: i <= strength.score ? strengthColor : 'rgba(255,255,255,0.08)',
                        transition: 'background 0.3s ease',
                      }}
                    />
                  ))}
                </div>
                <span className="pw-strength__label" style={{ color: strengthColor }}>
                  {strength.label}
                </span>

                {/* Checklist */}
                <ul className="pw-checklist">
                  {[
                    { key: 'length', label: t('auth.strength.lenCheck') },
                    { key: 'uppercase', label: t('auth.strength.upperCheck') },
                    { key: 'lowercase', label: t('auth.strength.lowerCheck') },
                    { key: 'number', label: t('auth.strength.numberCheck') },
                    { key: 'special', label: t('auth.strength.specialCheck') },
                  ].map(({ key, label }) => (
                    <li
                      key={key}
                      className={`pw-checklist__item ${strength.checks[key] ? 'pw-checklist__item--ok' : ''}`}
                    >
                      {strength.checks[key] ? '✓' : '○'} {label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Input
            id="reg-confirm"
            type="password"
            name="confirmPassword"
            label={t('auth.confirmPassword')}
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            leftIcon={<FiLock />}
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="auth-submit-btn"
            leftIcon={!loading && <FiUserPlus />}
          >
            {loading ? `${t('common.loading')}` : t('auth.createAccount')}
          </Button>
        </form>

        <p className="auth-footer">
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="auth-link">
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
