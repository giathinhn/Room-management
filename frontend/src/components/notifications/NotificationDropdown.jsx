import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NotificationItem from './NotificationItem';
import './NotificationDropdown.css';

/**
 * NotificationDropdown — popup panel showing recent notifications.
 *
 * @param {{
 *   notifications: object[],
 *   unreadCount: number,
 *   onMarkAsRead: function,
 *   onMarkAllAsRead: function,
 *   onClose: function,
 * }} props
 */
const NotificationDropdown = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}) => {
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Show max 5 recent notifications in dropdown
  const recent = notifications.slice(0, 5);

  return (
    <div
      className="notif-dropdown"
      ref={dropdownRef}
      role="dialog"
      aria-label="Thông báo"
      id="notification-dropdown"
    >
      {/* Header */}
      <div className="notif-dropdown__header">
        <h3 className="notif-dropdown__title">
          Thông báo
          {unreadCount > 0 && (
            <span className="notif-dropdown__count">{unreadCount}</span>
          )}
        </h3>
        {unreadCount > 0 && (
          <button
            type="button"
            className="notif-dropdown__mark-all"
            onClick={onMarkAllAsRead}
            id="notification-mark-all-btn"
          >
            Đọc tất cả
          </button>
        )}
      </div>

      {/* List */}
      <div className="notif-dropdown__list">
        {recent.length === 0 ? (
          <div className="notif-dropdown__empty">
            <span className="notif-dropdown__empty-icon">🔕</span>
            <p>Không có thông báo</p>
          </div>
        ) : (
          recent.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onRead={onMarkAsRead}
              onClick={onClose}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="notif-dropdown__footer">
        <Link
          to="/notifications"
          className="notif-dropdown__view-all"
          onClick={onClose}
          id="notification-view-all-link"
        >
          Xem tất cả thông báo
        </Link>
      </div>
    </div>
  );
};

export default NotificationDropdown;
