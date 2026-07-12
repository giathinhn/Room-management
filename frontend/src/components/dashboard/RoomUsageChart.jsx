import { useTranslation } from 'react-i18next';
import './RoomUsageChart.css';

const GRADIENT_COLORS = [
  'linear-gradient(90deg, #6366f1 0%, rgba(99,102,241,0.5) 100%)',
  'linear-gradient(90deg, #7c3aed 0%, rgba(124,58,237,0.5) 100%)',
  'linear-gradient(90deg, #8b5cf6 0%, rgba(139,92,246,0.5) 100%)',
  'linear-gradient(90deg, #a78bfa 0%, rgba(167,139,250,0.5) 100%)',
  'linear-gradient(90deg, #818cf8 0%, rgba(129,140,248,0.5) 100%)',
  'linear-gradient(90deg, #93c5fd 0%, rgba(147,197,253,0.5) 100%)',
  'linear-gradient(90deg, #60a5fa 0%, rgba(96,165,250,0.5) 100%)',
  'linear-gradient(90deg, #38bdf8 0%, rgba(56,189,248,0.5) 100%)',
];

/**
 * RoomUsageChart — custom progress list showing room booking count and total hours.
 * Props:
 *   data    {Array<{ roomId, roomName, bookingCount, totalHours, location }>}
 *   loading {boolean}
 */
const RoomUsageChart = ({ data = [], loading = false }) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="chart-skeleton">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="chart-skeleton__bar" style={{ width: `${85 - i * 12}%` }} />
        ))}
      </div>
    );
  }

  if (!data.length) {
    return <div className="chart-empty">{t('dashboard.noData')}</div>;
  }

  const displayData = data.slice(0, 10);
  const maxBookings = Math.max(...displayData.map((d) => d.bookingCount), 1);

  return (
    <div className="room-usage-list">
      {displayData.map((item, index) => {
        const percentage = (item.bookingCount / maxBookings) * 100;
        const barColor = GRADIENT_COLORS[index % GRADIENT_COLORS.length];

        return (
          <div key={item.roomId || index} className="room-usage-row">
            <div className="room-usage-row__info">
              <span className="room-usage-row__name" title={item.roomName}>
                {item.roomName}
                {item.location && <span className="room-usage-row__location">📍 {item.location}</span>}
              </span>
              <span className="room-usage-row__stats">
                <span className="room-usage-row__count">
                  {t('dashboard.countTime', { count: item.bookingCount })}
                </span>
                <span className="room-usage-row__divider">•</span>
                <span className="room-usage-row__hours">
                  {t('dashboard.hoursUnit', { count: item.totalHours })}
                </span>
              </span>
            </div>
            <div className="room-usage-row__bar-container">
              <div 
                className="room-usage-row__bar-fill" 
                style={{ 
                  width: `${percentage}%`,
                  background: barColor
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RoomUsageChart;
