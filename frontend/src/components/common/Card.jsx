export default function Card({
  children,
  className = "",
  onClick,
  elevated,
  glow,
}) {
  return (
    <section
      className={`card ${onClick ? "card-interactive " : ""}${elevated ? "card-elevated " : ""}${glow ? "card-glow " : ""}${className}`}
      onClick={onClick}
    >
      {children}
    </section>
  );
}
