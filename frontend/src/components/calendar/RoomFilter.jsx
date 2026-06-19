import { useState, useEffect } from 'react';
import { FiFilter, FiChevronDown } from 'react-icons/fi';
import roomService from '../../services/room.service';

/**
 * RoomFilter — dropdown to filter calendar events by room.
 * @param {{ roomId: string, onChange: (roomId: string) => void }} props
 */
function RoomFilter({ roomId, onChange }) {
  const [rooms, setRooms] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const res = await roomService.getRooms({ limit: 100 });
        setRooms(res.data || []);
      } catch {
        // silently ignore
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const selectedRoom = rooms.find((r) => r.id === roomId);
  const label = selectedRoom ? selectedRoom.name : 'Tất cả phòng';

  const handleSelect = (id) => {
    onChange(id);
    setIsOpen(false);
  };

  return (
    <div className="room-filter">
      <button
        id="room-filter-btn"
        className={`room-filter__trigger ${isOpen ? 'room-filter__trigger--open' : ''}`}
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <FiFilter className="room-filter__icon" />
        <span className="room-filter__label">{loading ? 'Đang tải...' : label}</span>
        <FiChevronDown className={`room-filter__chevron ${isOpen ? 'rotated' : ''}`} />
      </button>

      {isOpen && (
        <div className="room-filter__dropdown" role="listbox" aria-label="Chọn phòng">
          <button
            className={`room-filter__option ${!roomId ? 'room-filter__option--active' : ''}`}
            role="option"
            aria-selected={!roomId}
            onClick={() => handleSelect('')}
          >
            🏢 Tất cả phòng
          </button>
          {rooms.map((room) => (
            <button
              key={room.id}
              className={`room-filter__option ${roomId === room.id ? 'room-filter__option--active' : ''}`}
              role="option"
              aria-selected={roomId === room.id}
              onClick={() => handleSelect(room.id)}
            >
              📍 {room.name}
              {room.capacity && (
                <span className="room-filter__capacity">{room.capacity} người</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Click-outside backdrop */}
      {isOpen && (
        <div
          className="room-filter__backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default RoomFilter;
