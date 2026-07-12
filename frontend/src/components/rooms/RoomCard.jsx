import { useState, useEffect } from 'react';
import { FiStar } from 'react-icons/fi';
import { BsQrCode } from 'react-icons/bs';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import roomService from '../../services/room.service';
import RoomQRModal from './RoomQRModal';
import { translateRoom } from '../../utils/roomTranslate';

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
 *   onFavoriteToggle {Function} Called when favorite status changes (optional)
 */
function RoomCard({ room: rawRoom, onEdit, onDelete, onView, isAdmin, onFavoriteToggle }) {
  const { t } = useTranslation();
  const room = translateRoom(rawRoom, t);
  const [isFavorite, setIsFavorite] = useState(room.isFavorite || false);
  const [isAutoApprove, setIsAutoApprove] = useState(room.autoApprove || false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    setIsFavorite(room.isFavorite || false);
  }, [room.isFavorite]);

  useEffect(() => {
    setIsAutoApprove(room.autoApprove || false);
  }, [room.autoApprove]);

  const handleToggleAutoApprove = async (e) => {
    e.stopPropagation();
    if (toggleLoading) return;
    setToggleLoading(true);
    const newStatus = !isAutoApprove;
    try {
      await roomService.updateRoom(room.id, { autoApprove: newStatus });
      setIsAutoApprove(newStatus);
      toast.success(newStatus ? t('rooms.autoOnSuccess') : t('rooms.autoOffSuccess'));
    } catch {
      toast.error(t('rooms.autoToggleError') || 'Không thể cập nhật cấu hình tự động duyệt');
    } finally {
      setToggleLoading(false);
    }
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    const newStatus = !isFavorite;
    setIsFavorite(newStatus);
    try {
      if (newStatus) {
        await roomService.favoriteRoom(room.id);
        toast.success(t('rooms.favoriteAdded', { name: room.name }));
      } else {
        await roomService.unfavoriteRoom(room.id);
        toast.success(t('rooms.favoriteRemoved', { name: room.name }));
      }
      if (onFavoriteToggle) {
        onFavoriteToggle(room.id, newStatus);
      }
    } catch {
      setIsFavorite(!newStatus);
      toast.error(t('rooms.favoriteError'));
    }
  };

  const equipmentLabel = {
    'Máy chiếu': t('rooms.equipmentOptions.projector'),
    'Micro': t('rooms.equipmentOptions.microphone'),
    'Bảng trắng': t('rooms.equipmentOptions.whiteboard'),
    'TV': t('rooms.equipmentOptions.tv'),
    'Webcam': t('rooms.equipmentOptions.webcam'),
    'Loa': t('rooms.equipmentOptions.speaker'),
    'Điều hòa': t('rooms.equipmentOptions.airConditioner'),
  };

  return (
    <article className="room-card" id={`room-card-${room.id}`}>
      {/* Status badge */}
      {!room.isActive && (
        <span className="room-card__inactive-badge">{t('rooms.inactive')}</span>
      )}

      <div className="room-card__header">
        <div className="room-card__name-wrapper">
          <button
            type="button"
            className={`room-card__favorite-btn ${isFavorite ? 'room-card__favorite-btn--active' : ''}`}
            onClick={handleFavoriteClick}
            title={isFavorite ? t('rooms.removeFavorite') : t('rooms.addFavorite')}
          >
            <FiStar fill={isFavorite ? '#fbbf24' : 'none'} />
          </button>
          <h3 className="room-card__name">{room.name}</h3>
        </div>
        <div className="room-card__capacity-badge">
          <span className="room-card__capacity-icon">👥</span>
          <span>{room.capacity} {t('rooms.capacityUnit')}</span>
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
            <span key={item} className="room-card__equipment-badge" title={equipmentLabel[item] || item}>
              <span className="room-card__equipment-icon">
                {EQUIPMENT_ICONS[item] || '🔧'}
              </span>
              <span className="room-card__equipment-label">{equipmentLabel[item] || item}</span>
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
          {t('common.viewDetails')}
        </button>

        <button
          type="button"
          className="btn btn--sm btn--ghost"
          onClick={(e) => {
            e.stopPropagation();
            setQrOpen(true);
          }}
          title={t('rooms.viewQR')}
          style={{ padding: '0.4rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}
        >
          <BsQrCode />
        </button>

        {isAdmin && (
          <>
            <div
              id={`toggle-auto-room-${room.id}`}
              className={`room-card__auto-toggle ${isAutoApprove ? 'room-card__auto-toggle--active' : ''} ${toggleLoading ? 'loading' : ''}`}
              onClick={handleToggleAutoApprove}
              title={t('rooms.form.autoApproveHelp')}
            >
              <div className="room-card__auto-toggle-track">
                <div className="room-card__auto-toggle-thumb" />
              </div>
              <span className="room-card__auto-toggle-label">
                {isAutoApprove ? t('rooms.autoOn') : t('rooms.autoOff')}
              </span>
            </div>
            <button
              id={`edit-room-${room.id}`}
              className="btn btn--sm btn--primary"
              onClick={() => onEdit(room)}
            >
              {t('common.edit')}
            </button>
            <button
              id={`delete-room-${room.id}`}
              className="btn btn--sm btn--danger"
              onClick={() => onDelete(room)}
            >
              {t('common.delete')}
            </button>
          </>
        )}
      </div>

      {qrOpen && (
        <RoomQRModal isOpen={qrOpen} onClose={() => setQrOpen(false)} room={room} />
      )}
    </article>
  );
}

export default RoomCard;
