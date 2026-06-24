import { useNavigate } from 'react-router-dom';
import { getNotificationIcon } from '../../hooks/useNotifications';

/**
 * Formats a date as a relative time string in Vietnamese.
 * e.g. "2 phút trước", "1 giờ trước", "Hôm qua"
 * @param {string|Date} date
 */
function formatRelativeTime(date) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay === 1) return 'Hôm qua';
  if (diffDay < 7) return `${diffDay} ngày trước`;

  return d.toLocaleDateString('vi-VN');
}

/**
 * NotificationItem — single row in the notification list.
 *
 * @param {{ notification: object, onRead: function, onClick?: function }} props
 */
const NotificationItem = ({ notification, onRead, onClick }) => {
  const navigate = useNavigate();
  const { id, type, title, message, isRead, createdAt, bookingId } = notification;

  const handleClick = async () => {
    if (!isRead) {
      await onRead(id);
    }
    if (bookingId) {
      navigate(`/bookings/${bookingId}`);
    }
    if (onClick) onClick();
  };

  return (
    <button
      type="button"
      className={`notification-item ${!isRead ? 'notification-item--unread' : ''}`}
      onClick={handleClick}
      id={`notification-item-${id}`}
    >
      {/* Unread dot */}
      {!isRead && <span className="notification-item__dot" aria-label="Chưa đọc" />}

      {/* Icon */}
      <span className="notification-item__icon" aria-hidden="true">
        {getNotificationIcon(type)}
      </span>

      {/* Content */}
      <div className="notification-item__body">
        <p className="notification-item__title">{title}</p>
        <p className="notification-item__message">{message}</p>
        <span className="notification-item__time">{formatRelativeTime(createdAt)}</span>
      </div>
    </button>
  );
};

export { formatRelativeTime };
export default NotificationItem;
