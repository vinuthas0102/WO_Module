import React from 'react';
import { Maximize2 } from 'lucide-react';

interface TabExpandButtonProps {
  onClick: () => void;
  className?: string;
  label?: string;
}

const TabExpandButton: React.FC<TabExpandButtonProps> = ({
  onClick,
  className = '',
  label = 'Full Screen'
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 ${className}`}
      title={label}
    >
      <Maximize2 className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

export default TabExpandButton;
