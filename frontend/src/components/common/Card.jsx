/**
 * Card.jsx — A styled container component for grouping content.
 *
 * PURPOSE: Renders a <section> element with card styling (background, border,
 * border-radius, padding). Used as a content container throughout the app.
 *
 * PROPS:
 *   children  → the content inside the card (any JSX)
 *   className → additional CSS classes to add (default: "")
 *               Allows callers to add custom styles on top of the base card styles.
 *   onClick   → click handler (optional). If provided, the card becomes "interactive"
 *               (adds cursor:pointer, hover effects via "card-interactive" CSS class).
 *   elevated  → boolean. If true: adds "card-elevated" class → stronger shadow.
 *               Used for cards that should visually "float" above the page.
 *   glow      → boolean. If true: adds "card-glow" class → subtle glow border effect.
 *               Used for highlighted or featured cards (e.g., recommended strategy).
 *
 * USAGE EXAMPLES:
 *   <Card>Basic card with content</Card>
 *   <Card elevated glow onClick={() => navigate("/report")}>Clickable card with glow</Card>
 *   <Card className="custom-class">Card with extra class</Card>
 *
 * CONNECTED TO:
 *   - styles/components.css → defines .card, .card-interactive, .card-elevated, .card-glow
 *   - Dashboard.jsx, Report.jsx, CompanySetup.jsx → use Card as a layout container
 *   - WHY <section> not <div>? Section is semantic HTML (represents a thematic grouping).
 */
export default function Card({
  children,       // content rendered inside the card
  className = "", // extra CSS classes (added after base card classes)
  onClick,        // optional click handler — presence triggers "card-interactive" class
  elevated,       // boolean: stronger box-shadow
  glow,           // boolean: colored border glow effect
}) {
  return (
    // Build className dynamically from the props:
    // "card" → always present (base card styles: bg, border, radius, padding)
    // onClick ? "card-interactive " : "" → hover effects when card is clickable
    // elevated ? "card-elevated " : "" → stronger shadow
    // glow ? "card-glow " : "" → glow border effect
    // className → any extra classes from the caller
    <section
      className={`card ${onClick ? "card-interactive " : ""}${elevated ? "card-elevated " : ""}${glow ? "card-glow " : ""}${className}`}
      onClick={onClick}  // undefined is fine — no click handler means no interaction
    >
      {children}
    </section>
  );
}
