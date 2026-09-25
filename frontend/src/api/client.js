/**
 * client.js — The central Axios HTTP client for all API calls.
 *
 * PURPOSE:
 *   Creates a pre-configured Axios instance that ALL other api/*.js files use
 *   for making HTTP requests to the PricePilot backend.
 *
 * WHAT IT DOES AUTOMATICALLY (via interceptors):
 *   1. REQUEST: Reads the JWT token from localStorage and adds it to every request
 *               as "Authorization: Bearer <token>" header.
 *   2. RESPONSE: If a 401 (Unauthorized) is received, clears the token and
 *                redirects to /login (session expired or tampered).
 *   3. ERROR: Normalizes all error responses into a simple {detail: "message"} shape
 *             so all catch blocks work the same way.
 *
 * CONNECTED TO:
 *   - auth.js, companies.js, competitors.js, analysis.js, tiers.js, features.js
 *     all import this as their HTTP client.
 *   - VITE_API_URL in .env.local → sets the backend base URL.
 *   - auth.py backend → 401 status triggers auto-logout here.
 */

// axios: the HTTP client library. Better than fetch() for:
//   - Automatic JSON parsing (no response.json() needed)
//   - Request/response interceptors
//   - Better error handling
//   - Consistent API across environments
import axios from "axios";

// axios.create(): creates a new Axios instance with shared configuration.
// baseURL: the backend API base URL, read from Vite environment variable.
// import.meta.env.VITE_API_URL → reads VITE_API_URL from .env.local file.
// Example value: "http://localhost:8000" (development) or "https://api.pricepilot.io" (production).
// WHY not hardcode the URL? Different environments (dev/staging/prod) have different backend URLs.
// All requests become: baseURL + path. E.g., baseURL="http://localhost:8000" + "/auth/login".
const client = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// ── REQUEST INTERCEPTOR ────────────────────────────────────────────────────────
// Runs on EVERY outgoing HTTP request BEFORE it's sent.
// Purpose: automatically inject the JWT token into the Authorization header.
// WHY? Without this, every API call would need to manually add the token header.
// With this, all api/*.js functions just call client.get/post/put — auth is automatic.
client.interceptors.request.use((c) => {
  // Read the JWT token stored after login/signup.
  // localStorage.getItem("token") → returns the JWT string or null if not logged in.
  // CONNECTED TO: AuthContext.jsx saves the token here on login.
  const t = localStorage.getItem("token");

  // If a token exists, add it to the request headers.
  // "Authorization: Bearer eyJhbGc..." → standard HTTP authentication header format.
  // The backend's get_current_user() in auth.py reads this header to identify the user.
  if (t) c.headers.Authorization = `Bearer ${t}`;

  // MUST return the config object — Axios uses this to make the actual request.
  return c;
});

// ── RESPONSE INTERCEPTOR ──────────────────────────────────────────────────────
// Two handlers: (successHandler, errorHandler)
// successHandler (r) => r: for successful responses (2xx), just pass them through unchanged.
// errorHandler: for error responses (4xx, 5xx), transform and handle them.
client.interceptors.response.use(
  // SUCCESS: pass the response through as-is.
  // All api/*.js files then access r.data to get the parsed JSON.
  (r) => r,

  // ERROR: transform all errors into a consistent shape and handle 401 specially.
  (e) => {
    // Check for 401 Unauthorized — but NOT for auth endpoints themselves.
    // !e.config?.url?.startsWith("/auth/") → ignore 401 from /auth/login (wrong password)
    //   so the login page can show "wrong password" instead of redirecting to /login.
    // e.response?.status === 401 → token is expired or invalid (not wrong password).
    if (e.response?.status === 401 && !e.config?.url?.startsWith("/auth/")) {
      // Token is expired/invalid and this isn't an auth endpoint.
      // Clear the stored token — it's no longer valid.
      localStorage.removeItem("token");
      // Hard redirect to the login page. window.location.assign() causes a full page reload
      // (unlike React Router navigation) which clears all React state cleanly.
      window.location.assign("/login");
    }

    // Normalize the error into a consistent {detail: "message"} object.
    // e.response?.data?.detail → the error message from FastAPI's HTTPException.detail.
    // e.message → Axios network error (e.g., "Network Error" if backend is down).
    // "Something went wrong" → final fallback if no message is available.
    // Promise.reject() → passes the error to the .catch() in the calling code.
    return Promise.reject({
      detail: e.response?.data?.detail || e.message || "Something went wrong",
    });
  },
);

// Export the configured client for use in all api/*.js modules.
// Usage: import client from "./client"; client.get("/some/endpoint")
export default client;
