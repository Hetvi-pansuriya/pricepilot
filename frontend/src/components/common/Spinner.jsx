import '../../styles/components.css';

export default function Spinner({ message }) {
  return (
    <div className="spinner-container">
      <div className="spinner" />
      {message && <p className="text-sm text-muted">{message}</p>}
    </div>
  );
}
