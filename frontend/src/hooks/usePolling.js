import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Generic polling hook.
 * @param {Function} fetchFn - async function to call on each poll
 * @param {Function} conditionFn - receives fetchFn result, returns true to stop polling
 * @param {number} intervalMs - polling interval in milliseconds
 * @param {number} timeoutMs - max total polling time before giving up
 * @param {boolean} enabled - whether polling is active
 */
export function usePolling(fetchFn, conditionFn, intervalMs = 3000, timeoutMs = 120000, enabled = true) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(enabled);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) {
      stopPolling();
      return;
    }

    const poll = async () => {
      try {
        const result = await fetchFn();
        if (!mountedRef.current) return;
        setData(result);
        setError(null);

        if (conditionFn(result)) {
          stopPolling();
        }
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err);
      }
    };

    // Initial fetch
    poll();

    // Set interval
    intervalRef.current = setInterval(poll, intervalMs);

    // Set timeout
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        stopPolling();
        setError(new Error('Polling timed out'));
      }
    }, timeoutMs);

    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, error, isPolling, stopPolling };
}
