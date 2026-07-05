import { Link } from 'react-router-dom';
import { FiHome, FiArrowLeft } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import './NotFoundPage.css';

const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <div className="notfound-page">
      <div className="notfound-bg">
        <div className="notfound-orb notfound-orb--1" />
        <div className="notfound-orb notfound-orb--2" />
      </div>

      <div className="notfound-content animate-fade-in-up">
        <div className="notfound-code">404</div>
        <h1 className="notfound-title">{t('notFound.title')}</h1>
        <p className="notfound-desc">
          {t('notFound.desc')}
        </p>

        <div className="notfound-actions">
          <Link to="/dashboard" className="btn btn--primary btn--md" id="notfound-home-btn">
            <FiHome /> {t('notFound.backHome')}
          </Link>
          <button
            className="btn btn--ghost btn--md"
            onClick={() => window.history.back()}
            id="notfound-back-btn"
          >
            <FiArrowLeft /> {t('notFound.back')}
          </button>
        </div>
      </div>

      {/* Decorative floating number */}
      <div className="notfound-deco" aria-hidden="true">
        <span>4</span>
        <div className="notfound-deco__circle">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(99,102,241,0.3)" strokeWidth="2" strokeDasharray="8 6" />
            <circle cx="40" cy="40" r="24" fill="rgba(99,102,241,0.1)" />
            <path d="M28 40l8 8 16-16" stroke="rgba(99,102,241,0.6)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span>4</span>
      </div>
    </div>
  );
};

export default NotFoundPage;
