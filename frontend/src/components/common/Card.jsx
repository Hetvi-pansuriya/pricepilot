import '../../styles/components.css';

export default function Card({ children, className = '', glow, elevated, interactive, ...props }) {
  const classes = [
    'card',
    glow && 'card-glow',
    elevated && 'card-elevated',
    interactive && 'card-interactive',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
