type IconProps = {
  name: string;
  filled?: boolean;
  className?: string;
};

export function Icon({ name, filled, className = '' }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? 'filled' : ''} ${className}`}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
