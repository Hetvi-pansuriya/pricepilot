/**
 * components/common/Button.jsx — Reusable button component.
 *
 * PURPOSE: A styled button that wraps the HTML <button> element.
 * Automatically handles loading state, disabled state, and visual variants.
 *
 * PROPS:
 *   variant   → CSS class suffix. "primary" | "ghost" | "danger" | "outline" (default: "primary")
 *               → generates className like "btn btn-primary"
 *   size      → CSS class suffix. "sm" | "md" | "lg" (default: "md")
 *               → generates className like "btn btn-md"
 *   loading   → boolean. If true: shows Spinner, disables the button.
 *               → prevents double-clicks during async operations (e.g., form submits)
 *   fullWidth → boolean. If true: adds "btn-full" class → button spans full container width.
 *   children  → button label/content (text, icons, or any JSX)
 *   ...p      → "rest props" spread. Passes any extra props (onClick, type, aria-*, etc.)
 *               to the underlying <button> element. Keeps the component flexible.
 *
 * CONNECTED TO:
 *   - Spinner.jsx → shown inside the button when loading=true
 *   - styles/components.css → defines .btn, .btn-primary, .btn-ghost, .btn-sm, etc.
 *   - Used by: EmptyState.jsx, ErrorBanner.jsx, Login.jsx, Signup.jsx, CompanySetup.jsx,
 *              Dashboard.jsx, AnalysisWaiting.jsx, and most other pages.
 */

// Spinner: the loading spinner component (a small CSS animation circle).
// Shown inside the button when loading=true.
import Spinner from "./Spinner";

// Button: the default export — used as <Button variant="primary" loading={isLoading}>Save</Button>
export default function Button({
  variant = "primary",  // visual style: "primary" (filled purple), "ghost" (transparent), "danger" (red)
  size = "md",          // size: "sm" (compact), "md" (default), "lg" (larger)
  loading = false,      // when true: shows spinner + disables the button
  fullWidth = false,    // when true: button fills the full width of its container
  children,             // button content: text, icon+text, or any JSX
  ...p                  // rest: any other props (onClick, type, disabled, aria-label, etc.)
}) {
  return (
    // className is built by combining CSS class names dynamically.
    // "btn" → the base button class (shared padding, border-radius, transition).
    // `btn-${variant}` → e.g., "btn-primary" or "btn-ghost" → controls color/background.
    // `btn-${size}` → e.g., "btn-sm" or "btn-md" → controls padding and font size.
    // fullWidth ? " btn-full" : "" → adds "btn-full" (width: 100%) only if fullWidth is true.
    <button
      className={`btn btn-${variant} btn-${size}${fullWidth ? " btn-full" : ""}`}

      // disabled: true when loading OR when the caller passes disabled={true}.
      // WHY disable during loading? Prevents double-submission of forms.
      // "loading || p.disabled" → either condition disables the button.
      disabled={loading || p.disabled}

      // {...p}: spreads all remaining props onto the <button> element.
      // This passes onClick, type, aria-label, data-testid, etc. through transparently.
      // Makes Button a "transparent wrapper" — callers can use any native button attribute.
      {...p}
    >
      {/* Show spinner before the button text when loading.
          loading && <Spinner /> → only renders Spinner when loading is true.
          size="sm" → uses the small spinner variant (fits inside a button). */}
      {loading && <Spinner size="sm" />}

      {/* Render the button label/content passed as children.
          Example: <Button>Save</Button> → children = "Save" */}
      {children}
    </button>
  );
}
