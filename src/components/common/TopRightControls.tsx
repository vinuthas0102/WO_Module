import React from 'react';

interface TopRightControlsProps {
  children: React.ReactNode;
  className?: string;
}

export const TopRightControls: React.FC<TopRightControlsProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`absolute top-0 right-0 flex items-center space-x-2 z-10 ${className}`}>
      {children}
    </div>
  );
};
