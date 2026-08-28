import { useId } from 'react';
import './Input.css';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  id?: string;
  label?: string;
  ariaLabel?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function Select({
  id,
  label,
  ariaLabel,
  value,
  onChange,
  options,
  placeholder = 'Seleziona...',
  required = false,
  disabled = false,
  error,
  className = '',
}: SelectProps) {
  const generatedId = useId();
  const selectId = id || `select-${generatedId}`;
  const errorId = `${selectId}-error`;

  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label htmlFor={selectId} className="input__label">
          {label}{required && <span className="input__required" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        id={selectId}
        aria-label={!label ? ariaLabel : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        disabled={disabled}
        className={`input ${error ? 'input--error' : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span id={errorId} className="input__error" role="alert">{error}</span>}
    </div>
  );
}
