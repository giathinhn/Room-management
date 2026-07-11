import { useEffect, useRef } from 'react';

/**
 * useSSEEvent — Hook that listens to CustomEvents dispatched by the SSE connection.
 * Uses a ref to store the callback so the event listener does not re-bind on every render,
 * even if the callback is not memoized.
 *
 * @param {string} eventName Tên sự kiện (ví dụ: 'bookings_changed', 'rooms_changed')
 * @param {Function} callback Hàm callback chạy khi sự kiện xảy ra
 */
export default function useSSEEvent(eventName, callback) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = (event) => {
      if (callbackRef.current) {
        callbackRef.current(event.detail);
      }
    };
    window.addEventListener(eventName, handler);
    return () => {
      window.removeEventListener(eventName, handler);
    };
  }, [eventName]);
}
