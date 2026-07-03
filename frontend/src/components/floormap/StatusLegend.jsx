import './StatusLegend.css';

const LEGEND_ITEMS = [
  { status: 'available', label: 'Trống', dotClass: 'legend-dot--available' },
  { status: 'in_use',   label: 'Đang họp', dotClass: 'legend-dot--in-use' },
  { status: 'upcoming', label: 'Sắp họp (30 phút)', dotClass: 'legend-dot--upcoming' },
];

const StatusLegend = () => (
  <div className="status-legend" role="note" aria-label="Chú thích trạng thái phòng">
    {LEGEND_ITEMS.map(({ status, label, dotClass }) => (
      <div key={status} className="status-legend__item">
        <span className={`status-legend__dot ${dotClass}`} />
        <span className="status-legend__label">{label}</span>
      </div>
    ))}
  </div>
);

export default StatusLegend;
