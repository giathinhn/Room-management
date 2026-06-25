import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const GRADIENT_COLORS = [
  '#6366f1', '#7c3aed', '#8b5cf6', '#a78bfa',
  '#818cf8', '#93c5fd', '#60a5fa', '#38bdf8',
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: '#1e1e35',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 13,
    }}>
      <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{d.roomName}</div>
      {d.location && <div style={{ color: '#64748b', marginBottom: 4 }}>📍 {d.location}</div>}
      <div style={{ color: '#a78bfa' }}>📋 {d.bookingCount} lần đặt</div>
      <div style={{ color: '#60a5fa' }}>⏱ {d.totalHours} giờ</div>
    </div>
  );
};

/**
 * RoomUsageChart — horizontal bar chart showing booking count per room.
 * Props:
 *   data    {Array<{ roomName, bookingCount, totalHours, location }>}
 *   loading {boolean}
 */
const RoomUsageChart = ({ data = [], loading = false }) => {
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
    return <div className="chart-empty">Chưa có dữ liệu trong khoảng thời gian này</div>;
  }

  const displayData = data.slice(0, 10);

  return (
    <ResponsiveContainer width="100%" height={Math.max(240, displayData.length * 42)}>
      <BarChart
        data={displayData}
        layout="vertical"
        margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
      >
        <defs>
          {GRADIENT_COLORS.map((color, i) => (
            <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity={0.9} />
              <stop offset="100%" stopColor={color} stopOpacity={0.5} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: '#64748b', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="roomName"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
        <Bar dataKey="bookingCount" radius={[0, 6, 6, 0]} maxBarSize={28}>
          {displayData.map((_, i) => (
            <Cell key={i} fill={`url(#barGrad${i % GRADIENT_COLORS.length})`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RoomUsageChart;
