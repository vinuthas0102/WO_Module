import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import { ActionIconDefinition, IconSize } from '../../types';

interface DropdownMenuDisplayProps {
  actions: ActionIconDefinition[];
  iconSize: IconSize;
  showLabels: boolean;
  groupByCategory: boolean;
  animationEnabled: boolean;
  triggerButtonClassName?: string;
}

const DropdownMenuDisplay: React.FC<DropdownMenuDisplayProps> = ({
  actions,
  iconSize,
  showLabels,
  groupByCategory,
  animationEnabled,
  triggerButtonClassName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [triggerPosition, setTriggerPosition] = useState({ x: 0, y: 0, alignRight: true });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const iconSizeClass = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  }[iconSize];

  const buttonSizeClass = {
    small: 'p-1',
    medium: 'p-2',
    large: 'p-2.5'
  }[iconSize];

  useEffect(() => {
    const updateTriggerPosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const panelWidth = 192;
        const spaceOnLeft = rect.left;
        const spaceOnRight = viewportWidth - rect.right;
        const alignRight = spaceOnLeft > panelWidth || spaceOnLeft > spaceOnRight;

        setTriggerPosition({
          x: alignRight ? rect.left : rect.right,
          y: rect.bottom,
          alignRight
        });
      }
    };

    if (isOpen) {
      requestAnimationFrame(() => {
        updateTriggerPosition();
      });
      window.addEventListener('scroll', updateTriggerPosition, true);
      window.addEventListener('resize', updateTriggerPosition);
    }

    return () => {
      window.removeEventListener('scroll', updateTriggerPosition, true);
      window.removeEventListener('resize', updateTriggerPosition);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: ActionIconDefinition) => {
    action.action();
    setIsOpen(false);
  };

  const groupedActions = groupByCategory
    ? actions.reduce((acc, action) => {
        if (!action) return acc;
        const category = action.category || 'general';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(action);
        return acc;
      }, {} as Record<string, ActionIconDefinition[]>)
    : { all: actions };

  const dropdownPanel = isOpen && (
    <>
      <div
        className="fixed inset-0 bg-transparent z-[9998]"
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
      />
      <div
        ref={menuRef}
        className={`fixed min-w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[9999] ${
          animationEnabled ? 'animate-fadeIn' : ''
        }`}
        style={{
          left: `${triggerPosition.x}px`,
          top: `${triggerPosition.y + 8}px`,
          transform: triggerPosition.alignRight ? 'translateX(-100%)' : 'translateX(0)'
        }}
        role="menu"
        aria-orientation="vertical"
      >
          {Object.entries(groupedActions).map(([category, categoryActions], idx) => (
            <div key={category}>
              {groupByCategory && category !== 'all' && (
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {category.replace('_', ' ')}
                </div>
              )}
              {categoryActions.map((action) => {
                if (!action || !action.icon) return null;
                const IconComponent = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action)}
                    disabled={action.disabled}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                      action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    } ${action.color || 'text-gray-700'}`}
                    title={action.tooltip}
                    role="menuitem"
                  >
                    <IconComponent className={iconSizeClass} />
                    {showLabels && <span className="text-sm">{action.label}</span>}
                  </button>
                );
              })}
              {groupByCategory && idx < Object.keys(groupedActions).length - 1 && (
                <div className="border-t border-gray-100 my-1"></div>
              )}
            </div>
          ))}
      </div>
    </>
  );

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors ${buttonSizeClass} ${triggerButtonClassName || ''}`}
        title="Actions"
        aria-label="Open actions menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <MoreVertical className={iconSizeClass} />
      </button>
      {isOpen && createPortal(dropdownPanel, document.body)}
    </>
  );
};

export default DropdownMenuDisplay;
