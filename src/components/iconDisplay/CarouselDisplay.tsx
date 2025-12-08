import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, LayoutGrid, ChevronDown } from 'lucide-react';
import { ActionIconDefinition, IconSize } from '../../types';

interface CarouselDisplayProps {
  actions: ActionIconDefinition[];
  iconSize: IconSize;
  showLabels: boolean;
  groupByCategory: boolean;
  animationEnabled: boolean;
  triggerButtonClassName?: string;
}

const CarouselDisplay: React.FC<CarouselDisplayProps> = ({
  actions,
  iconSize,
  showLabels,
  groupByCategory,
  animationEnabled,
  triggerButtonClassName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [triggerPosition, setTriggerPosition] = useState({ x: 0, y: 0, alignRight: true });
  const carouselRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemsPerPage = 3;

  const iconSizeClass = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  }[iconSize];

  const triggerButtonSizeClass = {
    small: 'p-1',
    medium: 'p-2',
    large: 'p-2.5'
  }[iconSize];

  const buttonSizeClass = {
    small: 'w-10 h-10',
    medium: 'w-12 h-12',
    large: 'w-14 h-14'
  }[iconSize];

  const totalPages = Math.ceil(actions.length / itemsPerPage);
  const canGoLeft = currentIndex > 0;
  const canGoRight = currentIndex < totalPages - 1;

  useEffect(() => {
    if (currentIndex >= totalPages && totalPages > 0) {
      setCurrentIndex(Math.max(0, totalPages - 1));
    }
  }, [actions.length, totalPages, currentIndex]);

  useEffect(() => {
    const updateTriggerPosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const panelWidth = 320;
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
      if (carouselRef.current && !carouselRef.current.contains(event.target as Node) &&
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

  const goToPrevious = () => {
    if (canGoLeft) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const goToNext = () => {
    if (canGoRight) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleAction = (action: ActionIconDefinition) => {
    if (action.disabled) return;

    if (action.subActions && action.subActions.length > 0) {
      setExpandedAction(expandedAction === action.id ? null : action.id);
    } else {
      action.action();
      setIsOpen(false);
      setExpandedAction(null);
    }
  };

  const handleSubAction = (subAction: ActionIconDefinition) => {
    subAction.action();
    setIsOpen(false);
    setExpandedAction(null);
  };

  const startIndex = currentIndex * itemsPerPage;
  const visibleActions = actions.slice(startIndex, startIndex + itemsPerPage);

  const carouselPanel = isOpen && (
    <>
      <div
        className="fixed inset-0 bg-transparent z-[9998]"
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
      />
      <div
        ref={carouselRef}
        className={`fixed bg-white rounded-lg shadow-xl border border-gray-200 p-6 z-[9999] min-w-[320px] ${
          animationEnabled ? 'animate-fadeIn' : ''
        }`}
        style={{
          left: `${triggerPosition.x}px`,
          top: `${triggerPosition.y + 8}px`,
          transform: triggerPosition.alignRight ? 'translateX(-100%)' : 'translateX(0)'
        }}
        role="menu"
      >
            <div className="relative flex items-center justify-center gap-2">
              <button
                onClick={goToPrevious}
                disabled={!canGoLeft}
                className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                  canGoLeft
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                aria-label="Previous actions"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 min-w-0 flex-1">
                {visibleActions.map((action, index) => {
                  if (!action || !action.icon) return null;
                  const IconComponent = action.icon;
                  const hasSubActions = action.subActions && action.subActions.length > 0;
                  const isExpanded = expandedAction === action.id;

                  return (
                    <div
                      key={action.id}
                      className={`flex flex-col items-center ${
                        animationEnabled ? 'animate-fadeIn' : ''
                      }`}
                      style={{
                        animationDelay: animationEnabled ? `${index * 100}ms` : '0ms'
                      }}
                    >
                      <button
                        onClick={() => handleAction(action)}
                        disabled={action.disabled}
                        className={`${buttonSizeClass} flex items-center justify-center rounded-lg transition-all relative ${
                          action.disabled
                            ? 'opacity-50 cursor-not-allowed bg-gray-100 border border-gray-200'
                            : `cursor-pointer bg-white hover:bg-gray-50 border border-gray-300 hover:border-blue-500 shadow-sm hover:shadow ${
                                animationEnabled ? 'hover:scale-105' : ''
                              }`
                        } ${action.color || 'text-gray-700'} ${isExpanded ? 'border-blue-500 bg-blue-50' : ''}`}
                        title={action.tooltip || action.label}
                        aria-label={action.label}
                        role="menuitem"
                        aria-haspopup={hasSubActions ? 'true' : undefined}
                        aria-expanded={hasSubActions ? isExpanded : undefined}
                      >
                        <IconComponent className={iconSizeClass} />
                        {hasSubActions && (
                          <ChevronDown className="w-3 h-3 absolute bottom-0 right-0 opacity-50" />
                        )}
                      </button>
                      {showLabels && (
                        <span className="text-[10px] mt-1 font-medium text-gray-600 text-center max-w-[80px] truncate">
                          {action.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={goToNext}
                disabled={!canGoRight}
                className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                  canGoRight
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                aria-label="Next actions"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {totalPages > 1 && (
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        idx === currentIndex
                          ? 'bg-blue-600 w-3'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to page ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
            {expandedAction && (() => {
              const parentAction = actions.find(a => a.id === expandedAction);
              if (!parentAction || !parentAction.subActions) return null;

              return (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-500 mb-2 text-center">
                    {parentAction.label}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    {parentAction.subActions.map((subAction) => {
                      if (!subAction || !subAction.icon) return null;
                      const SubIconComponent = subAction.icon;
                      return (
                        <div key={subAction.id} className="flex flex-col items-center">
                          <button
                            onClick={() => handleSubAction(subAction)}
                            disabled={subAction.disabled}
                            className={`${buttonSizeClass} flex items-center justify-center rounded-lg transition-all ${
                              subAction.disabled
                                ? 'opacity-50 cursor-not-allowed bg-gray-100 border border-gray-200'
                                : `cursor-pointer bg-white hover:bg-gray-50 border border-gray-300 hover:border-blue-500 shadow-sm hover:shadow ${
                                    animationEnabled ? 'hover:scale-105' : ''
                                  }`
                            } ${subAction.color || 'text-gray-700'}`}
                            title={subAction.tooltip || subAction.label}
                            aria-label={subAction.label}
                            role="menuitem"
                          >
                            <SubIconComponent className={iconSizeClass} />
                          </button>
                          {showLabels && (
                            <span className="text-[10px] mt-1 font-medium text-gray-600 text-center max-w-[80px] truncate">
                              {subAction.label}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
    </>
  );

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors ${triggerButtonSizeClass} ${triggerButtonClassName || ''}`}
        title="Actions"
        aria-label="Open actions carousel"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <LayoutGrid className={iconSizeClass} />
      </button>
      {isOpen && createPortal(carouselPanel, document.body)}
    </>
  );
};

export default CarouselDisplay;
