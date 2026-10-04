import React from 'react';

const Avatar = ({
  src,
  alt = 'Avatar',
  name = '',
  size = 'md',
  className = '',
  speaking = false,
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-24 h-24 text-2xl',
    '3xl': 'w-32 h-32 text-3xl',
  };

  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Generate background color from name
  const getColor = (name) => {
    if (!name) return 'bg-gray-400';
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizes[size]} rounded-full object-cover ${speaking ? 'avatar-speaking ring-4 ring-primary-400' : ''} ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} ${getColor(name)} rounded-full flex items-center justify-center text-white font-medium ${speaking ? 'avatar-speaking ring-4 ring-primary-400' : ''} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
