import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

const Alert = ({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
}) => {
  const types = {
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: Info,
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-800',
      textColor: 'text-blue-700',
    },
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-500',
      titleColor: 'text-green-800',
      textColor: 'text-green-700',
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: AlertCircle,
      iconColor: 'text-yellow-500',
      titleColor: 'text-yellow-800',
      textColor: 'text-yellow-700',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: XCircle,
      iconColor: 'text-red-500',
      titleColor: 'text-red-800',
      textColor: 'text-red-700',
    },
  };

  const { bg, icon: Icon, iconColor, titleColor, textColor } = types[type];

  return (
    <div className={`rounded-lg border p-4 ${bg} ${className}`}>
      <div className="flex">
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${titleColor}`}>{title}</h3>
          )}
          {message && (
            <p className={`text-sm ${textColor} ${title ? 'mt-1' : ''}`}>
              {message}
            </p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-3 ${textColor} hover:opacity-70 transition-opacity`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
