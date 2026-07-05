import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * RoomFilter — search + capacity + equipment filter bar.
 *
 * Props:
 *   filters   {object}   Current filter state { search, capacity, equipment }
 *   onChange  {Function} Called with updated filters object
 */
function RoomFilter({ filters, onChange }) {
  const { t } = useTranslation();
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [showEquip,   setShowEquip]   = useState(false);
  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);

  const capacityOptions = [
    { label: t('rooms.filter.allCapacity'), value: '' },
    { label: t('rooms.filter.capacityOption1'), value: '1' },
    { label: t('rooms.filter.capacityOption2'), value: '6' },
    { label: t('rooms.filter.capacityOption3'), value: '11' },
    { label: t('rooms.filter.capacityOption4'), value: '20' },
  ];

  const equipmentOptions = [
    { value: 'Máy chiếu', icon: '📽️', label: t('rooms.equipmentOptions.projector') },
    { value: 'Micro',     icon: '🎤', label: t('rooms.equipmentOptions.microphone') },
    { value: 'Bảng trắng', icon: '📋', label: t('rooms.equipmentOptions.whiteboard') },
    { value: 'TV',        icon: '🖥️', label: t('rooms.equipmentOptions.tv') },
    { value: 'Webcam',    icon: '📷', label: t('rooms.equipmentOptions.webcam') },
    { value: 'Loa',       icon: '🔊', label: t('rooms.equipmentOptions.speaker') },
    { value: 'Điều hòa',  icon: '❄️', label: t('rooms.equipmentOptions.airConditioner') },
  ];

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
          placeholder={t('rooms.filter.searchPlaceholder')}
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
        {capacityOptions.map((opt) => (
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
          🛠️ {t('rooms.filter.equipmentTrigger')}
          {selectedEquip.length > 0 && (
            <span className="room-filter__equip-count">{selectedEquip.length}</span>
          )}
          <span className="room-filter__equip-chevron">{showEquip ? '▲' : '▼'}</span>
        </button>

        {showEquip && (
          <div className="room-filter__equip-dropdown" role="group" aria-label="Filter by equipment">
            {equipmentOptions.map(({ value, icon, label }) => (
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
                <span>{label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RoomFilter;
