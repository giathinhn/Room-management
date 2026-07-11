import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import bookingService from '../services/booking.service';
import { format, subDays } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import dashboardService from '../services/dashboard.service';
import StatCard from '../components/dashboard/StatCard';
import DateRangeFilter from '../components/dashboard/DateRangeFilter';
import RoomUsageChart from '../components/dashboard/RoomUsageChart';
import PeakHoursHeatmap from '../components/dashboard/PeakHoursHeatmap';
import TopUsersTable from '../components/dashboard/TopUsersTable';
import TrendChart from '../components/dashboard/TrendChart';
import { useTranslation } from 'react-i18next';
import useSSEEvent from '../hooks/useSSEEvent';
import '../components/dashboard/chart.utils.css';
import './DashboardPage.css';

// ── Helpers ─────────────────────────────────────────────────────────────────

const roleConfig = {
  admin: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  approver: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  user: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
};

function greeting(t) {
  const h = new Date().getHours();
  if (h < 12) return t('dashboard.greeting.morning');
  if (h < 18) return t('dashboard.greeting.afternoon');
  return t('dashboard.greeting.evening');
}

function defaultRange() {
  const end = new Date();
  const start = subDays(end, 6);
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
  };
}

// ── Component ────────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const roleInfo = roleConfig[user?.role] || roleConfig.user;
  const isAdmin = user?.role === 'admin';

  const roleLabel = {
    admin: t('roles.admin'),
    approver: t('roles.approver'),
    user: t('roles.user'),
  };

  const [dateRange, setDateRange] = useState(defaultRange());
  const [granularity, setGranularity] = useState('week');
  const [now, setNow] = useState(new Date());

  // Timer for check-in countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDashboardCheckIn = async (e, bookingId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await bookingService.checkInBooking(bookingId);
      toast.success(t('dashboard.checkInSuccess'));
      fetchPersonalStats();
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code || 'INTERNAL_ERROR';
      toast.error(t(`errors.${errorCode}`));
    }
  };

  // Data states
  const [overview, setOverview] = useState(null);
  const [roomUsage, setRoomUsage] = useState([]);
  const [peakHours, setPeakHours] = useState(null);
  const [topUsers, setTopUsers] = useState([]);
  const [trends, setTrends] = useState([]);
  const [personalStats, setPersonalStats] = useState(null);

  // Loading states (individual)
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingPeak, setLoadingPeak] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [loadingPersonal, setLoadingPersonal] = useState(false);

  const { startDate, endDate } = dateRange;

  // ── Fetchers ─────────────────────────────────────────────────────────────

  const fetchOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const data = await dashboardService.getOverview(startDate, endDate);
      setOverview(data);
    } catch (e) {
      console.error('overview error', e);
    } finally {
      setLoadingOverview(false);
    }
  }, [startDate, endDate]);

  const fetchRoomUsage = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const data = await dashboardService.getRoomUsage(startDate, endDate);
      setRoomUsage(data);
    } catch (e) {
      console.error('room usage error', e);
    } finally {
      setLoadingRooms(false);
    }
  }, [startDate, endDate]);

  const fetchPeakHours = useCallback(async () => {
    setLoadingPeak(true);
    try {
      const data = await dashboardService.getPeakHours(startDate, endDate);
      setPeakHours(data);
    } catch (e) {
      console.error('peak hours error', e);
    } finally {
      setLoadingPeak(false);
    }
  }, [startDate, endDate]);

  const fetchTopUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await dashboardService.getTopUsers(startDate, endDate);
      setTopUsers(data);
    } catch (e) {
      console.error('top users error', e);
    } finally {
      setLoadingUsers(false);
    }
  }, [startDate, endDate]);

  const fetchTrends = useCallback(async () => {
    setLoadingTrends(true);
    try {
      const data = await dashboardService.getTrends(startDate, endDate, granularity);
      setTrends(data);
    } catch (e) {
      console.error('trends error', e);
    } finally {
      setLoadingTrends(false);
    }
  }, [startDate, endDate, granularity]);

  const fetchPersonalStats = useCallback(async () => {
    setLoadingPersonal(true);
    try {
      const data = await dashboardService.getPersonalStats();
      setPersonalStats(data);
    } catch (e) {
      console.error('personal stats error', e);
    } finally {
      setLoadingPersonal(false);
    }
  }, []);

  // Fetch all when dateRange/user shifts
  useEffect(() => {
    if (isAdmin) {
      fetchOverview();
      fetchRoomUsage();
      fetchPeakHours();
      fetchTopUsers();
      fetchTrends();
    } else {
      fetchPersonalStats();
    }
  }, [isAdmin, fetchOverview, fetchRoomUsage, fetchPeakHours, fetchTopUsers, fetchTrends, fetchPersonalStats]);

  useSSEEvent('bookings_changed', () => {
    if (isAdmin) {
      fetchOverview();
      fetchRoomUsage();
      fetchPeakHours();
      fetchTopUsers();
      fetchTrends();
    } else {
      fetchPersonalStats();
    }
  });

  // ── Render helpers ────────────────────────────────────────────────────────

  const statCards = overview
    ? [
        {
          icon: '📋', label: t('dashboard.stats.totalBookings'),
          value: overview.totalBookings.toLocaleString(),
          color: '#6366f1',
        },
        {
          icon: '✅', label: t('dashboard.stats.approved'),
          value: overview.approved.toLocaleString(),
          percentage: overview.approvalRate,
          color: '#10b981',
        },
        {
          icon: '❌', label: t('dashboard.stats.rejected'),
          value: overview.rejected.toLocaleString(),
          percentage: overview.totalBookings
            ? ((overview.rejected / overview.totalBookings) * 100).toFixed(1)
            : 0,
          color: '#ef4444',
        },
        {
          icon: '⏳', label: t('dashboard.stats.pending'),
          value: overview.pending.toLocaleString(),
          percentage: overview.totalBookings
            ? ((overview.pending / overview.totalBookings) * 100).toFixed(1)
            : 0,
          color: '#f59e0b',
        },
      ]
    : [
        { icon: '📋', label: t('dashboard.stats.totalBookings'), color: '#6366f1' },
        { icon: '✅', label: t('dashboard.stats.approved'), color: '#10b981' },
        { icon: '❌', label: t('dashboard.stats.rejected'), color: '#ef4444' },
        { icon: '⏳', label: t('dashboard.stats.pending'), color: '#f59e0b' },
      ];

  const personalCards = personalStats
    ? user?.role === 'approver'
      ? [
          {
            icon: '📥',
            label: t('dashboard.stats.pendingSystem'),
            value: personalStats.approverMetrics?.pendingApprovalsCount?.toLocaleString() || '0',
            color: '#f59e0b',
          },
          {
            icon: '✅',
            label: t('dashboard.stats.myApproved'),
            value: personalStats.approverMetrics?.myApprovedCount?.toLocaleString() || '0',
            color: '#10b981',
          },
          {
            icon: '❌',
            label: t('dashboard.stats.myRejected'),
            value: personalStats.approverMetrics?.myRejectedCount?.toLocaleString() || '0',
            color: '#ef4444',
          },
          {
            icon: '📋',
            label: t('dashboard.stats.myBookings'),
            value: personalStats.totalBookings?.toLocaleString() || '0',
            color: '#6366f1',
          },
        ]
      : [
          {
            icon: '📋',
            label: t('dashboard.stats.myBookings'),
            value: personalStats.totalBookings?.toLocaleString() || '0',
            color: '#6366f1',
          },
          {
            icon: '✅',
            label: t('dashboard.stats.approved'),
            value: personalStats.approved?.toLocaleString() || '0',
            percentage: personalStats.totalBookings
              ? ((personalStats.approved / personalStats.totalBookings) * 100).toFixed(1)
              : 0,
            color: '#10b981',
          },
          {
            icon: '⏳',
            label: t('dashboard.stats.pending'),
            value: personalStats.pending?.toLocaleString() || '0',
            percentage: personalStats.totalBookings
              ? ((personalStats.pending / personalStats.totalBookings) * 100).toFixed(1)
              : 0,
            color: '#f59e0b',
          },
          {
            icon: '⏱️',
            label: t('dashboard.stats.totalHours'),
            value: `${personalStats.totalHours}h`,
            color: '#3b82f6',
          },
        ]
    : [];

  // ── Non-admin view ────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="dashboard-page dashboard-page--personal">
        {/* Welcome Section */}
        <section className="dashboard-hero animate-fade-in-up">
          <div className="dashboard-hero__text">
            <p className="dashboard-greeting">{greeting(t)},</p>
            <h1 className="dashboard-username">{user?.fullName || 'Người dùng'} 👋</h1>
            <div className="dashboard-role-badge" style={{ color: roleInfo.color, background: roleInfo.bg }}>
              {roleLabel[user?.role] || roleLabel.user}
            </div>
            <p className="dashboard-desc">
              {t('dashboard.welcomeMessage')}
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

        {/* Stats Cards Section */}
        <section className="dashboard-stats animate-fade-in">
          {personalCards.length > 0
            ? personalCards.map((card, i) => (
                <StatCard
                  key={card.label}
                  icon={card.icon}
                  label={card.label}
                  value={card.value}
                  percentage={card.percentage}
                  color={card.color}
                  loading={loadingPersonal}
                  style={{ animationDelay: `${i * 0.07}s` }}
                />
              ))
            : [1, 2, 3, 4].map((_, i) => (
                <StatCard
                  key={i}
                  icon="📋"
                  label={t('common.loading')}
                  loading={true}
                  style={{ animationDelay: `${i * 0.07}s` }}
                />
              ))}
        </section>

        {/* Main Content Columns */}
        <div className="dashboard-row animate-fade-in" style={{ marginTop: '2rem' }}>
          {/* Column 1: Upcoming Bookings */}
          <div className="dashboard-chart-card glass-card personal-upcoming">
            <div className="dashboard-chart-card__header">
              <div>
                <h2 className="dashboard-chart-card__title">📅 {t('dashboard.upcomingBookings')}</h2>
                <p className="dashboard-chart-card__sub">{t('dashboard.upcomingSubtitle')}</p>
              </div>
            </div>
            <div className="dashboard-chart-card__body">
              {loadingPersonal ? (
                <div className="loading-spinner">{t('dashboard.loadingUpcoming')}</div>
              ) : personalStats?.upcomingBookings?.length > 0 ? (
                <div className="upcoming-list">
                  {personalStats.upcomingBookings.map((b) => {
                    const startFormatted = format(new Date(b.startTime), 'HH:mm - dd/MM/yyyy');
                    const startTime = new Date(b.startTime);
                    const checkInStart = new Date(startTime.getTime() - 10 * 60 * 1000);
                    const checkInEnd = new Date(startTime.getTime() + 15 * 60 * 1000);
                    const showCheckIn = b.status === 'approved' && !b.checkedIn && now >= checkInStart && now <= checkInEnd;
                    const secondsLeft = Math.max(0, Math.floor((checkInEnd.getTime() - now.getTime()) / 1000));
                    const formatCountdown = (secs) => {
                      const m = Math.floor(secs / 60);
                      const s = secs % 60;
                      return `${m}:${s.toString().padStart(2, '0')}`;
                    };
                    return (
                      <div
                        key={b.id}
                        className="upcoming-item"
                        onClick={() => navigate(`/bookings/${b.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="upcoming-item__left">
                          <span className={`upcoming-status-badge upcoming-status-badge--${b.status}`}>
                            {b.status === 'approved' ? t('bookings.status.approved') : t('bookings.status.pending')}
                          </span>
                        </div>
                        <div className="upcoming-item__body">
                          <h4 className="upcoming-item__title">{b.title}</h4>
                          <p className="upcoming-item__meta">
                            📍 {b.roomName} ({b.location})
                          </p>
                          <p className="upcoming-item__time">
                            ⏰ {startFormatted}
                          </p>
                          {b.checkedIn && (
                            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
                              ✅ {t('bookingDetail.checkedInAt', { time: format(new Date(b.checkInTime), 'HH:mm') })}
                            </p>
                          )}
                          {showCheckIn && (
                            <div style={{ marginTop: '8px' }}>
                              <button
                                className="btn-checkin"
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                onClick={(e) => handleDashboardCheckIn(e, b.id)}
                              >
                                📍 Check-in ({formatCountdown(secondsLeft)})
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state-container">
                  <p className="empty-state-text">{t('dashboard.noUpcoming')}</p>
                  <Link to="/bookings/new" className="btn btn--primary btn--sm" style={{ marginTop: '1rem' }}>
                    {t('dashboard.bookNow')}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Contextual Sidebar */}
          {user?.role === 'approver' ? (
            /* Approver Sidebar: Recent approvals processed */
            <div className="dashboard-chart-card glass-card personal-recent-approvals">
              <div className="dashboard-chart-card__header">
                <div>
                  <h2 className="dashboard-chart-card__title">📥 {t('dashboard.recentRequests')}</h2>
                  <p className="dashboard-chart-card__sub">{t('dashboard.requestsSubtitle')}</p>
                </div>
              </div>
              <div className="dashboard-chart-card__body">
                {loadingPersonal ? (
                  <div className="loading-spinner">{t('dashboard.loadingHistory')}</div>
                ) : personalStats?.approverMetrics?.approvalsHistory?.length > 0 ? (
                  <div className="approvals-history-list">
                    {personalStats.approverMetrics.approvalsHistory.map((a) => {
                      const approvedTime = a.approvedAt ? format(new Date(a.approvedAt), 'dd/MM/yyyy') : '';
                      return (
                        <div key={a.id} className="history-item">
                          <div className="history-item__header">
                            <span className="history-item__user">{a.bookerName}</span>
                            <span className={`status-tag status-tag--${a.status}`}>
                              {a.status === 'approved' ? t('bookings.status.approved') : t('bookings.status.rejected')}
                            </span>
                          </div>
                          <p className="history-item__title">{a.title}</p>
                          <p className="history-item__meta">
                            🚪 {a.roomName} {approvedTime && `• 📅 ${approvedTime}`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state-container">
                    <p className="empty-state-text">{t('dashboard.noRecentRequests')}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* User Sidebar: Quick actions */
            <div className="dashboard-chart-card glass-card personal-quick-actions">
              <div className="dashboard-chart-card__header">
                <div>
                  <h2 className="dashboard-chart-card__title">⚡ {t('dashboard.quickActions')}</h2>
                  <p className="dashboard-chart-card__sub">{t('dashboard.quickActionsSubtitle')}</p>
                </div>
              </div>
              <div className="dashboard-chart-card__body">
                <div className="quick-actions-grid">
                  <Link to="/bookings/new" className="quick-action-btn">
                    <span className="quick-action-icon">➕</span>
                    <span className="quick-action-label">{t('sidebar.newBooking')}</span>
                  </Link>
                  <Link to="/rooms/search" className="quick-action-btn">
                    <span className="quick-action-icon">🔍</span>
                    <span className="quick-action-label">{t('sidebar.search')}</span>
                  </Link>
                  <Link to="/bookings" className="quick-action-btn">
                    <span className="quick-action-icon">📅</span>
                    <span className="quick-action-label">{t('sidebar.myBookings')}</span>
                  </Link>
                  <Link to="/templates" className="quick-action-btn">
                    <span className="quick-action-icon">🔖</span>
                    <span className="quick-action-label">{t('sidebar.templates')}</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Admin Dashboard ───────────────────────────────────────────────────────
  return (
    <div className="dashboard-page">
      {/* ── Page header ── */}
      <div className="dashboard-topbar animate-fade-in-up">
        <div className="dashboard-topbar__left">
          <h1 className="dashboard-topbar__title">
            <span className="gradient-text">📊 {t('dashboard.title')}</span>
          </h1>
          <p className="dashboard-topbar__sub">{t('dashboard.subtitle')}</p>
        </div>
        <DateRangeFilter onChange={setDateRange} />
      </div>

      {/* ── Extra stats row ── */}
      {overview && (
        <div className="dashboard-extra-stats animate-fade-in">
          <div className="dashboard-extra-stat">
            <span className="dashboard-extra-stat__label">{t('dashboard.today')}</span>
            <span className="dashboard-extra-stat__value">{overview.bookingsToday}</span>
          </div>
          <div className="dashboard-extra-stat">
            <span className="dashboard-extra-stat__label">{t('dashboard.thisWeek')}</span>
            <span className="dashboard-extra-stat__value">{overview.bookingsThisWeek}</span>
          </div>
          <div className="dashboard-extra-stat">
            <span className="dashboard-extra-stat__label">{t('dashboard.stats.approved')}</span>
            <span className="dashboard-extra-stat__value dashboard-extra-stat__value--green">
              {overview.approvalRate}%
            </span>
          </div>
          <div className="dashboard-extra-stat">
            <span className="dashboard-extra-stat__label">{t('dashboard.cancelled')}</span>
            <span className="dashboard-extra-stat__value dashboard-extra-stat__value--muted">
              {overview.cancelled}
            </span>
          </div>
        </div>
      )}

      {/* ── Stat cards ── */}
      <section className="dashboard-stats animate-fade-in">
        {statCards.map((card, i) => (
          <StatCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
            percentage={card.percentage}
            color={card.color}
            loading={loadingOverview}
            style={{ animationDelay: `${i * 0.07}s` }}
          />
        ))}
      </section>

      {/* ── Charts row 1: Room Usage + Heatmap ── */}
      <div className="dashboard-row animate-fade-in">
        <div className="dashboard-chart-card glass-card">
          <div className="dashboard-chart-card__header">
            <div>
              <h2 className="dashboard-chart-card__title">📊 {t('dashboard.roomFrequency')}</h2>
              <p className="dashboard-chart-card__sub">{t('dashboard.roomFrequencySubtitle')}</p>
            </div>
          </div>
          <div className="dashboard-chart-card__body">
            <RoomUsageChart data={roomUsage} loading={loadingRooms} />
          </div>
        </div>

        <div className="dashboard-chart-card glass-card">
          <div className="dashboard-chart-card__header">
            <div>
              <h2 className="dashboard-chart-card__title">🔥 {t('dashboard.peakHours')}</h2>
              <p className="dashboard-chart-card__sub">{t('dashboard.peakHoursSubtitle')}</p>
            </div>
          </div>
          <div className="dashboard-chart-card__body">
            <PeakHoursHeatmap
              matrix={peakHours?.matrix || []}
              loading={loadingPeak}
            />
          </div>
        </div>
      </div>

      {/* ── Charts row 2: Top Users + Trends ── */}
      <div className="dashboard-row animate-fade-in">
        <div className="dashboard-chart-card glass-card">
          <div className="dashboard-chart-card__header">
            <div>
              <h2 className="dashboard-chart-card__title">👤 {t('dashboard.topBookers')}</h2>
              <p className="dashboard-chart-card__sub">{t('dashboard.topBookersSubtitle')}</p>
            </div>
          </div>
          <div className="dashboard-chart-card__body">
            <TopUsersTable data={topUsers} loading={loadingUsers} />
          </div>
        </div>

        <div className="dashboard-chart-card glass-card">
          <div className="dashboard-chart-card__header">
            <div>
              <h2 className="dashboard-chart-card__title">📈 {t('dashboard.bookingTrends')}</h2>
              <p className="dashboard-chart-card__sub">{t('dashboard.trendsSubtitle')}</p>
            </div>
            {/* Granularity toggle */}
            <div className="dashboard-granularity">
              <button
                id="granularity-week"
                className={`dashboard-granularity__btn${granularity === 'week' ? ' active' : ''}`}
                onClick={() => setGranularity('week')}
              >
                {t('dashboard.week')}
              </button>
              <button
                id="granularity-month"
                className={`dashboard-granularity__btn${granularity === 'month' ? ' active' : ''}`}
                onClick={() => setGranularity('month')}
              >
                {t('dashboard.month')}
              </button>
            </div>
          </div>
          <div className="dashboard-chart-card__body">
            <TrendChart data={trends} granularity={granularity} loading={loadingTrends} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
