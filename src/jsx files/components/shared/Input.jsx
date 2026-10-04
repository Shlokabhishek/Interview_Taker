import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  containerClassName = '',
  type = 'text',
  required = false,
  disabled = false,
  ...props
}, ref) => {
  const baseInputStyles = 'w-full rounded-lg border bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';
  
  const inputStates = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500';

  const iconPadding = Icon
    ? iconPosition === 'left' ? 'pl-10' : 'pr-10'
    : '';

  return (
    <div className={`${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Icon className="w-5 h-5 text-gray-400" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={`${baseInputStyles} ${inputStates} ${iconPadding} ${className} ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
          {...props}
        />
        {Icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Icon className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>
      {(error || helperText) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
