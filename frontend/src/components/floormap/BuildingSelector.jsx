import { useTranslation } from 'react-i18next';
import './BuildingSelector.css';

const BuildingSelector = ({ buildings, selectedBuilding, onChange }) => {
  const { t } = useTranslation();
  if (!buildings || buildings.length === 0) return null;

  return (
    <div className="building-selector" role="tablist" aria-label={t('floorMap.selectBuilding')}>
      {buildings.map((building) => (
        <button
          key={building}
          id={`building-tab-${building}`}
          className={`building-selector__tab ${selectedBuilding === building ? 'building-selector__tab--active' : ''}`}
          onClick={() => onChange(building)}
          role="tab"
          aria-selected={selectedBuilding === building}
        >
          <span className="building-selector__icon">🏢</span>
          <span>{t('floorMap.buildingLabel', { name: building })}</span>
        </button>
      ))}
    </div>
  );
};

export default BuildingSelector;
