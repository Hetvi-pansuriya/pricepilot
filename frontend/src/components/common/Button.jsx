import Spinner from "./Spinner";
export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  children,
  ...p
}) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}${fullWidth ? " btn-full" : ""}`}
      disabled={loading || p.disabled}
      {...p}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
