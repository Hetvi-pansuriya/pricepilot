import Button from './Button';
import '../../styles/components.css';

export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      {icon && <span className="empty-icon">{icon}</span>}
      {title && <h3>{title}</h3>}
      {description && <p>{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
