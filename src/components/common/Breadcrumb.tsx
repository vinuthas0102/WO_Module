import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <nav className="flex items-center flex-wrap gap-0.5 text-xs" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0 mx-0.5" />
            )}
            {isLast ? (
              <span className="text-gray-700 font-medium truncate max-w-[180px]" title={item.label}>
                {item.label}
              </span>
            ) : (
              <button
                onClick={item.onClick}
                disabled={!item.onClick}
                className={`truncate max-w-[140px] transition-colors duration-150 ${
                  item.onClick
                    ? 'text-blue-500 hover:text-blue-700 hover:underline cursor-pointer'
                    : 'text-gray-400 cursor-default'
                }`}
                title={item.label}
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
