import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  headerContent?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultExpanded = false,
  headerContent,
  children,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`bg-white bg-opacity-80 backdrop-blur-sm rounded-xl shadow-lg border border-white border-opacity-30 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 hover:bg-opacity-50 transition-colors duration-200 rounded-t-xl"
      >
        <div className="flex items-center space-x-3 flex-1">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-600 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
          )}
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        {headerContent && (
          <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
            {headerContent}
          </div>
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-200 border-opacity-30">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
