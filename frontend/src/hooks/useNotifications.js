import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import notificationService from '../services/notification.service';

/**
 * useNotifications — hook that manages notification state and SSE connection.
 *
 * Strategy for SSE auth: token is passed as query param ?token=xxx
 * because the browser EventSource API cannot set custom headers.
 */
function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const eventSourceRef = useRef(null);

  // ─── Fetch initial data ──────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const result = await notificationService.getAll(pageNum, 20);
      if (pageNum === 1) {
        setNotifications(result.data || []);
      } else {
        setNotifications((prev) => [...prev, ...(result.data || [])]);
      }
      setUnreadCount(result.unreadCount || 0);
      setTotalPages(result.pagination?.totalPages || 1);
      setPage(pageNum);
    } catch (_err) {
      // Silently fail — non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  // ─── SSE Connection ──────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const connectSSE = () => {
      const url = `/api/notifications/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          // Ignore heartbeat / connected events
          if (payload.event === 'connected') return;

          if (payload.event === 'notification' && payload.data) {
            const notification = payload.data;

            // Prepend to list
            setNotifications((prev) => {
              // Avoid duplicates
              if (prev.find((n) => n.id === notification.id)) return prev;
              return [notification, ...prev];
            });

            // Increment unread badge
            setUnreadCount((prev) => prev + 1);

            // Show toast
            toast(notification.title, {
              icon: getNotificationIcon(notification.type),
              duration: 4000,
            });
          }
        } catch (_parseErr) {
          // Ignore malformed SSE data
        }
      };

      es.onerror = () => {
        // Auto-reconnect after 5 seconds if connection drops
        es.close();
        setTimeout(() => {
          if (eventSourceRef.current === es) {
            connectSSE();
          }
        }, 5000);
      };
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    try {
      const result = await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      if (result.data && !result.data.isRead) {
        // Already counted — skip
      }
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (_err) {
      // Silently fail
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (_err) {
      // Silently fail
    }
  }, []);

  const fetchMore = useCallback(() => {
    if (page < totalPages && !loading) {
      fetchNotifications(page + 1);
    }
  }, [page, totalPages, loading, fetchNotifications]);

  const refresh = useCallback(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    page,
    totalPages,
    markAsRead,
    markAllAsRead,
    fetchMore,
    refresh,
  };
}

/**
 * Returns an emoji icon for a notification type.
 * @param {string} type
 */
function getNotificationIcon(type) {
  const icons = {
    booking_approved: '✅',
    booking_rejected: '❌',
    booking_cancelled: '🚫',
    booking_reminder: '⏰',
    new_booking_pending: '📋',
  };
  return icons[type] || '🔔';
}

export { getNotificationIcon };
export default useNotifications;
