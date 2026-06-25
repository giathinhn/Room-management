import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Dot,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

const LINES = [
  { key: 'total',    color: '#6366f1', label: 'Tổng' },
  { key: 'approved', color: '#10b981', label: 'Đã duyệt' },
  { key: 'rejected', color: '#ef4444', label: 'Từ chối' },
  { key: 'pending',  color: '#f59e0b', label: 'Chờ duyệt' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1e1e35',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 13,
      minWidth: 140,
    }}>
      <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 3 }}>
          {LINES.find((l) => l.key === p.dataKey)?.label}: {p.value}
        </div>
      ))}
    </div>
  );
};

const CustomDot = ({ cx, cy, fill }) => (
  <circle cx={cx} cy={cy} r={4} fill={fill} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
);

/**
 * TrendChart — multi-line chart showing booking trends over time.
 * Props:
 *   data        {Array<{ period, total, approved, rejected, pending }>}
 *   granularity {'week'|'month'}
 *   loading     {boolean}
 */
const TrendChart = ({ data = [], granularity = 'week', loading = false }) => {
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
    return <div className="chart-empty">Chưa có dữ liệu trong khoảng thời gian này</div>;
  }

  // Format X-axis label
  const formatPeriod = (period) => {
    try {
      const date = parseISO(period);
      return granularity === 'month'
        ? format(date, 'MM/yyyy', { locale: vi })
        : format(date, 'dd/MM', { locale: vi });
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
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="label"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => {
            const found = LINES.find((l) => l.key === value);
            return <span style={{ color: '#94a3b8', fontSize: 12 }}>{found?.label || value}</span>;
          }}
        />
        {LINES.map((line) => (
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
