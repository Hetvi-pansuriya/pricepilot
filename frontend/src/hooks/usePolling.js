/**
 * hooks/usePolling.js — A custom React hook for periodic data fetching.
 *
 * PURPOSE: Automatically calls an async function every N milliseconds
 * until a stop condition is met or a timeout is reached.
 *
 * WHY USE THIS (instead of useEffect with setInterval)?
 *   This hook encapsulates all the complexity of polling:
 *   - Starts immediately on mount (first call is synchronous, not delayed).
 *   - Cleans up the interval and timeout when the component unmounts.
 *   - Handles async fetch functions properly (avoids overlapping calls).
 *   - Stops automatically when the condition is satisfied.
 *   - Exposes data, error, and timedOut state for the consumer.
 *
 * CONNECTED TO:
 *   - AnalysisWaiting.jsx → polls /analysis/history every 3s to check if analysis completed
 *   - History.jsx         → may use this to refresh history list
 *
 * PARAMETERS:
 *   fetchFn     → async function: the API call to make. Example: () => getHistory(companyId)
 *   conditionFn → function: receives the fetched data, return true to STOP polling.
 *                 Example: (data) => data.status === "completed"
 *   interval    → milliseconds between polls. Default: 3000 (3 seconds).
 *   timeout     → max total polling time before giving up. Default: 120000 (2 minutes).
 *
 * RETURNS: { data, error, timedOut }
 *   data    → the latest response from fetchFn (undefined until first fetch completes)
 *   error   → the last error thrown by fetchFn (undefined if no errors)
 *   timedOut→ boolean — true if polling exceeded the timeout duration
 */

// useEffect: React hook for side effects (network calls, timers, event listeners).
// Runs after each render. Returns a cleanup function to stop timers on unmount.
// useState: React hook for reactive state (data, error, timedOut).
import { useEffect, useState } from "react";

// usePolling: the exported custom hook.
// Custom hooks must start with "use" — React's naming convention for hooks.
// Parameters with defaults: interval=3000, timeout=120000 → caller can override these.
export default function usePolling(
  fetchFn,            // async function to call on each poll cycle
  conditionFn,        // stop condition function (receives latest data, returns boolean)
  interval = 3000,    // poll every 3 seconds by default
  timeout = 120000,   // stop after 2 minutes by default
) {
  // data: the latest response from fetchFn.
  // undefined initially — components should handle the loading state when data is undefined.
  const [data, setData] = useState();

  // error: the last error from fetchFn.
  // undefined if no errors have occurred yet.
  const [error, setError] = useState();

  // timedOut: becomes true if the polling exceeds the timeout limit.
  // Used by the component to show a "this is taking too long" message.
  const [timedOut, setTimedOut] = useState(false);

  // useEffect: runs after the component mounts (and when any dependency changes).
  // The returned cleanup function runs when the component unmounts OR deps change.
  useEffect(() => {
    // active: flag to prevent state updates after the component unmounts.
    // WHY? If fetchFn is slow, the component might unmount before it resolves.
    // Without this guard, setState on an unmounted component causes React warnings.
    let active = true;

    // iv: the setInterval ID — stored so we can cancel it later.
    let iv;

    // to: the setTimeout ID — stored so we can cancel it when polling stops early.
    let to;

    // run: the async function called on each poll cycle.
    const run = async () => {
      try {
        // Call the fetch function (e.g., getHistory(companyId)).
        // await → wait for the async API call to complete.
        const d = await fetchFn();

        // Guard: if the component unmounted while we were waiting, do nothing.
        // "if (!active) return;" prevents setState on unmounted component.
        if (!active) return;

        // Update the data state with the latest response.
        // This triggers a re-render so the component shows fresh data.
        setData(d);

        // Check if the stop condition is met with the new data.
        // conditionFn(d): the caller defines when to stop.
        // Example: (data) => data?.status === "completed" → stops when analysis is done.
        if (conditionFn(d)) {
          clearInterval(iv);  // stop the periodic polling
          clearTimeout(to);   // cancel the timeout (no longer needed)
          // Note: we DON'T clear "active" here — cleanup function handles that.
        }
      } catch (e) {
        // Fetch failed (network error, 404, 401, etc.)
        // Only update error state if component is still mounted.
        if (active) setError(e);
        // We don't stop polling on error — transient network issues should self-resolve.
      }
    };

    // Start immediately: call run() once right away (don't wait for first interval).
    // WHY? If interval is 3000ms, without this the user waits 3s for the first data.
    run();

    // Start the interval: call run() every `interval` milliseconds.
    // setInterval(callback, ms) → calls callback repeatedly until clearInterval().
    iv = setInterval(run, interval);

    // Start the timeout: if polling hasn't stopped after `timeout` ms, give up.
    to = setTimeout(() => {
      if (active) {
        setTimedOut(true);   // signal to the consumer that we've given up
        clearInterval(iv);   // stop the interval (no more polling)
        // The component can show: "Analysis is taking longer than expected..."
      }
    }, timeout);

    // Cleanup function: called when component unmounts or dependencies change.
    // This is CRITICAL — without cleanup, the interval keeps running even after
    // the component is gone, causing memory leaks and state-on-unmounted-component errors.
    return () => {
      active = false;        // prevent state updates in any pending async operations
      clearInterval(iv);     // stop the polling interval
      clearTimeout(to);      // cancel the timeout
    };
  }, [fetchFn, conditionFn, interval, timeout]);
  // Dependency array: re-run the effect if any of these change.
  // If the caller passes a new fetchFn (e.g., different companyId), polling restarts.
  // WHY include all params? If they changed, old polling is stale — restart with new params.

  // Return the three pieces of state the consumer needs:
  // data → latest API response (undefined until first fetch)
  // error → last error (undefined if no errors)
  // timedOut → true if polling exceeded timeout
  return { data, error, timedOut };
}
