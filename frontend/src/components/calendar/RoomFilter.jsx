import { useState, useEffect } from 'react';
import { FiFilter, FiChevronDown } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import roomService from '../../services/room.service';
import { translateRoom } from '../../utils/roomTranslate';

/**
 * RoomFilter — dropdown to filter calendar events by room.
 * @param {{ roomId: string, onChange: (roomId: string) => void }} props
 */
function RoomFilter({ roomId, onChange }) {
  const { t } = useTranslation();
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

  const selectedRoom = translateRoom(rooms.find((r) => r.id === roomId), t);
  const label = selectedRoom ? selectedRoom.name : t('calendar.allRooms');

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
        <span className="room-filter__label">{loading ? t('common.loading') : label}</span>
        <FiChevronDown className={`room-filter__chevron ${isOpen ? 'rotated' : ''}`} />
      </button>

      {isOpen && (
        <div className="room-filter__dropdown" role="listbox" aria-label={t('bookings.selectRoom')}>
          <button
            className={`room-filter__option ${!roomId ? 'room-filter__option--active' : ''}`}
            role="option"
            aria-selected={!roomId}
            onClick={() => handleSelect('')}
          >
            🏢 {t('calendar.allRooms')}
          </button>
          {(() => {
            const sorted = [...rooms].sort((a, b) => {
               if (a.isFavorite && !b.isFavorite) return -1;
               if (!a.isFavorite && b.isFavorite) return 1;
               return 0;
            });
            return sorted.map((rawRoom) => {
              const room = translateRoom(rawRoom, t);
              return (
                <button
                  key={room.id}
                  className={`room-filter__option ${roomId === room.id ? 'room-filter__option--active' : ''}`}
                  role="option"
                  aria-selected={roomId === room.id}
                  onClick={() => handleSelect(room.id)}
                >
                  {room.isFavorite ? '⭐' : '📍'} {room.name}
                  {room.capacity && (
                    <span className="room-filter__capacity">{room.capacity} {t('rooms.capacityUnit')}</span>
                  )}
                </button>
              );
            });
          })()}
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
