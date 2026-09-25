/**
 * EmptyState.jsx — A placeholder component shown when a list has no items.
 *
 * PURPOSE: Shows a centered icon, title, description, and optional action button
 * when there's no data to display (e.g., no companies, no competitors, no history).
 * Better UX than a blank space — guides the user on what to do next.
 *
 * PROPS:
 *   icon        → emoji or icon string to display (default: "◇")
 *                 Examples: "🏢" for no companies, "📊" for no reports
 *   title       → main heading text (e.g., "No companies yet")
 *   description → supporting text below the title (e.g., "Create your first company to get started")
 *   actionLabel → text for the optional CTA button (e.g., "Create Company")
 *                 If not provided, no button is rendered.
 *   onAction    → click handler for the CTA button (e.g., () => navigate("/company/new/setup"))
 *
 * USAGE EXAMPLE:
 *   <EmptyState
 *     icon="🏢"
 *     title="No companies yet"
 *     description="Create your first company to start analyzing pricing."
 *     actionLabel="Create Company"
 *     onAction={() => navigate("/company/new/setup")}
 *   />
 *
 * CONNECTED TO:
 *   - Button.jsx → renders the CTA button
 *   - styles/components.css → defines .empty, .empty-icon, .stack classes
 *   - Dashboard.jsx → shows this when the user has no companies
 *   - History.jsx   → shows this when no analysis history exists
 */

// Button: the shared button component for the optional call-to-action.
import Button from "./Button";

export default function EmptyState({
  icon = "◇",     // default diamond icon (neutral/minimal)
  title,          // required: main heading
  description,    // supporting text below the title
  actionLabel,    // optional CTA button text (if not provided, no button renders)
  onAction,       // optional CTA click handler
}) {
  return (
    // "empty" → centers the content and adds top/bottom padding (defined in components.css)
    // "stack" → flex column layout, vertically stacks children with gap
    <div className="empty stack">
      {/* Large centered icon at the top */}
      <div className="empty-icon">{icon}</div>

      {/* Main heading — WHY h2 not h1? Most pages already have an h1 (page title).
          Empty state is a secondary message — h2 maintains heading hierarchy. */}
      <h2>{title}</h2>

      {/* Supporting text — explains why the list is empty */}
      <p>{description}</p>

      {/* Optional CTA button — only renders if actionLabel is provided.
          actionLabel && (...) → conditional rendering: if actionLabel is falsy, nothing renders.
          Wrapped in <div> to prevent the button from stretching to full width via "stack" flex. */}
      {actionLabel && (
        <div>
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
}
