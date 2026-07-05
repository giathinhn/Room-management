import { useTranslation } from 'react-i18next';
import './StatusLegend.css';

const StatusLegend = () => {
  const { t } = useTranslation();

  const legendItems = [
    { status: 'available', label: t('floorMap.available'), dotClass: 'legend-dot--available' },
    { status: 'in_use',   label: t('floorMap.inUse'), dotClass: 'legend-dot--in-use' },
    { status: 'upcoming', label: t('floorMap.upcomingLegend'), dotClass: 'legend-dot--upcoming' },
  ];

  return (
    <div className="status-legend" role="note" aria-label={t('floorMap.statusLegend')}>
      {legendItems.map(({ status, label, dotClass }) => (
        <div key={status} className="status-legend__item">
          <span className={`status-legend__dot ${dotClass}`} />
          <span className="status-legend__label">{label}</span>
        </div>
      ))}
    </div>
  );
};

export default StatusLegend;
