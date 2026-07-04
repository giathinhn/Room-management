import { useState, useEffect, useRef } from 'react';

const EQUIPMENT_OPTIONS = [
  { value: 'Máy chiếu', icon: '📽️' },
  { value: 'Micro',     icon: '🎤' },
  { value: 'Bảng trắng', icon: '📋' },
  { value: 'TV',        icon: '🖥️' },
  { value: 'Webcam',    icon: '📷' },
  { value: 'Loa',       icon: '🔊' },
  { value: 'Điều hòa',  icon: '❄️' },
];

const CAPACITY_OPTIONS = [
  { label: 'Tất cả sức chứa', value: '' },
  { label: '1 – 5 người',    value: '1'  },
  { label: '6 – 10 người',   value: '6'  },
  { label: '11 – 20 người',  value: '11' },
  { label: '20+ người',      value: '20' },
];

/**
 * RoomFilter — search + capacity + equipment filter bar.
 *
 * Props:
 *   filters   {object}   Current filter state { search, capacity, equipment }
 *   onChange  {Function} Called with updated filters object
 */
function RoomFilter({ filters, onChange }) {
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [showEquip,   setShowEquip]   = useState(false);
  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync localSearch when parent resets filters
  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  // Debounce search input 300 ms
  function handleSearchChange(e) {
    const val = e.target.value;
    setLocalSearch(val);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange({ ...filters, search: val, page: 1 });
    }, 300);
  }

  function handleCapacityChange(e) {
    onChange({ ...filters, capacity: e.target.value, page: 1 });
  }

  function handleEquipmentToggle(item) {
    const current = filters.equipment || [];
    const next = current.includes(item)
      ? current.filter((e) => e !== item)
      : [...current, item];
    onChange({ ...filters, equipment: next, page: 1 });
  }

  // Close equipment dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowEquip(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedEquip = filters.equipment || [];

  return (
    <div className="room-filter">
      {/* Search */}
      <div className="room-filter__search-wrapper">
        <span className="room-filter__search-icon">🔍</span>
        <input
          id="room-search-input"
          type="text"
          className="room-filter__search"
          placeholder="Tìm kiếm phòng họp…"
          value={localSearch}
          onChange={handleSearchChange}
        />
        {localSearch && (
          <button
            className="room-filter__search-clear"
            onClick={() => {
              setLocalSearch('');
              onChange({ ...filters, search: '', page: 1 });
            }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Capacity select */}
      <select
        id="room-capacity-filter"
        className="room-filter__select"
        value={filters.capacity || ''}
        onChange={handleCapacityChange}
      >
        {CAPACITY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Equipment dropdown */}
      <div className="room-filter__equip-wrapper" ref={dropdownRef}>
        <button
          id="room-equipment-filter-btn"
          className={`room-filter__equip-btn${selectedEquip.length > 0 ? ' active' : ''}`}
          onClick={() => setShowEquip((prev) => !prev)}
        >
          🛠️ Thiết bị
          {selectedEquip.length > 0 && (
            <span className="room-filter__equip-count">{selectedEquip.length}</span>
          )}
          <span className="room-filter__equip-chevron">{showEquip ? '▲' : '▼'}</span>
        </button>

        {showEquip && (
          <div className="room-filter__equip-dropdown" role="group" aria-label="Filter by equipment">
            {EQUIPMENT_OPTIONS.map(({ value, icon }) => (
              <label
                key={value}
                className={`room-filter__equip-option${selectedEquip.includes(value) ? ' selected' : ''}`}
                htmlFor={`filter-equip-${value}`}
              >
                <input
                  id={`filter-equip-${value}`}
                  type="checkbox"
                  checked={selectedEquip.includes(value)}
                  onChange={() => handleEquipmentToggle(value)}
                  className="room-filter__equip-checkbox"
                />
                <span>{icon}</span>
                <span>{value}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Favorite Filter */}
      <label className="room-filter__fav-toggle" htmlFor="room-fav-filter">
        <input
          id="room-fav-filter"
          type="checkbox"
          checked={filters.onlyFavorites || false}
          onChange={(e) => onChange({ ...filters, onlyFavorites: e.target.checked, page: 1 })}
          className="room-fav-checkbox"
        />
        <span className="room-fav-toggle-star">⭐</span>
        <span className="room-fav-toggle-text">Chỉ xem phòng yêu thích</span>
      </label>
    </div>
  );
}

export default RoomFilter;
