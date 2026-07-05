import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { getNotificationIcon } from '../../hooks/useNotifications';

/**
 * Formats a date as a relative time string.
 * @param {string|Date} date
 */
function formatRelativeTime(date) {
  const t = i18next.t.bind(i18next);
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return t('notifications.time.justNow');
  if (diffMin < 60) return t('notifications.time.minutesAgo', { count: diffMin });
  if (diffHour < 24) return t('notifications.time.hoursAgo', { count: diffHour });
  if (diffDay === 1) return t('notifications.time.yesterday');
  if (diffDay < 7) return t('notifications.time.daysAgo', { count: diffDay });

  const locale = i18next.language === 'en' ? 'en-US' : 'vi-VN';
  return d.toLocaleDateString(locale);
}

/**
 * NotificationItem — single row in the notification list.
 *
 * @param {{ notification: object, onRead: function, onClick?: function }} props
 */
const NotificationItem = ({ notification, onRead, onClick }) => {
  const { t } = useTranslation();
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
      {!isRead && <span className="notification-item__dot" aria-label={t('notifications.unread')} />}

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
