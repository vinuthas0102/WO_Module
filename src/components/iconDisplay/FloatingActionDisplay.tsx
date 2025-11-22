import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';
import { ActionIconDefinition, IconSize } from '../../types';

interface FloatingActionDisplayProps {
  actions: ActionIconDefinition[];
  iconSize: IconSize;
  showLabels: boolean;
  groupByCategory: boolean;
  animationEnabled: boolean;
}

const FloatingActionDisplay: React.FC<FloatingActionDisplayProps> = ({
  actions,
  iconSize,
  showLabels,
  groupByCategory,
  animationEnabled
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fabPosition, setFabPosition] = useState({ x: 0, y: 0 });
  const fabRef = useRef<HTMLDivElement>(null);

  const iconSizeClass = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  }[iconSize];

  const fabSizeClass = {
    small: 'w-10 h-10',
    medium: 'w-12 h-12',
    large: 'w-14 h-14'
  }[iconSize];

  const actionButtonSizeClass = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12'
  }[iconSize];

  useEffect(() => {
    const updateFabPosition = () => {
      if (fabRef.current) {
        const rect = fabRef.current.getBoundingClientRect();
        setFabPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      }
    };

    if (isExpanded) {
      updateFabPosition();
      window.addEventListener('scroll', updateFabPosition, true);
      window.addEventListener('resize', updateFabPosition);
    }

    return () => {
      window.removeEventListener('scroll', updateFabPosition, true);
      window.removeEventListener('resize', updateFabPosition);
    };
  }, [isExpanded]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const handleAction = (action: ActionIconDefinition) => {
    if (!action.disabled) {
      action.action();
      setIsExpanded(false);
    }
  };

  const calculatePosition = (index: number, total: number) => {
    const radius = 80;
    const startAngle = -90;
    const angleStep = 180 / (total > 1 ? total - 1 : 1);
    const angle = (startAngle + angleStep * index) * (Math.PI / 180);

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    const buttonSize = iconSize === 'small' ? 32 : iconSize === 'medium' ? 40 : 48;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = fabPosition.x + x;
    let adjustedY = fabPosition.y + y;

    if (adjustedX + buttonSize > viewportWidth - 10) {
      adjustedX = viewportWidth - buttonSize - 10;
    }
    if (adjustedX - buttonSize < 10) {
      adjustedX = buttonSize + 10;
    }
    if (adjustedY + buttonSize > viewportHeight - 10) {
      adjustedY = viewportHeight - buttonSize - 10;
    }
    if (adjustedY - buttonSize < 10) {
      adjustedY = buttonSize + 10;
    }

    return {
      x: adjustedX,
      y: adjustedY
    };
  };

  const getLabelPosition = (buttonX: number, buttonY: number, index: number, total: number) => {
    const viewportWidth = window.innerWidth;
    const labelEstimatedWidth = 150;

    // Determine horizontal position based on viewport
    const horizontalPosition = buttonX + labelEstimatedWidth > viewportWidth - 20 ? 'right' : 'left';

    // Determine vertical alignment based on button position in arc
    const middleIndex = (total - 1) / 2;
    let verticalAlign = 'middle';

    if (total > 3) {
      if (index < middleIndex - 0.5) {
        verticalAlign = 'top';
      } else if (index > middleIndex + 0.5) {
        verticalAlign = 'bottom';
      }
    }

    return { horizontal: horizontalPosition, vertical: verticalAlign };
  };

  const expandedContent = isExpanded && (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-10 z-[10001]"
        aria-hidden="true"
        onClick={() => setIsExpanded(false)}
      ></div>
      <div className="fixed inset-0 pointer-events-none z-[10002]">
        {actions.map((action, index) => {
          if (!action || !action.icon) return null;
          const IconComponent = action.icon;
          const position = calculatePosition(index, actions.length);
          const labelPosition = getLabelPosition(position.x, position.y, index, actions.length);

          const verticalAlignClass = {
            top: 'top-0',
            middle: 'top-1/2 -translate-y-1/2',
            bottom: 'bottom-0'
          }[labelPosition.vertical];

          return (
            <div
              key={action.id}
              className={`fixed pointer-events-auto ${animationEnabled ? 'animate-fadeIn' : ''}`}
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: 'translate(-50%, -50%)',
                animationDelay: animationEnabled ? `${index * 50}ms` : '0ms'
              }}
            >
              <button
                onClick={() => handleAction(action)}
                disabled={action.disabled}
                className={`${actionButtonSizeClass} flex items-center justify-center rounded-full shadow-lg transition-all ${
                  action.disabled
                    ? 'opacity-50 cursor-not-allowed bg-gray-300'
                    : `cursor-pointer bg-white hover:bg-gray-50 ${
                        animationEnabled ? 'hover:scale-110' : ''
                      }`
                } ${action.color || 'text-gray-700'}`}
                title={action.tooltip || action.label}
                aria-label={action.label}
              >
                <IconComponent className={iconSizeClass} />
              </button>
              {showLabels && (
                <div
                  className={`absolute whitespace-nowrap ${verticalAlignClass} ${
                    labelPosition.horizontal === 'left' ? 'left-full ml-2' : 'right-full mr-2'
                  }`}
                >
                  <span className="px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg">
                    {action.label}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <>
      <div className="relative inline-flex z-[10000]" ref={fabRef}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`${fabSizeClass} flex items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all relative ${
            animationEnabled ? 'hover:scale-110' : ''
          } ${isExpanded ? 'rotate-45' : ''}`}
          aria-label={isExpanded ? 'Close actions' : 'Open actions'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? <X className={iconSizeClass} /> : <Plus className={iconSizeClass} />}
        </button>
      </div>
      {isExpanded && createPortal(expandedContent, document.body)}
    </>
  );
};

export default FloatingActionDisplay;
