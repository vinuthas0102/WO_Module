import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, Trash2, RefreshCw, Package, FileCheck } from 'lucide-react';

export interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'primary' | 'success';
  show: boolean;
}

interface ActionGroup {
  items: ActionItem[];
}

interface ActionsDropdownProps {
  actionGroups: ActionGroup[];
}

const ActionsDropdown: React.FC<ActionsDropdownProps> = ({ actionGroups }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const visibleGroups = actionGroups.map(group => ({
    items: group.items.filter(item => item.show)
  })).filter(group => group.items.length > 0);

  if (visibleGroups.length === 0) {
    return null;
  }

  const getVariantStyles = (variant?: 'default' | 'danger' | 'primary' | 'success') => {
    switch (variant) {
      case 'danger':
        return 'text-red-700 hover:bg-red-50';
      case 'primary':
        return 'text-blue-700 hover:bg-blue-50';
      case 'success':
        return 'text-green-700 hover:bg-green-50';
      default:
        return 'text-gray-700 hover:bg-gray-50';
    }
  };

  const handleActionClick = (action: ActionItem) => {
    action.onClick();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-sm"
        title="Actions"
      >
        <span>Actions</span>
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[60]">
          {visibleGroups.map((group, groupIndex) => (
            <React.Fragment key={groupIndex}>
              {groupIndex > 0 && (
                <div className="border-t border-gray-200 my-1" />
              )}
              {group.items.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action)}
                  className={`w-full px-4 py-2 text-left text-sm font-medium flex items-center space-x-3 transition-colors duration-150 ${getVariantStyles(action.variant)}`}
                >
                  <span className="flex-shrink-0">{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionsDropdown;
