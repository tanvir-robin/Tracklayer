import { useEffect, useRef, useCallback } from 'react';

// Derive WebSocket URL from the same host/port as the REST API so it works
// in both local dev (4003) and production without changing this file.
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4003';
const WS_URL = API_BASE.replace(/^http/, 'ws') + '/ws';

/**
 * useEventStream(onEvent)
 * Opens a WebSocket connection authenticated with the stored JWT.
 * Calls onEvent(data) for every incoming event message.
 * Auto-reconnects on unexpected close.
 */
const MAX_RETRIES = 5;

export function useEventStream(onEvent) {
  const wsRef = useRef(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const reconnectTimer = useRef(null);
  const retryCount = useRef(0);

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected');
      retryCount.current = 0;
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'event') onEventRef.current(data);
      } catch { /* ignore */ }
    };

    ws.onclose = (e) => {
      // Don't reconnect on auth failure (1008), intentional close (1000), or too many retries
      if (e.code === 1008 || e.code === 1000) return;
      if (retryCount.current >= MAX_RETRIES) {
        console.warn('[WS] Max retries reached, giving up');
        return;
      }
      retryCount.current += 1;
      const delay = Math.min(3000 * retryCount.current, 30000);
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close(1000);
    };
  }, [connect]);
}
