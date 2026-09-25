/**
 * api/auth.js — Authentication API functions.
 *
 * PURPOSE: Wraps all /auth/* backend endpoints into simple JS functions.
 * Each function returns a Promise that resolves to the response data (JSON).
 *
 * CONNECTED TO:
 *   - client.js     → all functions use the pre-configured Axios client (with auto-auth)
 *   - Login.jsx     → calls login()
 *   - Signup.jsx    → calls signup()
 *   - ForgotPassword.jsx → calls forgotPassword()
 *   - ResetPassword.jsx  → calls resetPassword()
 *   - ProfileSettings.jsx → calls deleteAccount()
 *   - backend auth.py → all endpoints defined there
 */

// c: the shared Axios client from client.js (has JWT interceptor built in).
import c from "./client";

// login: POST /auth/login
// Sends email + password to the backend. Backend verifies credentials and returns a JWT.
// Parameters: email (string), password (string)
// Returns: Promise → {access_token: "eyJ...", token_type: "bearer"}
// CONNECTED TO: Login.jsx calls login(email, password), stores token in localStorage.
export const login = (email, password) =>
  c.post("/auth/login", { email, password }).then((r) => r.data);
  // .then((r) => r.data): extracts just the data from the Axios response object.
  // Without this, we'd get the full Axios response (status, headers, data, etc.).

// signup: POST /auth/signup
// Creates a new account and returns a JWT token immediately (auto-login).
// Parameters: email (string), password (string)
// Returns: Promise → {access_token: "eyJ...", token_type: "bearer"}
// CONNECTED TO: Signup.jsx calls signup(email, password), stores token in localStorage.
export const signup = (email, password) =>
  c.post("/auth/signup", { email, password }).then((r) => r.data);

// forgotPassword: POST /auth/forgot-password
// Triggers the password reset flow. Backend sends an email with a reset link.
// Parameters: email (string) — the account email to reset.
// Returns: Promise → {message: "If this email exists, a reset link has been sent."}
// NOTE: Always returns success (prevents email enumeration attacks).
// NOTE: password: "" is sent because the endpoint reuses LoginRequest schema
//       which requires the password field, but /forgot-password ignores it.
// CONNECTED TO: ForgotPassword.jsx calls this, email_service.py sends the email.
export const forgotPassword = (email) =>
  c.post("/auth/forgot-password", { email, password: "" }).then((r) => r.data);

// resetPassword: POST /auth/reset-password
// Validates the token from the email link and sets a new password.
// Parameters:
//   token (string)        → the URL-safe token from the reset email link (?token=...)
//   new_password (string) → the user's chosen new password (min 6 chars)
// Returns: Promise → {message: "Password updated successfully."}
// CONNECTED TO: ResetPassword.jsx reads token from URL query params and calls this.
export const resetPassword = (token, new_password) =>
  c.post("/auth/reset-password", { token, new_password }).then((r) => r.data);

// deleteAccount: DELETE /auth/account
// Permanently deletes the user's account and ALL their data (companies, reports, etc.)
// No parameters — the user is identified from the JWT token in the Authorization header.
// Returns: Promise → empty (204 No Content from backend)
// WARNING: Irreversible. The backend's CASCADE foreign keys delete all related data.
// CONNECTED TO: ProfileSettings.jsx calls this after user confirms in a dialog.
export const deleteAccount = () =>
  c.delete("/auth/account").then((r) => r.data);
