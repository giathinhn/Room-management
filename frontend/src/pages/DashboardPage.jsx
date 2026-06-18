import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

const roleConfig = {
  admin: { label: 'Quản trị viên', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  approver: { label: 'Người duyệt', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  user: { label: 'Nhân viên', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
};

const PLACEHOLDER_STATS = [
  { label: 'Phòng đang hoạt động', value: '—', icon: '🏢' },
  { label: 'Đặt phòng hôm nay', value: '—', icon: '📅' },
  { label: 'Đang chờ duyệt', value: '—', icon: '⏳' },
  { label: 'Tổng đặt phòng', value: '—', icon: '📊' },
];

const DashboardPage = () => {
  const { user } = useAuth();
  const role = roleConfig[user?.role] || roleConfig.user;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <div className="dashboard-page">
      {/* Welcome hero */}
      <section className="dashboard-hero animate-fade-in-up">
        <div className="dashboard-hero__text">
          <p className="dashboard-greeting">{greeting()},</p>
          <h1 className="dashboard-username">{user?.fullName || 'Người dùng'} 👋</h1>
          <div
            className="dashboard-role-badge"
            style={{ color: role.color, background: role.bg }}
          >
            {role.label}
          </div>
          <p className="dashboard-desc">
            Đây là tổng quan hệ thống đặt phòng họp của bạn. Các thống kê và tính năng
            đầy đủ sẽ được bổ sung ở các phiên bản tiếp theo.
          </p>
        </div>

        <div className="dashboard-hero__illustration" aria-hidden="true">
          <div className="dashboard-hero__glow" />
          <svg width="180" height="160" viewBox="0 0 180 160" fill="none" opacity="0.85">
            <rect x="20" y="20" width="140" height="120" rx="14" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5" />
            <rect x="36" y="44" width="108" height="12" rx="6" fill="rgba(99,102,241,0.4)" />
            <rect x="36" y="66" width="80" height="8" rx="4" fill="rgba(148,163,184,0.25)" />
            <rect x="36" y="82" width="60" height="8" rx="4" fill="rgba(148,163,184,0.2)" />
            <rect x="36" y="98" width="90" height="8" rx="4" fill="rgba(148,163,184,0.15)" />
            <circle cx="148" cy="36" r="18" fill="rgba(139,92,246,0.3)" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" />
            <path d="M140 36l5 5 9-9" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* Stats cards (placeholder) */}
      <section className="dashboard-stats">
        {PLACEHOLDER_STATS.map((stat, i) => (
          <div
            key={stat.label}
            className="dashboard-stat-card glass-card animate-fade-in"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="dashboard-stat-card__icon">{stat.icon}</div>
            <div className="dashboard-stat-card__value">{stat.value}</div>
            <div className="dashboard-stat-card__label">{stat.label}</div>
            <div className="dashboard-stat-card__badge">Sắp ra mắt</div>
          </div>
        ))}
      </section>

      {/* Coming soon notice */}
      <div className="dashboard-coming-soon glass-card animate-fade-in">
        <div className="dashboard-coming-soon__icon">🚀</div>
        <div>
          <h2 className="dashboard-coming-soon__title">Đang phát triển</h2>
          <p className="dashboard-coming-soon__desc">
            Tính năng quản lý phòng, đặt lịch và xem lịch sẽ được bổ sung trong các
            cập nhật tiếp theo. Hãy theo dõi nhé!
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
