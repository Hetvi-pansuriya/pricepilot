import Button from "./Button";
export default function ErrorBanner({ message, onDismiss }) {
  return message ? (
    <div className="error-banner row-between">
      <span>{message}</span>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ×
        </Button>
      )}
    </div>
  ) : null;
}
