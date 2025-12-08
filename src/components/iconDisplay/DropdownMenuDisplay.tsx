import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, ChevronRight } from 'lucide-react';
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
  const [triggerPosition, setTriggerPosition] = useState({ x: 0, y: 0, alignRight: true, maxHeight: 400 });
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [subMenuPosition, setSubMenuPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const subMenuRef = useRef<HTMLDivElement>(null);
  const parentItemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

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
        const viewportHeight = window.innerHeight;
        const panelWidth = 192;
        const spaceOnLeft = rect.left;
        const spaceOnRight = viewportWidth - rect.right;
        const alignRight = spaceOnLeft > panelWidth || spaceOnLeft > spaceOnRight;

        // Calculate available space below the trigger
        const spaceBelow = viewportHeight - rect.bottom - 16; // 16px for padding
        const maxHeight = Math.max(200, Math.min(spaceBelow, 500)); // Min 200px, max 500px

        setTriggerPosition({
          x: alignRight ? rect.left : rect.right,
          y: rect.bottom,
          alignRight,
          maxHeight
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
          triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
          (!subMenuRef.current || !subMenuRef.current.contains(event.target as Node))) {
        setIsOpen(false);
        setActiveSubMenu(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (activeSubMenu) {
      const parentElement = parentItemRefs.current.get(activeSubMenu);
      if (parentElement && menuRef.current) {
        const parentRect = parentElement.getBoundingClientRect();
        const menuRect = menuRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        const spaceOnRight = window.innerWidth - menuRect.right;
        const subMenuWidth = 192;

        let xPos = menuRect.right;
        if (spaceOnRight < subMenuWidth + 20) {
          xPos = menuRect.left - subMenuWidth;
        }

        let yPos = parentRect.top;
        const estimatedSubMenuHeight = 300;
        if (yPos + estimatedSubMenuHeight > viewportHeight) {
          yPos = Math.max(20, viewportHeight - estimatedSubMenuHeight);
        }

        setSubMenuPosition({ x: xPos, y: yPos });
      }
    }
  }, [activeSubMenu]);

  const handleAction = (action: ActionIconDefinition) => {
    if (action.subActions && action.subActions.length > 0) {
      return;
    }
    action.action();
    setIsOpen(false);
    setActiveSubMenu(null);
  };

  const handleParentClick = (action: ActionIconDefinition, event: React.MouseEvent) => {
    if (action.subActions && action.subActions.length > 0) {
      event.stopPropagation();
      setActiveSubMenu(activeSubMenu === action.id ? null : action.id);
    } else {
      handleAction(action);
    }
  };

  const handleParentHover = (action: ActionIconDefinition) => {
    if (action.subActions && action.subActions.length > 0) {
      setActiveSubMenu(action.id);
    }
  };

  const handleSubAction = (action: ActionIconDefinition) => {
    action.action();
    setIsOpen(false);
    setActiveSubMenu(null);
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
        className={`fixed min-w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[9999] overflow-y-auto ${
          animationEnabled ? 'animate-fadeIn' : ''
        }`}
        style={{
          left: `${triggerPosition.x}px`,
          top: `${triggerPosition.y + 8}px`,
          transform: triggerPosition.alignRight ? 'translateX(-100%)' : 'translateX(0)',
          maxHeight: `${triggerPosition.maxHeight}px`
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
                const hasSubActions = action.subActions && action.subActions.length > 0;
                return (
                  <button
                    key={action.id}
                    ref={(el) => {
                      if (el && hasSubActions) {
                        parentItemRefs.current.set(action.id, el);
                      }
                    }}
                    onClick={(e) => handleParentClick(action, e)}
                    onMouseEnter={() => handleParentHover(action)}
                    disabled={action.disabled}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center justify-between gap-3 ${
                      action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    } ${action.color || 'text-gray-700'} ${activeSubMenu === action.id ? 'bg-gray-100' : ''}`}
                    title={action.tooltip}
                    role="menuitem"
                    aria-haspopup={hasSubActions ? 'true' : undefined}
                    aria-expanded={hasSubActions ? activeSubMenu === action.id : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={iconSizeClass} />
                      {showLabels && <span className="text-sm">{action.label}</span>}
                    </div>
                    {hasSubActions && <ChevronRight className="w-4 h-4 opacity-50" />}
                  </button>
                );
              })}
              {groupByCategory && idx < Object.keys(groupedActions).length - 1 && (
                <div className="border-t border-gray-100 my-1"></div>
              )}
            </div>
          ))}
      </div>
      {activeSubMenu && (() => {
        const parentAction = actions.find(a => a.id === activeSubMenu);
        if (!parentAction || !parentAction.subActions) return null;

        return (
          <div
            ref={subMenuRef}
            className={`fixed min-w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[10000] overflow-y-auto ${
              animationEnabled ? 'animate-fadeIn' : ''
            }`}
            style={{
              left: `${subMenuPosition.x}px`,
              top: `${subMenuPosition.y}px`,
              maxHeight: '400px'
            }}
            role="menu"
            aria-orientation="vertical"
          >
            {parentAction.subActions.map((subAction) => {
              if (!subAction || !subAction.icon) return null;
              const SubIconComponent = subAction.icon;
              return (
                <button
                  key={subAction.id}
                  onClick={() => handleSubAction(subAction)}
                  disabled={subAction.disabled}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                    subAction.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } ${subAction.color || 'text-gray-700'}`}
                  title={subAction.tooltip}
                  role="menuitem"
                >
                  <SubIconComponent className={iconSizeClass} />
                  {showLabels && <span className="text-sm">{subAction.label}</span>}
                </button>
              );
            })}
          </div>
        );
      })()}
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
