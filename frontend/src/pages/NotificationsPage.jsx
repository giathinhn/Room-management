import { useEffect } from 'react';
import { FiBell, FiCheckCircle, FiLoader } from 'react-icons/fi';
import useNotifications, { getNotificationIcon } from '../hooks/useNotifications';
import { formatRelativeTime, translateNotification } from '../components/notifications/NotificationItem';
import { translateRoom } from '../utils/roomTranslate';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const { t } = useTranslation();
  const {
    notifications,
    unreadCount,
    loading,
    page,
    totalPages,
    markAsRead,
    markAllAsRead,
    fetchMore,
    refresh,
  } = useNotifications();
  const navigate = useNavigate();

  // Refresh on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleItemClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.bookingId) {
      navigate(`/bookings/${notification.bookingId}`);
    }
  };

  return (
    <div className="notifications-page">
      {/* Page Header */}
      <div className="notifications-page__header">
        <div className="notifications-page__title-group">
          <div className="notifications-page__icon-wrap">
            <FiBell />
          </div>
          <div>
            <h1 className="notifications-page__title">{t('notifications.title')}</h1>
            <p className="notifications-page__subtitle">
              {unreadCount > 0
                ? t('notifications.unreadCount', { count: unreadCount })
                : t('notifications.allRead')}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            className="notifications-page__mark-all-btn"
            onClick={markAllAsRead}
            id="notifications-page-mark-all-btn"
          >
            <FiCheckCircle />
            {t('notifications.markAllReadLong')}
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="notifications-page__content">
        {notifications.length === 0 && !loading ? (
          <div className="notifications-page__empty">
            <div className="notifications-page__empty-icon">🔕</div>
            <h3>{t('notifications.noNotifications')}</h3>
            <p>{t('notifications.noNotificationsDesc')}</p>
          </div>
        ) : (
          <div className="notifications-page__list">
            {notifications.map((n) => {
              const { title, message } = translateNotification(n, t);
              const room = n.booking?.room ? translateRoom(n.booking.room, t) : null;
              return (
                <button
                  key={n.id}
                  type="button"
                  className={`notifications-page__item ${!n.isRead ? 'notifications-page__item--unread' : ''}`}
                  onClick={() => handleItemClick(n)}
                  id={`notifications-page-item-${n.id}`}
                >
                  {!n.isRead && <span className="notifications-page__item-dot" />}

                  <span className="notifications-page__item-icon">
                    {getNotificationIcon(n.type)}
                  </span>

                  <div className="notifications-page__item-body">
                    <div className="notifications-page__item-header">
                      <p className="notifications-page__item-title">{title}</p>
                      <span className="notifications-page__item-time">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="notifications-page__item-message">{message}</p>
                    {room && (
                      <span className="notifications-page__item-room">
                        📍 {room.name}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Loading spinner */}
        {loading && (
          <div className="notifications-page__loading">
            <FiLoader className="spin" />
            <span>{t('common.loading')}</span>
          </div>
        )}

        {/* Load more button */}
        {!loading && page < totalPages && (
          <div className="notifications-page__load-more">
            <button
              type="button"
              className="notifications-page__load-more-btn"
              onClick={fetchMore}
              id="notifications-page-load-more-btn"
            >
              {t('notifications.loadMore')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
