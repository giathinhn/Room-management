import LoadingSpinner from './LoadingSpinner';
import './Button.css';

/**
 * Button component
 * @param {'primary'|'secondary'|'danger'|'ghost'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} loading
 * @param {boolean} disabled
 * @param {React.ReactNode} leftIcon
 * @param {React.ReactNode} rightIcon
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  type = 'button',
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size} ${loading ? 'btn--loading' : ''} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" color="white" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="btn__icon">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="btn__icon">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
