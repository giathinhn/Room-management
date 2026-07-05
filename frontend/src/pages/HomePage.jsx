import { useEffect, useState } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import './HomePage.css';

// ─── Stat Card Component ─────────────────────────────────────────────────────
function StatCard({ icon, value, label, color, delay }) {
  return (
    <div className="stat-card animate-fade-in-up" style={{ animationDelay: delay }}>
      <div className="stat-icon" style={{ background: color }}>
        <span>{icon}</span>
      </div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

// ─── Feature Card Component ───────────────────────────────────────────────────
function FeatureCard({ icon, title, description, delay }) {
  return (
    <div className="feature-card glass-card animate-fade-in-up" style={{ animationDelay: delay }}>
      <div className="feature-icon">{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
    </div>
  );
}

// ─── Tech Badge ───────────────────────────────────────────────────────────────
function TechBadge({ name, color }) {
  return (
    <span className="tech-badge" style={{ borderColor: color, color }}>
      {name}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function HomePage() {
  const { t } = useTranslation();
  const [healthStatus, setHealthStatus] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const { data } = await api.get('/health');
        setHealthStatus({ ok: true, ...data });
      } catch (_err) {
        setHealthStatus({ ok: false });
      } finally {
        setHealthLoading(false);
      }
    };
    checkHealth();
  }, []);

  const features = [
    {
      icon: '🏢',
      title: t('home.features.rooms.title'),
      description: t('home.features.rooms.desc'),
    },
    {
      icon: '📅',
      title: t('home.features.bookings.title'),
      description: t('home.features.bookings.desc'),
    },
    {
      icon: '🔐',
      title: t('home.features.roles.title'),
      description: t('home.features.roles.desc'),
    },
    {
      icon: '🔔',
      title: t('home.features.notifications.title'),
      description: t('home.features.notifications.desc'),
    },
    {
      icon: '📊',
      title: t('home.features.dashboard.title'),
      description: t('home.features.dashboard.desc'),
    },
    {
      icon: '🗓️',
      title: t('home.features.calendar.title'),
      description: t('home.features.calendar.desc'),
    },
  ];

  const stats = [
    { icon: '🏢', value: '5', label: t('home.stats.rooms'), color: 'rgba(99, 102, 241, 0.2)', delay: '0ms' },
    { icon: '👥', value: '4', label: t('home.stats.accounts'), color: 'rgba(6, 182, 212, 0.2)', delay: '100ms' },
    { icon: '📋', value: '8', label: t('home.stats.bookings'), color: 'rgba(16, 185, 129, 0.2)', delay: '200ms' },
    { icon: '🗄️', value: '8', label: t('home.stats.tables'), color: 'rgba(245, 158, 11, 0.2)', delay: '300ms' },
  ];

  const techStack = [
    { name: 'React 18', color: '#61dafb' },
    { name: 'Vite', color: '#646cff' },
    { name: 'Express', color: '#68d391' },
    { name: 'Prisma', color: '#5a67d8' },
    { name: 'PostgreSQL', color: '#4299e1' },
    { name: 'Docker', color: '#0db7ed' },
    { name: 'JWT', color: '#f59e0b' },
    { name: 'Axios', color: '#ff6b6b' },
  ];

  return (
    <div className="home-page">
      {/* Background effects */}
      <div className="bg-gradient-orb orb-1" />
      <div className="bg-gradient-orb orb-2" />
      <div className="bg-gradient-orb orb-3" />

      {/* Navigation */}
      <nav className="home-nav">
        <div className="container nav-inner">
          <div className="nav-brand">
            <span className="brand-icon">🏛️</span>
            <span className="brand-name">RoomSync</span>
            <span className="brand-version">v1.0</span>
          </div>
          <div className="nav-actions">
            {/* Health indicator */}
            <div className="health-indicator" id="health-status-indicator">
              {healthLoading ? (
                <span className="health-dot loading" />
              ) : healthStatus?.ok ? (
                <>
                  <span className="health-dot online" />
                  <span className="health-label">API Online</span>
                </>
              ) : (
                <>
                  <span className="health-dot offline" />
                  <span className="health-label">API Offline</span>
                </>
              )}
            </div>
            <a href="/login" className="btn btn-primary" id="btn-get-started">
              {t('home.start')}
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge animate-fade-in">
              ✨ {t('home.systemName')}
            </div>
            <h1 className="hero-title animate-fade-in-up">
              {t('home.smartManagement')}{' '}
              <span className="gradient-text">{t('home.gradientText')}</span>
              <br />
              {t('home.moreEfficient')}
            </h1>
            <p className="hero-description animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              {t('home.subtitle')}
            </p>
            <div className="hero-actions animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <a href="/login" className="btn btn-primary btn-lg" id="btn-hero-login">
                {t('home.loginButton')}
              </a>
              <a href="/rooms" className="btn btn-secondary btn-lg" id="btn-hero-rooms">
                {t('home.viewRooms')}
              </a>
            </div>
            {/* Tech stack */}
            <div className="tech-stack animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              {techStack.map((tech) => (
                <TechBadge key={tech.name} {...tech} />
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="hero-visual animate-float">
            <div className="hero-card glass-card">
              <div className="hero-card-header">
                <div className="card-dot red" />
                <div className="card-dot yellow" />
                <div className="card-dot green" />
                <span className="card-title">Booking Dashboard</span>
              </div>
              <div className="mock-booking">
                <div className="mock-room-item">
                  <div className="mock-avatar" style={{ background: '#6366f1' }}>E</div>
                  <div className="mock-info">
                    <div className="mock-name">Phòng Emerald</div>
                    <div className="mock-time">09:00 – 11:00</div>
                  </div>
                  <span className="badge badge-approved">Approved</span>
                </div>
                <div className="mock-room-item">
                  <div className="mock-avatar" style={{ background: '#06b6d4' }}>S</div>
                  <div className="mock-info">
                    <div className="mock-name">Phòng Sapphire</div>
                    <div className="mock-time">14:00 – 16:00</div>
                  </div>
                  <span className="badge badge-pending">Pending</span>
                </div>
                <div className="mock-room-item">
                  <div className="mock-avatar" style={{ background: '#10b981' }}>R</div>
                  <div className="mock-info">
                    <div className="mock-name">Phòng Ruby</div>
                    <div className="mock-time">13:30 – 14:30</div>
                  </div>
                  <span className="badge badge-approved">Approved</span>
                </div>
                <div className="mock-room-item">
                  <div className="mock-avatar" style={{ background: '#f59e0b' }}>D</div>
                  <div className="mock-info">
                    <div className="mock-name">Hội trường Diamond</div>
                    <div className="mock-time">08:00 – 17:00</div>
                  </div>
                  <span className="badge badge-rejected">Rejected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* API Health Section */}
      {!healthLoading && (
        <section className="health-section">
          <div className="container">
            <div
              className={`health-card glass-card ${healthStatus?.ok ? 'health-ok' : 'health-error'}`}
              id="health-card"
            >
              <div className="health-icon">{healthStatus?.ok ? '✅' : '⚠️'}</div>
              <div className="health-info">
                <div className="health-title">
                  {healthStatus?.ok ? t('home.health.online') : t('home.health.offline')}
                </div>
                {healthStatus?.ok ? (
                  <div className="health-detail">
                    Status: <code>ok</code> · Uptime:{' '}
                    <code>{healthStatus.uptime ? Math.floor(healthStatus.uptime) + 's' : 'N/A'}</code> · Env:{' '}
                    <code>{healthStatus.environment || 'development'}</code>
                  </div>
                ) : (
                  <div className="health-detail">
                    {t('home.health.offlineInstructions')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              {t('home.featuresTitle')}{' '}
              <span className="gradient-text">{t('home.featuresTitleGradient')}</span>
            </h2>
            <p className="section-description">
              {t('home.featuresSubtitle')}
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, idx) => (
              <FeatureCard
                key={feature.title}
                {...feature}
                delay={`${idx * 80}ms`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Demo Accounts Section */}
      <section className="accounts-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              {t('home.demo.title')}{' '}
              <span className="gradient-text">{t('home.demo.titleGradient')}</span>
            </h2>
            <p className="section-description">
              {t('home.demo.subtitle')}
            </p>
          </div>
          <div className="accounts-grid">
            {[
              { email: 'admin@company.com', role: t('roles.admin'), icon: '👑', color: '#f59e0b', desc: 'Toàn quyền hệ thống' },
              { email: 'approver@company.com', role: t('roles.approver'), icon: '✅', color: '#10b981', desc: 'Duyệt / từ chối booking' },
              { email: 'user1@company.com', role: t('roles.user'), icon: '👤', color: '#6366f1', desc: 'Nguyễn Văn A' },
              { email: 'user2@company.com', role: t('roles.user'), icon: '👤', color: '#06b6d4', desc: 'Trần Thị B' },
            ].map(({ email, role, icon, color, desc }) => (
              <div key={email} className="account-card glass-card" id={`account-${role.toLowerCase()}`}>
                <div className="account-icon" style={{ background: `${color}20`, color }}>
                  {icon}
                </div>
                <div className="account-info">
                  <div className="account-role" style={{ color }}>{role}</div>
                  <div className="account-email">{email}</div>
                  <div className="account-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <span>🏛️ RoomSync</span>
            <span className="footer-version">Plan 00 — Foundation</span>
          </div>
          <div className="footer-links">
            <a href="/api/health" target="_blank" rel="noreferrer" id="link-api-health">
              API Health
            </a>
            <span className="footer-divider">·</span>
            <a href="http://localhost:5555" target="_blank" rel="noreferrer" id="link-prisma-studio">
              Prisma Studio
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
