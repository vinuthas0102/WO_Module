import React from 'react';

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count, className = '' }) => {
  if (count <= 0) return null;

  return (
    <span
      className={`absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shadow-md animate-pulse ${className}`}
      aria-label={`${count} unread chat${count !== 1 ? 's' : ''}`}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
};

export default NotificationBadge;
