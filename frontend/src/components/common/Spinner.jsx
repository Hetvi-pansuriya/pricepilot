export default function Spinner({ size = "md", message }) {
  return (
    <div className="spinner-wrap">
      <span className={`spinner spinner-${size}`} />
      {message && <p>{message}</p>}
    </div>
  );
}
