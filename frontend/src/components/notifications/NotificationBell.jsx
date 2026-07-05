import { useState, useRef, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import NotificationDropdown from './NotificationDropdown';
import './NotificationBell.css';

/**
 * NotificationBell — bell icon with unread badge and dropdown panel.
 *
 * @param {{
 *   notifications: object[],
 *   unreadCount: number,
 *   onMarkAsRead: function,
 *   onMarkAllAsRead: function,
 * }} props
 */
const NotificationBell = ({ notifications, unreadCount, onMarkAsRead, onMarkAllAsRead }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);

  const handleToggle = () => setOpen((v) => !v);
  const handleClose = () => setOpen(false);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const displayCount = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <div className="notif-bell" ref={bellRef}>
      <button
        type="button"
        className={`notif-bell__btn ${open ? 'notif-bell__btn--active' : ''}`}
        onClick={handleToggle}
        aria-label={
          unreadCount > 0
            ? t('notifications.bellAria_other', { count: displayCount })
            : t('notifications.bellAria_zero')
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        id="header-notification-bell"
      >
        <FiBell className="notif-bell__icon" />
        {unreadCount > 0 && (
          <span
            className={`notif-bell__badge ${open ? '' : 'notif-bell__badge--pulse'}`}
            aria-hidden="true"
          >
            {displayCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

export default NotificationBell;
