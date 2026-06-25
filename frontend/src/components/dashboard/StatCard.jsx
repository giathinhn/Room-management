import './StatCard.css';

/**
 * StatCard — glassmorphism stat card with icon, value, label, and optional percentage.
 *
 * Props:
 *   icon       {string}  — emoji or icon character
 *   label      {string}  — card label
 *   value      {string|number} — primary metric
 *   percentage {number}  — optional % shown as sub-text
 *   color      {string}  — accent color (CSS color)
 *   loading    {boolean} — show skeleton state
 */
const StatCard = ({ icon, label, value, percentage, color = '#6366f1', loading = false }) => {
  return (
    <div
      className={`stat-card glass-card${loading ? ' stat-card--loading' : ''}`}
      style={{ '--stat-color': color }}
    >
      <div className="stat-card__header">
        <span className="stat-card__icon">{icon}</span>
        {percentage !== undefined && !loading && (
          <span className="stat-card__pct">{percentage}%</span>
        )}
      </div>

      {loading ? (
        <>
          <div className="stat-card__skeleton stat-card__skeleton--value" />
          <div className="stat-card__skeleton stat-card__skeleton--label" />
        </>
      ) : (
        <>
          <div className="stat-card__value">{value ?? '—'}</div>
          <div className="stat-card__label">{label}</div>
        </>
      )}

      {/* Glow orb */}
      <div className="stat-card__glow" />
    </div>
  );
};

export default StatCard;
