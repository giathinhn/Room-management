import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './PeakHoursHeatmap.css';

const HOURS = Array.from({ length: 16 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`);

const DEFAULT_DAYS_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const DEFAULT_DAYS_FULL = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

/**
 * Get cell background based on count relative to max value.
 * Color scale: transparent → yellow → orange → red
 */
function getCellStyle(count, maxCount) {
  if (count === 0 || maxCount === 0) return {};
  const ratio = count / maxCount;

  // Interpolate: 0→transparent, 0.33→yellow, 0.66→orange, 1→red
  let r, g, b, a;
  if (ratio < 0.33) {
    const t = ratio / 0.33;
    r = Math.round(99 + t * (245 - 99));
    g = Math.round(102 + t * (158 - 102));
    b = Math.round(241 + t * (11 - 241));
    a = 0.15 + t * 0.45;
  } else if (ratio < 0.66) {
    const t = (ratio - 0.33) / 0.33;
    r = Math.round(245 + t * (234 - 245));
    g = Math.round(158 + t * (88 - 158));
    b = Math.round(11 + t * (12 - 11));
    a = 0.6 + t * 0.2;
  } else {
    const t = (ratio - 0.66) / 0.34;
    r = Math.round(234 + t * (239 - 234));
    g = Math.round(88 + t * (68 - 88));
    b = Math.round(12 + t * (68 - 12));
    a = 0.8 + t * 0.2;
  }

  return {
    background: `rgba(${r},${g},${b},${a})`,
    boxShadow: ratio > 0.5 ? `0 0 6px rgba(${r},${g},${b},0.5)` : 'none',
  };
}

/**
 * PeakHoursHeatmap — 7×16 grid (days × hours) showing booking density.
 * Props:
 *   matrix  {number[][]} — 7 rows (Mon-Sun) × 16 cols (07:00-22:00)
 *   loading {boolean}
 */
const PeakHoursHeatmap = ({ matrix = [], loading = false }) => {
  const { t } = useTranslation();
  const [tooltip, setTooltip] = useState(null);

  const rawDaysShort = t('dashboard.daysShort', { returnObjects: true });
  const daysShort = Array.isArray(rawDaysShort) ? rawDaysShort : DEFAULT_DAYS_SHORT;

  const rawDaysFull = t('dashboard.daysFull', { returnObjects: true });
  const daysFull = Array.isArray(rawDaysFull) ? rawDaysFull : DEFAULT_DAYS_FULL;

  if (loading) {
    return (
      <div className="heatmap-skeleton">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="heatmap-skeleton__row">
            {Array.from({ length: 7 }).map((__, j) => (
              <div key={j} className="heatmap-skeleton__cell" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (!matrix.length) {
    return <div className="chart-empty">{t('dashboard.noData')}</div>;
  }

  const maxCount = Math.max(...matrix.flat());

  return (
    <div className="heatmap" role="grid" aria-label={t('dashboard.peakHours')}>
      {/* Header: day labels */}
      <div className="heatmap__row heatmap__header">
        <div className="heatmap__hour-label" />
        {daysShort.map((d) => (
          <div key={d} className="heatmap__day-label">{d}</div>
        ))}
      </div>

      {/* Rows: each hour */}
      {HOURS.map((hour, hIdx) => (
        <div key={hour} className="heatmap__row" role="row">
          <div className="heatmap__hour-label">{hour}</div>
          {daysShort.map((_, dIdx) => {
            const count = matrix[dIdx]?.[hIdx] ?? 0;
            const cellStyle = getCellStyle(count, maxCount);
            return (
              <div
                key={dIdx}
                className={`heatmap__cell${count > 0 ? ' heatmap__cell--active' : ''}`}
                style={cellStyle}
                role="gridcell"
                aria-label={`${daysFull[dIdx]}, ${hour}: ${t('dashboard.countUnit', { count })}`}
                onMouseEnter={(e) => {
                  if (count > 0) {
                    setTooltip({
                      day: daysFull[dIdx],
                      hour,
                      count,
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}
        </div>
      ))}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="heatmap__tooltip"
          style={{ top: tooltip.y - 60, left: tooltip.x + 12 }}
        >
          <strong>{tooltip.day}, {tooltip.hour}</strong>
          <br />
          {t('dashboard.countTimes', { count: tooltip.count })}
        </div>
      )}

      {/* Legend */}
      <div className="heatmap__legend">
        <span className="heatmap__legend-label">{t('dashboard.low')}</span>
        <div className="heatmap__legend-scale" />
        <span className="heatmap__legend-label">{t('dashboard.high')}</span>
      </div>
    </div>
  );
};

export default PeakHoursHeatmap;
