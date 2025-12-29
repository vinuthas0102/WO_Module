import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Minimize2, FileText, Package, ListChecks, ChevronRight } from 'lucide-react';

interface NavigationCard {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  colorClass: string;
  activeColorClass: string;
  enabled: boolean;
}

interface BreadcrumbItem {
  label: string;
  icon?: React.ReactNode;
}

interface FullScreenNavigableViewProps {
  isOpen: boolean;
  onClose: () => void;
  ticketNumber: string;
  ticketTitle: string;
  breadcrumbs: BreadcrumbItem[];
  contextInfo?: React.ReactNode;
  initialSection?: string;
  navigationCards: NavigationCard[];
  onSectionChange?: (sectionId: string) => void;
  children: (activeSectionId: string) => React.ReactNode;
}

const FullScreenNavigableView: React.FC<FullScreenNavigableViewProps> = ({
  isOpen,
  onClose,
  ticketNumber,
  ticketTitle,
  breadcrumbs,
  contextInfo,
  initialSection,
  navigationCards,
  onSectionChange,
  children,
}) => {
  const enabledCards = useMemo(() =>
    navigationCards.filter(card => card.enabled),
    [navigationCards]
  );

  const defaultSection = useMemo(() => {
    if (initialSection && enabledCards.some(card => card.id === initialSection)) {
      return initialSection;
    }
    return enabledCards[0]?.id || 'wo-info';
  }, [initialSection, enabledCards]);

  const [activeSection, setActiveSection] = useState<string>(defaultSection);

  useEffect(() => {
    if (defaultSection && activeSection !== defaultSection) {
      setActiveSection(defaultSection);
    }
  }, [defaultSection]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    if (onSectionChange) {
      onSectionChange(sectionId);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 shadow-lg">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="text-sm font-medium opacity-90 mb-1">Ticket #{ticketNumber}</div>
            <h2 className="text-2xl font-bold">{ticketTitle}</h2>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
              title="Exit Full Screen (ESC)"
            >
              <Minimize2 className="w-5 h-5" />
              <span className="text-sm">Exit Full Screen</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm opacity-90">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="mx-1">›</span>}
              <div className="flex items-center gap-1.5">
                {crumb.icon}
                <span>{crumb.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {contextInfo && (
          <div className="mt-3 pt-3 border-t border-white/20">
            {contextInfo}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="w-80 bg-gray-100 border-r border-gray-200 overflow-y-auto p-4 space-y-3">
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Navigation
            </h3>
          </div>

          {enabledCards.map((card) => {
            const isActive = activeSection === card.id;
            return (
              <button
                key={card.id}
                onClick={() => handleSectionChange(card.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  isActive
                    ? `${card.activeColorClass} shadow-md`
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-white/20' : card.colorClass}`}>
                      {card.icon}
                    </div>
                    <div>
                      <div className={`font-semibold ${isActive ? 'text-white' : 'text-gray-900'}`}>
                        {card.label}
                      </div>
                      {card.badge && (
                        <div className={`text-xs mt-1 ${isActive ? 'text-white/90' : 'text-gray-600'}`}>
                          {card.badge}
                        </div>
                      )}
                    </div>
                  </div>
                  {isActive && (
                    <ChevronRight className="w-5 h-5 text-white" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="p-6">
            {children(activeSection)}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FullScreenNavigableView;
