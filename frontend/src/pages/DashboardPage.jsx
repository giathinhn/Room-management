import { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import dashboardService from '../services/dashboard.service';
import StatCard from '../components/dashboard/StatCard';
import DateRangeFilter from '../components/dashboard/DateRangeFilter';
import RoomUsageChart from '../components/dashboard/RoomUsageChart';
import PeakHoursHeatmap from '../components/dashboard/PeakHoursHeatmap';
import TopUsersTable from '../components/dashboard/TopUsersTable';
import TrendChart from '../components/dashboard/TrendChart';
import '../components/dashboard/chart.utils.css';
import './DashboardPage.css';

// ── Helpers ─────────────────────────────────────────────────────────────────

const roleConfig = {
  admin: { label: 'Quản trị viên', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  approver: { label: 'Người duyệt', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  user: { label: 'Nhân viên', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
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
  const { user } = useAuth();
  const role = roleConfig[user?.role] || roleConfig.user;
  const isAdmin = user?.role === 'admin';

  const [dateRange, setDateRange] = useState(defaultRange());
  const [granularity, setGranularity] = useState('week');

  // Data states
  const [overview, setOverview] = useState(null);
  const [roomUsage, setRoomUsage] = useState([]);
  const [peakHours, setPeakHours] = useState(null);
  const [topUsers, setTopUsers] = useState([]);
  const [trends, setTrends] = useState([]);

  // Loading states (individual)
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingPeak, setLoadingPeak] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);

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

  // Fetch all when dateRange changes
  useEffect(() => {
    if (!isAdmin) return;
    fetchOverview();
    fetchRoomUsage();
    fetchPeakHours();
    fetchTopUsers();
    fetchTrends();
  }, [isAdmin, fetchOverview, fetchRoomUsage, fetchPeakHours, fetchTopUsers, fetchTrends]);

  // ── Render helpers ────────────────────────────────────────────────────────

  const statCards = overview
    ? [
        {
          icon: '📋', label: 'Tổng booking',
          value: overview.totalBookings.toLocaleString(),
          color: '#6366f1',
        },
        {
          icon: '✅', label: 'Đã duyệt',
          value: overview.approved.toLocaleString(),
          percentage: overview.approvalRate,
          color: '#10b981',
        },
        {
          icon: '❌', label: 'Từ chối',
          value: overview.rejected.toLocaleString(),
          percentage: overview.totalBookings
            ? ((overview.rejected / overview.totalBookings) * 100).toFixed(1)
            : 0,
          color: '#ef4444',
        },
        {
          icon: '⏳', label: 'Chờ duyệt',
          value: overview.pending.toLocaleString(),
          percentage: overview.totalBookings
            ? ((overview.pending / overview.totalBookings) * 100).toFixed(1)
            : 0,
          color: '#f59e0b',
        },
      ]
    : [
        { icon: '📋', label: 'Tổng booking', color: '#6366f1' },
        { icon: '✅', label: 'Đã duyệt', color: '#10b981' },
        { icon: '❌', label: 'Từ chối', color: '#ef4444' },
        { icon: '⏳', label: 'Chờ duyệt', color: '#f59e0b' },
      ];

  // ── Non-admin view ────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="dashboard-page">
        <section className="dashboard-hero animate-fade-in-up">
          <div className="dashboard-hero__text">
            <p className="dashboard-greeting">{greeting()},</p>
            <h1 className="dashboard-username">{user?.fullName || 'Người dùng'} 👋</h1>
            <div className="dashboard-role-badge" style={{ color: role.color, background: role.bg }}>
              {role.label}
            </div>
            <p className="dashboard-desc">
              Chào mừng bạn đến với hệ thống đặt phòng họp. Sử dụng menu để đặt phòng và xem lịch.
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
            <span className="gradient-text">📊 Dashboard</span>
          </h1>
          <p className="dashboard-topbar__sub">Thống kê &amp; phân tích hệ thống đặt phòng</p>
        </div>
        <DateRangeFilter onChange={setDateRange} />
      </div>

      {/* ── Extra stats row ── */}
      {overview && (
        <div className="dashboard-extra-stats animate-fade-in">
          <div className="dashboard-extra-stat">
            <span className="dashboard-extra-stat__label">Hôm nay</span>
            <span className="dashboard-extra-stat__value">{overview.bookingsToday}</span>
          </div>
          <div className="dashboard-extra-stat">
            <span className="dashboard-extra-stat__label">Tuần này</span>
            <span className="dashboard-extra-stat__value">{overview.bookingsThisWeek}</span>
          </div>
          <div className="dashboard-extra-stat">
            <span className="dashboard-extra-stat__label">Tỉ lệ duyệt</span>
            <span className="dashboard-extra-stat__value dashboard-extra-stat__value--green">
              {overview.approvalRate}%
            </span>
          </div>
          <div className="dashboard-extra-stat">
            <span className="dashboard-extra-stat__label">Đã huỷ</span>
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
              <h2 className="dashboard-chart-card__title">📊 Tần suất phòng</h2>
              <p className="dashboard-chart-card__sub">Số lượt đặt theo phòng</p>
            </div>
          </div>
          <div className="dashboard-chart-card__body">
            <RoomUsageChart data={roomUsage} loading={loadingRooms} />
          </div>
        </div>

        <div className="dashboard-chart-card glass-card">
          <div className="dashboard-chart-card__header">
            <div>
              <h2 className="dashboard-chart-card__title">🔥 Giờ cao điểm</h2>
              <p className="dashboard-chart-card__sub">Mật độ đặt phòng theo giờ &amp; ngày</p>
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
              <h2 className="dashboard-chart-card__title">👤 Top người đặt</h2>
              <p className="dashboard-chart-card__sub">Top 10 người đặt nhiều nhất</p>
            </div>
          </div>
          <div className="dashboard-chart-card__body">
            <TopUsersTable data={topUsers} loading={loadingUsers} />
          </div>
        </div>

        <div className="dashboard-chart-card glass-card">
          <div className="dashboard-chart-card__header">
            <div>
              <h2 className="dashboard-chart-card__title">📈 Xu hướng booking</h2>
              <p className="dashboard-chart-card__sub">Theo thời gian</p>
            </div>
            {/* Granularity toggle */}
            <div className="dashboard-granularity">
              <button
                id="granularity-week"
                className={`dashboard-granularity__btn${granularity === 'week' ? ' active' : ''}`}
                onClick={() => setGranularity('week')}
              >
                Tuần
              </button>
              <button
                id="granularity-month"
                className={`dashboard-granularity__btn${granularity === 'month' ? ' active' : ''}`}
                onClick={() => setGranularity('month')}
              >
                Tháng
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
