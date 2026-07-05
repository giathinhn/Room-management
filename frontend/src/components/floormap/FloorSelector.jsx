import { useTranslation } from 'react-i18next';
import './FloorSelector.css';

const FloorSelector = ({ floors, selectedFloor, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="floor-selector" role="tablist" aria-label={t('floorMap.selectFloor')}>
      <button
        id="floor-tab-all"
        className={`floor-selector__tab ${!selectedFloor ? 'floor-selector__tab--active' : ''}`}
        onClick={() => onChange(null)}
        role="tab"
        aria-selected={!selectedFloor}
      >
        <span className="floor-selector__icon">🌐</span>
        <span>{t('common.all')}</span>
      </button>

      {floors.map((floor) => (
        <button
          key={floor}
          id={`floor-tab-${floor}`}
          className={`floor-selector__tab ${selectedFloor === floor ? 'floor-selector__tab--active' : ''}`}
          onClick={() => onChange(floor)}
          role="tab"
          aria-selected={selectedFloor === floor}
        >
          <span className="floor-selector__icon">🏢</span>
          <span>{t('floorMap.floorLabel', { name: floor })}</span>
        </button>
      ))}
    </div>
  );
};

export default FloorSelector;
