import Button from "./Button";
export default function EmptyState({
  icon = "◇",
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty stack">
      <div className="empty-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{description}</p>
      {actionLabel && (
        <div>
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  );
}
