import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import './LoginPage.css';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.email) {
      errs.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = t('validation.emailInvalid');
    }
    if (!form.password) {
      errs.password = t('validation.passwordRequired');
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
      await login(form.email, form.password);
      toast.success(t('auth.loginSuccess'));
      const redirectPath = searchParams.get('redirect') || '/dashboard';
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code || 'INVALID_CREDENTIALS';
      const msg = t(`errors.${errorCode}`);
      toast.error(msg);
      if (err?.response?.status === 401) {
        setErrors({ password: t('errors.INVALID_CREDENTIALS') });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background orbs */}
      <div className="auth-bg">
        <div className="auth-orb auth-orb--1" />
        <div className="auth-orb auth-orb--2" />
        <div className="auth-orb auth-orb--3" />
      </div>

      <div className="auth-card animate-fade-in-up">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#grad)" />
              <path d="M7 10h14M7 14h10M7 18h6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="28" y2="28">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="auth-logo-text">RoomBook</span>
        </div>

        <h1 className="auth-title">{t('auth.welcomeBack')}</h1>
        <p className="auth-subtitle">{t('auth.loginSubtitle')}</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Input
            id="login-email"
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

          <Input
            id="login-password"
            type="password"
            name="password"
            label={t('auth.password')}
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            leftIcon={<FiLock />}
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="auth-submit-btn"
            leftIcon={!loading && <FiLogIn />}
          >
            {loading ? `${t('common.loading')}` : t('auth.login')}
          </Button>
        </form>

        <p className="auth-footer">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="auth-link">
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
