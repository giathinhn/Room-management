import { useState, useId } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import './Input.css';

/**
 * Input component with label, validation, and password toggle
 * @param {'text'|'email'|'password'} type
 * @param {string} label
 * @param {string} error
 * @param {string} hint
 * @param {React.ReactNode} leftIcon
 */
const Input = ({
  type = 'text',
  label,
  error,
  hint,
  leftIcon,
  className = '',
  id: externalId,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const generatedId = useId();
  const inputId = externalId || generatedId;

  const resolvedType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={`input-wrapper ${error ? 'input-wrapper--error' : ''} ${className}`}>
      {label && (
        <label className="input-label" htmlFor={inputId}>
          {label}
        </label>
      )}

      <div className="input-field-wrap">
        {leftIcon && <span className="input-icon input-icon--left">{leftIcon}</span>}

        <input
          id={inputId}
          type={resolvedType}
          className={`input-field ${leftIcon ? 'input-field--has-left' : ''} ${type === 'password' ? 'input-field--has-right' : ''} ${error ? 'input-field--error' : ''}`}
          {...props}
        />

        {type === 'password' && (
          <button
            type="button"
            className="input-icon input-icon--right input-toggle-btn"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        )}
      </div>

      {error && <p className="input-error" role="alert">{error}</p>}
      {hint && !error && <p className="input-hint">{hint}</p>}
    </div>
  );
};

export default Input;
