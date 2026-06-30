import '../../styles/components.css';

export default function Button({
  children,
  variant = 'primary',
  size,
  fullWidth,
  disabled,
  loading,
  type = 'button',
  onClick,
  className = '',
  ...props
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'sm' && 'btn-sm',
    size === 'lg' && 'btn-lg',
    fullWidth && 'btn-full',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="spinner spinner-sm" />}
      {children}
    </button>
  );
}
