import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, CheckCircle, Lock, Ban, XCircle } from 'lucide-react';
import { ClarificationThreadStatus } from '../../types';

interface ActionMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  hoverColor: string;
  action: () => void;
}

interface ClarificationActionMenuProps {
  threadStatus: ClarificationThreadStatus;
  canTakeAdminAction: boolean;
  onComplete: () => void;
  onClose: () => void;
  onCancel: () => void;
  onReopen: () => void;
}

export const ClarificationActionMenu: React.FC<ClarificationActionMenuProps> = ({
  threadStatus,
  canTakeAdminAction,
  onComplete,
  onClose,
  onCancel,
  onReopen
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const getAvailableActions = (): ActionMenuItem[] => {
    const actions: ActionMenuItem[] = [];

    if (threadStatus === 'OPEN') {
      if (canTakeAdminAction) {
        actions.push({
          id: 'complete',
          label: 'Complete',
          icon: CheckCircle,
          color: 'text-green-700',
          bgColor: 'bg-green-50',
          hoverColor: 'hover:bg-green-100',
          action: () => {
            setIsOpen(false);
            onComplete();
          }
        });

        actions.push({
          id: 'close',
          label: 'Close',
          icon: Lock,
          color: 'text-gray-700',
          bgColor: 'bg-gray-50',
          hoverColor: 'hover:bg-gray-100',
          action: () => {
            setIsOpen(false);
            onClose();
          }
        });

        actions.push({
          id: 'cancel',
          label: 'Cancel',
          icon: Ban,
          color: 'text-red-700',
          bgColor: 'bg-red-50',
          hoverColor: 'hover:bg-red-100',
          action: () => {
            setIsOpen(false);
            onCancel();
          }
        });
      }
    }

    if (threadStatus === 'RESOLVED') {
      if (canTakeAdminAction) {
        actions.push({
          id: 'complete',
          label: 'Complete',
          icon: CheckCircle,
          color: 'text-green-700',
          bgColor: 'bg-green-50',
          hoverColor: 'hover:bg-green-100',
          action: () => {
            setIsOpen(false);
            onComplete();
          }
        });

        actions.push({
          id: 'close',
          label: 'Close',
          icon: Lock,
          color: 'text-gray-700',
          bgColor: 'bg-gray-50',
          hoverColor: 'hover:bg-gray-100',
          action: () => {
            setIsOpen(false);
            onClose();
          }
        });
      }

    }

    if (threadStatus === 'COMPLETED' || threadStatus === 'CLOSED' || threadStatus === 'CANCELLED') {
      if (canTakeAdminAction) {
        actions.push({
          id: 'reopen',
          label: 'Reopen',
          icon: XCircle,
          color: 'text-blue-700',
          bgColor: 'bg-blue-50',
          hoverColor: 'hover:bg-blue-100',
          action: () => {
            setIsOpen(false);
            onReopen();
          }
        });
      }
    }

    return actions;
  };

  const actions = getAvailableActions();

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
        title="Actions"
        aria-label="Open actions menu"
        aria-expanded={isOpen}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[110]">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.action}
                className={`w-full text-left px-4 py-2 flex items-center space-x-3 ${action.hoverColor} transition-colors ${
                  index !== actions.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className={`p-1.5 rounded ${action.bgColor}`}>
                  <Icon className={`w-4 h-4 ${action.color}`} />
                </div>
                <span className={`text-sm font-medium ${action.color}`}>
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
