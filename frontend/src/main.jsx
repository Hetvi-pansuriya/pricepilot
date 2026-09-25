/**
 * main.jsx — The React app entry point.
 *
 * PURPOSE: This is the FIRST file that runs when the browser loads the app.
 * It connects the React application to the actual HTML document (index.html).
 *
 * BOOTSTRAP ORDER:
 *   1. main.jsx runs → mounts React into the #root div in index.html
 *   2. React.StrictMode wraps everything → helps catch bugs in development
 *   3. BrowserRouter enables React Router (URL-based navigation)
 *   4. AuthProvider makes auth state available to ALL components
 *   5. App renders → shows the correct page based on the current URL
 *
 * CONNECTED TO:
 *   - index.html     → the #root div where React is mounted
 *   - App.jsx        → the root component with all page routes
 *   - AuthContext.jsx → AuthProvider wraps the entire app
 *   - styles/        → global CSS imported here applies to everything
 */

// React: the React library. Required for JSX (even though not used directly).
// In React 17+, you don't need to import React for JSX in most cases,
// but it's good practice and required for React.StrictMode.
import React from "react";

// ReactDOM: connects React's virtual DOM to the browser's real DOM.
// ReactDOM.createRoot() creates a React root — the mounting point for the app.
import ReactDOM from "react-dom/client";

// BrowserRouter: provides URL-based routing using the HTML5 History API.
// WHY BrowserRouter? It uses real URLs (/dashboard, /login) instead of hash URLs (#/dashboard).
// Requires server-side configuration (or Vite dev server) to serve index.html for all routes.
// CONNECTED TO: App.jsx uses <Routes> and <Route> inside this.
import { BrowserRouter } from "react-router-dom";

// AuthProvider: provides authentication state (token, isAuthenticated, login, logout)
// to the entire component tree via React Context.
// WHY wrap the whole app? ALL pages need to know if the user is logged in.
// CONNECTED TO: AuthContext.jsx defines AuthProvider.
import { AuthProvider } from "./context/AuthContext";

// App: the root component that defines all page routes.
// CONNECTED TO: App.jsx
import App from "./App";

// Global CSS imports — these styles apply to EVERY page in the app.
// Order matters: each file can override the previous.
import "./styles/global.css";         // CSS variables, resets, body styles, typography
import "./styles/layout.css";          // layout utilities: flexbox helpers, grid, container
import "./styles/components.css";      // shared component styles: cards, buttons, badges, inputs
import "./styles/theme-overrides.css"; // any final overrides or dark mode tweaks

// ReactDOM.createRoot(): creates the React root attached to the HTML element with id="root".
// document.getElementById("root") → finds the <div id="root"> in public/index.html.
// .render(): takes the React component tree and renders it into the #root element.
// WHY createRoot (not ReactDOM.render)? createRoot is the React 18+ API — enables
//   Concurrent Mode features (automatic batching, transitions, Suspense).
ReactDOM.createRoot(document.getElementById("root")).render(
  // React.StrictMode: development-only wrapper that:
  //   - Detects side effects in render functions (renders twice in dev to catch bugs)
  //   - Warns about deprecated APIs
  //   - Highlights potential issues before they become bugs in production
  //   Has NO effect in production builds.
  <React.StrictMode>
    {/* BrowserRouter: enables <Route> and <Link> components to work with real URLs */}
    <BrowserRouter>
      {/* AuthProvider: provides login/logout/token state to all children */}
      <AuthProvider>
        {/* App: the root component — renders the correct page based on URL */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
