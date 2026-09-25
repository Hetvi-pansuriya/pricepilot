/**
 * App.jsx — The root routing component.
 *
 * PURPOSE: Defines ALL page routes for the application using React Router.
 * This is the "route table" — it maps URL paths to page components.
 *
 * TWO TYPES OF ROUTES:
 *   1. Public routes: accessible without login (login, signup, forgot/reset password)
 *   2. Protected routes: wrapped in <ProtectedRoute> — redirect to /login if not authenticated
 *
 * URL PARAMETER PATTERNS:
 *   :companyId → replaced with the actual company UUID (e.g., /company/4aee0518-6c22.../setup)
 *   :sessionId → replaced with the analysis session UUID
 *   :sessionA, :sessionB → two session UUIDs for the comparison report page
 *
 * CONNECTED TO:
 *   - main.jsx           → App is rendered here, wrapped in BrowserRouter + AuthProvider
 *   - AuthContext.jsx    → useAuth() provides isAuthenticated for root redirect
 *   - ProtectedRoute.jsx → guards all authenticated routes
 *   - All page components listed in imports
 */

// Navigate: component that immediately redirects to another route.
// Route: defines a URL pattern → component mapping.
// Routes: the container for all Route components (replaces Switch in React Router v5).
import { Navigate, Route, Routes } from "react-router-dom";

// useAuth: hook to read authentication state from AuthContext.
// Used to decide where to redirect the root "/" path.
import { useAuth } from "./context/AuthContext";

// ProtectedRoute: a layout route that checks isAuthenticated.
// If not authenticated, redirects to /login. If authenticated, renders <Outlet />.
import ProtectedRoute from "./components/layout/ProtectedRoute";

// ── Page Components ──────────────────────────────────────────────────────────
// Each import is one page of the app.
import Landing from "./pages/Landing";
import Login from "./pages/Login";               // /login → sign in form
import Signup from "./pages/Signup";             // /signup → registration form
import Dashboard from "./pages/Dashboard";       // /dashboard → list of user's companies
import CompanySetup from "./pages/CompanySetup"; // /company/new/setup or /company/:id/setup → tier/feature setup
import AnalysisWaiting from "./pages/AnalysisWaiting"; // /company/:id/analyzing/:sessionId → progress bar + SSE
import Report from "./pages/Report";             // /company/:id/report/:sessionId → full report view
import History from "./pages/History";           // /company/:id/history → past analyses for one company
import ReportCompare from "./pages/ReportCompare"; // /company/:id/compare/:a/:b → compare 2 reports
import ForgotPassword from "./pages/ForgotPassword"; // /forgot-password → email input for reset
import ResetPassword from "./pages/ResetPassword";   // /reset-password?token=... → new password form
import ProfileSettings from "./pages/ProfileSettings"; // /profile → account settings + delete account
import AllHistory from "./pages/AllHistory";     // /history → all history across all companies

// App is the default export — used in main.jsx as <App />.
export default function App() {
  // isAuthenticated: boolean — true if a JWT token is stored in localStorage.
  // Used only for the root "/" redirect logic below.
  // CONNECTED TO: AuthContext.jsx stores/clears the token on login/logout.
  const { isAuthenticated } = useAuth();

  return (
    // <Routes>: the container for all route definitions.
    // Only the FIRST matching <Route> renders (like a switch statement).
    <Routes>
      {/* ── Public Routes — accessible without authentication ────────── */}

      {/* /login → Login page (email + password form) */}
      <Route path="/login" element={<Login />} />

      {/* /signup → Signup page (create new account) */}
      <Route path="/signup" element={<Signup />} />

      {/* /forgot-password → Email input to trigger password reset email */}
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* /reset-password?token=... → New password form (token read from query params) */}
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* ── Protected Routes — require authentication ────────────────── */}
      {/* <ProtectedRoute /> is a "layout route" — it wraps all child routes.
          If not authenticated, ProtectedRoute redirects to /login.
          If authenticated, it renders <Outlet /> which shows the matched child route.
          element={<ProtectedRoute />} → no path, acts as a parent for all children. */}
      <Route element={<ProtectedRoute />}>

        {/* /dashboard → List of all user's companies + "New Company" button */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* /company/new/setup → Create a new company from scratch */}
        <Route path="/company/new/setup" element={<CompanySetup />} />

        {/* /company/:companyId/setup → Edit an existing company's tiers/features/competitors.
            :companyId is a URL parameter — CompanySetup reads it with useParams(). */}
        <Route path="/company/:companyId/setup" element={<CompanySetup />} />

        {/* /company/:companyId/analyzing/:sessionId → Progress screen while analysis runs.
            SSE stream from backend pushes progress updates.
            :sessionId → the UUID returned by POST /analysis/start */}
        <Route
          path="/company/:companyId/analyzing/:sessionId"
          element={<AnalysisWaiting />}
        />

        {/* /company/:companyId/report/:sessionId → Full report view with charts.
            Fetches report data from GET /analysis/report/:sessionId */}
        <Route
          path="/company/:companyId/report/:sessionId"
          element={<Report />}
        />

        {/* /company/:companyId/history → Timeline of all analyses for one company */}
        <Route path="/company/:companyId/history" element={<History />} />

        {/* /company/:companyId/compare/:sessionA/:sessionB → Side-by-side report comparison.
            :sessionA and :sessionB are two different analysis session UUIDs. */}
        <Route path="/company/:companyId/compare/:sessionA/:sessionB" element={<ReportCompare />} />

        {/* /profile → Account settings (email display, delete account button) */}
        <Route path="/profile" element={<ProfileSettings />} />

        {/* /history → All history across ALL companies (global view) */}
        <Route path="/history" element={<AllHistory />} />
      </Route>

      {/* ── Root redirect ─────────────────────────────────────────────── */}
      {/* "/" → redirect to /dashboard if logged in, /login if not.
          replace → replaces the history entry so the user can't "back" to "/".
          isAuthenticated: read from AuthContext (true if JWT token exists). */}
      <Route path="/" element={<Landing />} />

      {/* ── Catch-all for unknown URLs ────────────────────────────────── */}
      {/* Any URL that doesn't match the above routes → redirect to "/".
          The "/" route then handles the redirect to /dashboard or /login. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
