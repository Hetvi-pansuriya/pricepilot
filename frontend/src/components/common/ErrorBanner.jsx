import '../../styles/components.css';

export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="error-banner" role="alert">
      <span className="error-icon">⚠</span>
      <p style={{ flex: 1 }}>{message}</p>
      {onDismiss && (
        <button
          className="btn-ghost"
          onClick={onDismiss}
          aria-label="Dismiss error"
          style={{ padding: 'var(--space-1)' }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
