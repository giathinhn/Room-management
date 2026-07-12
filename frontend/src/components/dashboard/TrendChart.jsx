import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

const CustomDot = ({ cx, cy, fill }) => (
  <circle cx={cx} cy={cy} r={4} fill={fill} stroke="var(--color-bg)" strokeWidth={2} />
);

/**
 * TrendChart — multi-line chart showing booking trends over time.
 * Props:
 *   data        {Array<{ period, total, approved, rejected, pending }>}
 *   granularity {'week'|'month'}
 *   loading     {boolean}
 */
const TrendChart = ({ data = [], granularity = 'week', loading = false }) => {
  const { t, i18n } = useTranslation();

  const lines = [
    { key: 'total',    color: '#6366f1', label: t('dashboard.trends.total') },
    { key: 'approved', color: '#10b981', label: t('dashboard.trends.approved') },
    { key: 'rejected', color: '#ef4444', label: t('dashboard.trends.rejected') },
    { key: 'pending',  color: '#f59e0b', label: t('dashboard.trends.pending') },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 13,
        minWidth: 140,
      }}>
        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>{label}</div>
        {payload.map((p) => (
          <div key={p.dataKey} style={{ color: p.color, marginBottom: 3 }}>
            {lines.find((l) => l.key === p.dataKey)?.label}: {p.value}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="chart-skeleton" style={{ width: '100%' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="chart-skeleton__bar" style={{ height: 60, borderRadius: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return <div className="chart-empty">{t('dashboard.noData')}</div>;
  }

  // Format X-axis label
  const formatPeriod = (period) => {
    try {
      const date = parseISO(period);
      const currentLocale = i18n.language === 'en' ? enUS : vi;
      return granularity === 'month'
        ? format(date, 'MM/yyyy', { locale: currentLocale })
        : format(date, 'dd/MM', { locale: currentLocale });
    } catch {
      return period;
    }
  };

  const chartData = data.map((d) => ({
    ...d,
    label: formatPeriod(d.period),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="label"
          tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => {
            const found = lines.find((l) => l.key === value);
            return <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{found?.label || value}</span>;
          }}
        />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            strokeWidth={2.5}
            dot={<CustomDot fill={line.color} />}
            activeDot={{ r: 6, fill: line.color, stroke: '#fff', strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TrendChart;
