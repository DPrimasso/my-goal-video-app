import { useId } from 'react';
import './Input.css';

interface InputProps {
  id?: string;
  label?: string;
  ariaLabel?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'email' | 'password';
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  min?: number;
  max?: number;
  maxLength?: number;
}

export function Input({
  id,
  label,
  ariaLabel,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  disabled = false,
  error,
  className = '',
  min,
  max,
  maxLength,
}: InputProps) {
  const generatedId = useId();
  const inputId = id || `input-${generatedId}`;
  const errorId = `${inputId}-error`;

  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input__label">
          {label}{required && <span className="input__required" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        id={inputId}
        aria-label={!label ? ariaLabel : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        maxLength={maxLength}
        className={`input ${error ? 'input--error' : ''}`}
      />
      {error && <span id={errorId} className="input__error" role="alert">{error}</span>}
    </div>
  );
}
