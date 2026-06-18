const EQUIPMENT_ICONS = {
  'Máy chiếu': '📽️',
  'Micro': '🎤',
  'Bảng trắng': '📋',
  'TV': '🖥️',
  'Webcam': '📷',
  'Loa': '🔊',
  'Điều hòa': '❄️',
};

export { EQUIPMENT_ICONS };

/**
 * RoomCard component — displays a single room in card grid layout.
 *
 * Props:
 *   room     {object}   Room data from API
 *   onEdit   {Function} Called when admin clicks Edit (optional)
 *   onDelete {Function} Called when admin clicks Delete (optional)
 *   onView   {Function} Called when user clicks View detail
 *   isAdmin  {boolean}  Show admin controls
 */
function RoomCard({ room, onEdit, onDelete, onView, isAdmin }) {
  return (
    <article className="room-card" id={`room-card-${room.id}`}>
      {/* Status badge */}
      {!room.isActive && (
        <span className="room-card__inactive-badge">Không hoạt động</span>
      )}

      <div className="room-card__header">
        <h3 className="room-card__name">{room.name}</h3>
        <div className="room-card__capacity-badge">
          <span className="room-card__capacity-icon">👥</span>
          <span>{room.capacity} người</span>
        </div>
      </div>

      <div className="room-card__location">
        <span className="room-card__location-icon">📍</span>
        <span>{room.location}</span>
      </div>

      {/* Equipment badges */}
      {room.equipment && room.equipment.length > 0 && (
        <div className="room-card__equipment">
          {room.equipment.map((item) => (
            <span key={item} className="room-card__equipment-badge" title={item}>
              <span className="room-card__equipment-icon">
                {EQUIPMENT_ICONS[item] || '🔧'}
              </span>
              <span className="room-card__equipment-label">{item}</span>
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="room-card__actions">
        <button
          id={`view-room-${room.id}`}
          className="btn btn--sm btn--ghost"
          onClick={() => onView(room.id)}
        >
          Xem chi tiết
        </button>

        {isAdmin && (
          <>
            <button
              id={`edit-room-${room.id}`}
              className="btn btn--sm btn--primary"
              onClick={() => onEdit(room)}
            >
              Sửa
            </button>
            <button
              id={`delete-room-${room.id}`}
              className="btn btn--sm btn--danger"
              onClick={() => onDelete(room)}
            >
              Xóa
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export default RoomCard;
