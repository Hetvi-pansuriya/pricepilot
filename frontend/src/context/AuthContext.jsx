/**
 * context/AuthContext.jsx — Global Authentication State Provider.
 *
 * PURPOSE: Manages the user's authentication state across the entire React app.
 * Provides login, signup, logout, and deleteAccount actions to any component.
 *
 * HOW IT WORKS:
 *   - React Context: creates a shared "store" for auth data (token, email, isAuthenticated).
 *   - AuthProvider: wraps the whole app (in main.jsx) so all components can access the context.
 *   - useAuth(): a custom hook — any component calls this to get auth state and actions.
 *   - localStorage: persists the token so users stay logged in after page refresh.
 *
 * CONNECTED TO:
 *   - main.jsx        → AuthProvider wraps the entire app tree
 *   - App.jsx         → useAuth() reads isAuthenticated for root redirect
 *   - ProtectedRoute  → useAuth() checks isAuthenticated to guard routes
 *   - Login.jsx       → calls auth.login(email, password)
 *   - Signup.jsx      → calls auth.signup(email, password)
 *   - ProfileSettings → calls auth.logout() and auth.deleteAccount()
 *   - api/auth.js     → login() and signup() functions used here
 */

// createContext: creates a React context object — the "channel" for sharing state.
// useContext: reads the current value of a context (used in useAuth hook).
// useMemo: memoizes the context value to prevent unnecessary re-renders.
// useState: creates reactive state variables (token, email).
import { createContext, useContext, useMemo, useState } from "react";

// Import all auth API functions as a namespace.
// * as api → imports {login, signup, deleteAccount} under the "api" prefix.
// CONNECTED TO: api/auth.js
import * as api from "../api/auth";

// C: the React Context object. Initial value is null (no auth before the Provider mounts).
// Named "C" (short) because it's only used within this file — consumers use useAuth() instead.
const C = createContext(null);

// useAuth: the custom hook that any component uses to access auth state.
// Usage: const { isAuthenticated, login, logout } = useAuth();
// useContext(C) → reads the current value from the nearest AuthProvider in the component tree.
// WHY a custom hook? Hides the implementation detail (context object C) from consumers.
// If we ever change the context structure, we only update this file — not every consumer.
export const useAuth = () => useContext(C);

// AuthProvider: the component that provides auth state to all its children.
// { children }: the prop that represents everything wrapped inside <AuthProvider>.
// Used in main.jsx as: <AuthProvider><App /></AuthProvider>
export function AuthProvider({ children }) {
  // token: the JWT access token string (or null if not logged in).
  // useState(localStorage.getItem("token")): initialize from localStorage on first load.
  // WHY localStorage? localStorage persists across page refreshes — user stays logged in.
  // If localStorage has a token → user is already logged in (from a previous session).
  const [token, setToken] = useState(localStorage.getItem("token"));

  // email: the user's email address — shown in the UI (e.g., ProfileSettings header).
  // || "": default to empty string if not stored (first visit or after logout).
  const [email, setEmail] = useState(localStorage.getItem("email") || "");

  // auth: the internal helper that handles both login and signup.
  // WHY combine login + signup? Both do exactly the same things after the API call:
  //   1. Store the token in localStorage.
  //   2. Store the email in localStorage.
  //   3. Update the React state (triggers re-render with new auth data).
  // Parameters:
  //   fn → the API function to call (api.login or api.signup)
  //   e  → email string
  //   p  → password string
  const auth = async (fn, e, p) => {
    // Call the API function (login or signup).
    // d = response data: {access_token: "eyJ...", token_type: "bearer"}
    const d = await fn(e, p);

    // Persist token to localStorage — survives page refresh and browser close.
    // If localStorage is cleared (logout/deleteAccount), the user will be logged out on next visit.
    localStorage.setItem("token", d.access_token);

    // Persist email for display purposes (not used for authentication — only the token is).
    localStorage.setItem("email", e);

    // Update React state → triggers re-render, updating isAuthenticated and email display.
    setToken(d.access_token);
    setEmail(e);
  };

  // value: the object exposed to all consumers via useAuth().
  // useMemo: only recomputes when token or email changes.
  // WHY useMemo? The value object is recreated on every render without memoization.
  //   If the value reference changes every render, all useAuth() consumers re-render unnecessarily.
  //   Memoizing keeps the reference stable → fewer re-renders → better performance.
  const value = useMemo(
    () => ({
      // token: the raw JWT string (consumers rarely need this directly).
      token,

      // email: the logged-in user's email for display.
      email,

      // isAuthenticated: boolean — true if a token exists.
      // !!token converts the token string to boolean (null/undefined → false, string → true).
      // Used by: App.jsx for root redirect, ProtectedRoute for auth guard.
      isAuthenticated: !!token,

      // login: triggers api.login(email, password) and stores the result.
      // (e, p) → email and password.
      // CONNECTED TO: Login.jsx calls: auth.login(email, password)
      login: (e, p) => auth(api.login, e, p),

      // signup: triggers api.signup(email, password) and stores the result.
      // CONNECTED TO: Signup.jsx calls: auth.signup(email, password)
      signup: (e, p) => auth(api.signup, e, p),

      // logout: clears all local storage and resets state.
      // localStorage.clear() → removes token, email, and any other stored keys.
      // setToken(null) → isAuthenticated becomes false → ProtectedRoute redirects to /login.
      // CONNECTED TO: ProfileSettings.jsx and NavBar logout button call this.
      logout: () => {
        localStorage.clear(); // remove all stored data (token, email, any cached data)
        setToken(null);       // update React state → triggers re-render
        setEmail("");         // clear displayed email
      },

      // deleteAccount: calls the backend DELETE /auth/account, then logs out.
      // WHY async? api.deleteAccount() is an async API call — must be awaited.
      // The backend deletes the user + all their data, then we clear the frontend state.
      // CONNECTED TO: ProfileSettings.jsx calls auth.deleteAccount() on confirm.
      deleteAccount: async () => {
        await api.deleteAccount(); // DELETE /auth/account (backend deletes user + CASCADE)
        localStorage.clear();      // clear all local state
        setToken(null);            // update React state → logout
        setEmail("");
      },
    }),
    // Dependency array: only recompute value when token or email changes.
    // This is the key optimization — most renders don't change token/email.
    [token, email],
  );

  // Render the Context Provider wrapping all children.
  // value={value} → makes the auth state available to useAuth() in any child component.
  // {children} → renders everything inside <AuthProvider>...</AuthProvider> (i.e., the whole app).
  return <C.Provider value={value}>{children}</C.Provider>;
}
