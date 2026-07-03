import './FloorSelector.css';

const FloorSelector = ({ floors, selectedFloor, onChange }) => (
  <div className="floor-selector" role="tablist" aria-label="Chọn tầng">
    <button
      id="floor-tab-all"
      className={`floor-selector__tab ${!selectedFloor ? 'floor-selector__tab--active' : ''}`}
      onClick={() => onChange(null)}
      role="tab"
      aria-selected={!selectedFloor}
    >
      <span className="floor-selector__icon">🌐</span>
      <span>Tất cả</span>
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
        <span>Tầng {floor}</span>
      </button>
    ))}
  </div>
);

export default FloorSelector;
