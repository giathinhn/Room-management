import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { getNotificationIcon } from '../../hooks/useNotifications';
import { translateRoom } from '../../utils/roomTranslate';

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
 * Dynamically translates the title and message of a notification.
 * @param {object} notification
 * @param {function} t
 */
export function translateNotification(notification, t) {
  const { type, title: dbTitle, message: dbMessage, booking } = notification;

  if (!booking) return { title: dbTitle, message: dbMessage };

  const locale = i18next.language === 'en' ? 'en-US' : 'vi-VN';
  const roomName = booking.room ? translateRoom(booking.room, t).name : '';
  const startLabel = booking.startTime
    ? new Date(booking.startTime).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })
    : '';

  // 1. Title translation
  const translatedTitle = t(`notifications.types.${type}`) !== `notifications.types.${type}`
    ? t(`notifications.types.${type}`)
    : dbTitle;

  // 2. Message translation
  let translatedMessage = dbMessage;
  if (type === 'new_booking_pending') {
    translatedMessage = t('notifications.messages.new_booking_pending', {
      title: booking.title,
      room: roomName,
      time: startLabel
    });
  } else if (type === 'booking_approved') {
    translatedMessage = t('notifications.messages.booking_approved', {
      title: booking.title,
      room: roomName,
      time: startLabel
    });
  } else if (type === 'booking_rejected') {
    const rawReason = dbMessage.includes('Lý do: ')
      ? dbMessage.split('Lý do: ')[1]
      : (dbMessage.includes('Ly do: ') ? dbMessage.split('Ly do: ')[1] : '');
    const reason = rawReason
      ? t('notifications.messages.reasonLabel', { reason: rawReason.trim() })
      : t('notifications.messages.noReason');
    translatedMessage = t('notifications.messages.booking_rejected', {
      title: booking.title,
      room: roomName,
      time: startLabel,
      reason
    });
  } else if (type === 'booking_cancelled') {
    const isAuto = dbMessage.includes('tự động') || dbMessage.includes('tu dong') || dbMessage.includes('auto');
    if (isAuto) {
      translatedMessage = t('notifications.messages.booking_cancelled_auto', {
        title: booking.title,
        room: roomName
      });
    } else {
      translatedMessage = t('notifications.messages.booking_cancelled_admin', {
        title: booking.title,
        room: roomName,
        time: startLabel
      });
    }
  }

  return { title: translatedTitle, message: translatedMessage };
}

/**
 * NotificationItem — single row in the notification list.
 *
 * @param {{ notification: object, onRead: function, onClick?: function }} props
 */
const NotificationItem = ({ notification, onRead, onClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id, type, isRead, createdAt, bookingId } = notification;
  const { title, message } = translateNotification(notification, t);

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
