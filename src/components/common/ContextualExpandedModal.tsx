import React, { useEffect } from 'react';
import { X, Minimize2 } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  icon?: React.ReactNode;
}

interface ContextualExpandedModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketNumber: string;
  ticketTitle: string;
  breadcrumbs: BreadcrumbItem[];
  contextInfo?: React.ReactNode;
  children: React.ReactNode;
}

const ContextualExpandedModal: React.FC<ContextualExpandedModalProps> = ({
  isOpen,
  onClose,
  ticketNumber,
  ticketTitle,
  breadcrumbs,
  contextInfo,
  children,
}) => {
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

  if (!isOpen) return null;

  return (
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

      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        {children}
      </div>
    </div>
  );
};

export default ContextualExpandedModal;
