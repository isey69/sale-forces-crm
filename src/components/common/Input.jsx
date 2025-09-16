import React from "react";

const Input = ({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  required = false,
  disabled = false,
  className = "",
  icon,
  iconPosition = "left",
  helper,
  id,
  name,
  ...props
}) => {
  const inputId =
    id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

  const inputClasses = `
    block w-full rounded-lg border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset transition-colors
    placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6
    ${
      error
        ? "ring-red-300 focus:ring-red-500"
        : "ring-gray-300 focus:ring-primary-600"
    }
    ${
      disabled
        ? "bg-gray-50 text-gray-500 cursor-not-allowed"
        : "bg-white hover:ring-gray-400"
    }
    ${icon ? (iconPosition === "left" ? "pl-10 pr-3" : "pl-3 pr-10") : "px-3"}
    ${className}
  `.trim();

  const iconClasses = `
    absolute top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400
    ${iconPosition === "left" ? "left-3" : "right-3"}
  `;

  return (
    <div className="space-y-1">
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input container */}
      <div className="relative">
        {/* Icon */}
        {icon && <div className={iconClasses}>{icon}</div>}

        {/* Input */}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputClasses}
          {...props}
        />
      </div>

      {/* Helper text or Error */}
      {(helper || error) && (
        <p className={`text-sm ${error ? "text-red-600" : "text-gray-500"}`}>
          {error || helper}
        </p>
      )}
    </div>
  );
};

// Textarea component
export const Textarea = ({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  required = false,
  disabled = false,
  rows = 3,
  className = "",
  helper,
  id,
  name,
  ...props
}) => {
  const inputId =
    id || name || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  const textareaClasses = `
    block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset transition-colors
    placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 resize-none
    ${
      error
        ? "ring-red-300 focus:ring-red-500"
        : "ring-gray-300 focus:ring-primary-600"
    }
    ${
      disabled
        ? "bg-gray-50 text-gray-500 cursor-not-allowed"
        : "bg-white hover:ring-gray-400"
    }
    ${className}
  `.trim();

  return (
    <div className="space-y-1">
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Textarea */}
      <textarea
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={textareaClasses}
        {...props}
      />

      {/* Helper text or Error */}
      {(helper || error) && (
        <p className={`text-sm ${error ? "text-red-600" : "text-gray-500"}`}>
          {error || helper}
        </p>
      )}
    </div>
  );
};

// Select component
export const Select = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  error,
  required = false,
  disabled = false,
  className = "",
  helper,
  id,
  name,
  ...props
}) => {
  const inputId =
    id || name || `select-${Math.random().toString(36).substr(2, 9)}`;

  const selectClasses = `
    block w-full rounded-lg border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset transition-colors
    focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6
    ${
      error
        ? "ring-red-300 focus:ring-red-500"
        : "ring-gray-300 focus:ring-primary-600"
    }
    ${
      disabled
        ? "bg-gray-50 text-gray-500 cursor-not-allowed"
        : "bg-white hover:ring-gray-400"
    }
    ${className}
  `.trim();

  return (
    <div className="space-y-1">
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select */}
      <select
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={selectClasses}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Helper text or Error */}
      {(helper || error) && (
        <p className={`text-sm ${error ? "text-red-600" : "text-gray-500"}`}>
          {error || helper}
        </p>
      )}
    </div>
  );
};

export default Input;
