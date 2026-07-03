import './BuildingSelector.css';

const BuildingSelector = ({ buildings, selectedBuilding, onChange }) => {
  if (!buildings || buildings.length === 0) return null;

  return (
    <div className="building-selector" role="tablist" aria-label="Chọn tòa nhà">
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
          <span>Tòa {building}</span>
        </button>
      ))}
    </div>
  );
};

export default BuildingSelector;
