import React, { forwardRef } from 'react';

const Textarea = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  required = false,
  disabled = false,
  rows = 4,
  ...props
}, ref) => {
  const baseStyles = 'w-full rounded-lg border bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none';
  
  const inputStates = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500';

  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        className={`${baseStyles} ${inputStates} ${className} ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
        {...props}
      />
      {(error || helperText) && (
        <p className={`mt-1.5 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
