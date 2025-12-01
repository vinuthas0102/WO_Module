import React, { useState } from 'react';
import { X, AlertCircle, Lock, CheckCircle } from 'lucide-react';

type ActionType = 'complete' | 'close' | 'cancel';

interface ActionConfirmationModalProps {
  isOpen: boolean;
  actionType: ActionType;
  threadSubject: string;
  onConfirm: (notesOrReason: string) => Promise<void>;
  onCancel: () => void;
}

export const ActionConfirmationModal: React.FC<ActionConfirmationModalProps> = ({
  isOpen,
  actionType,
  threadSubject,
  onConfirm,
  onCancel
}) => {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const config = {
    complete: {
      title: 'Mark as Completed',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      borderColor: 'border-green-300',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      label: 'Completion Notes (Optional)',
      placeholder: 'Add any completion notes...',
      message: 'This will mark the clarification as successfully completed.',
      required: false
    },
    close: {
      title: 'Close Thread',
      icon: Lock,
      iconColor: 'text-gray-600',
      borderColor: 'border-gray-300',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
      buttonColor: 'bg-gray-600 hover:bg-gray-700',
      label: 'Closure Notes (Optional)',
      placeholder: 'Add any closure notes...',
      message: 'This will archive the thread without marking it as completed.',
      required: false
    },
    cancel: {
      title: 'Cancel Thread',
      icon: AlertCircle,
      iconColor: 'text-red-600',
      borderColor: 'border-red-300',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      label: 'Cancellation Reason (Required)',
      placeholder: 'Explain why this clarification is being cancelled...',
      message: 'This will invalidate the clarification request. This action requires a reason.',
      required: true
    }
  };

  const currentConfig = config[actionType];
  const Icon = currentConfig.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentConfig.required && (!input.trim() || input.trim().length < 10)) {
      setError('Please provide at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm(input.trim());
      setInput('');
      onCancel();
    } catch (err: any) {
      setError(err.message || 'Failed to perform action');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setInput('');
      setError(null);
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className={`px-6 py-4 border-b ${currentConfig.borderColor} ${currentConfig.bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon className={`w-6 h-6 ${currentConfig.iconColor}`} />
              <h3 className="text-lg font-semibold text-gray-900">{currentConfig.title}</h3>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-medium">Thread:</span> {threadSubject}
            </p>
            <p className={`text-sm ${currentConfig.textColor}`}>
              {currentConfig.message}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentConfig.label}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={currentConfig.placeholder}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              disabled={isSubmitting}
              required={currentConfig.required}
            />
            {currentConfig.required && input.trim().length > 0 && input.trim().length < 10 && (
              <p className="mt-1 text-xs text-gray-500">
                {input.trim().length}/10 characters minimum
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${currentConfig.buttonColor}`}
              disabled={isSubmitting || (currentConfig.required && input.trim().length < 10)}
            >
              {isSubmitting ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
