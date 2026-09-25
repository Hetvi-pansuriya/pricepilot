/**
 * Badge.jsx — A small label/tag component for status indicators.
 *
 * PURPOSE: Renders a small colored pill (badge) to show status or category labels.
 *
 * PROPS:
 *   variant  → CSS class suffix (default: "neutral")
 *              Common values: "success" (green), "danger" (red), "warning" (yellow),
 *              "neutral" (gray), "info" (blue)
 *              → generates class "badge badge-success" etc.
 *   children → the text or content inside the badge (e.g., "Completed", "Failed")
 *
 * USAGE EXAMPLES:
 *   <Badge variant="success">Completed</Badge>  → green pill
 *   <Badge variant="danger">Failed</Badge>       → red pill
 *   <Badge>Pending</Badge>                        → gray pill (default)
 *
 * CONNECTED TO:
 *   - styles/components.css → defines .badge, .badge-success, .badge-danger, etc.
 *   - History.jsx           → shows analysis status badges (completed/failed/running)
 *   - Report.jsx            → may show module status badges
 *   - AnalysisWaiting.jsx   → may show progress state badges
 */

// Badge renders a <span> with appropriate CSS classes for visual styling.
// "span" → inline element, doesn't break the layout (not a block element).
// className={`badge badge-${variant}`} → e.g., "badge badge-success"
//   "badge" → shared base styles: border-radius, padding, font-size, font-weight
//   `badge-${variant}` → color-specific styles defined in components.css
export default function Badge({ variant = "neutral", children }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
