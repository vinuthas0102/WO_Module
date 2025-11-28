import React, { useState } from 'react';
import { X, Save, FileCheck, AlertCircle } from 'lucide-react';

interface InlineSpecCreationProps {
  ticketId: string;
  ticketNumber: string;
  stepId: string;
  stepTitle: string;
  userId: string;
  onClose: () => void;
  onSpecCreated: () => void;
}

const InlineSpecCreation: React.FC<InlineSpecCreationProps> = ({
  ticketId,
  ticketNumber,
  stepId,
  stepTitle,
  userId,
  onClose,
  onSpecCreated,
}) => {
  const [formData, setFormData] = useState({
    specCode: '',
    description: '',
    workChunk: '',
    category: '',
    quantity: 0,
    unit: 'sqft',
    remarks: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const categories = ['Civil Work', 'Electrical Work', 'Plumbing Work', 'HVAC Work', 'Carpentry', 'Painting'];
  const units = ['nos', 'kgs', 'meters', 'sqft', 'sqm', 'liters', 'units', 'boxes', 'bags', 'rolls'];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.specCode.trim()) {
      newErrors.specCode = 'Spec code is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.workChunk.trim()) {
      newErrors.workChunk = 'Work chunk is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const { WorkOrderSpecService } = await import('../../services/workOrderSpecService');

      await WorkOrderSpecService.createSpecWithAutoAllocation(
        {
          specCode: formData.specCode,
          description: formData.description,
          workChunk: formData.workChunk,
          category: formData.category,
          defaultQuantity: formData.quantity,
          unit: formData.unit,
          isActive: true,
        },
        ticketId,
        stepId,
        formData.quantity,
        formData.remarks,
        userId
      );

      onSpecCreated();
      onClose();
    } catch (error: any) {
      console.error('Error creating spec:', error);
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        setErrors({ specCode: 'A spec with this code already exists' });
      } else {
        alert('Failed to create spec. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Add Specifications</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>{ticketNumber}</span>
                <span>•</span>
                <span className="font-medium">{stepTitle}</span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          disabled={submitting}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Creating New Specification</p>
              <p className="text-xs mt-1">This spec will be added to the master list and automatically allocated to this task.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spec Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.specCode}
              onChange={(e) => handleChange('specCode', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.specCode
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="e.g., SPEC-001"
              disabled={submitting}
            />
            {errors.specCode && (
              <p className="mt-1 text-xs text-red-600">{errors.specCode}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.description
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Detailed description of the specification"
              disabled={submitting}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Chunk <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.workChunk}
              onChange={(e) => handleChange('workChunk', e.target.value)}
              rows={2}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.workChunk
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Work to be performed"
              disabled={submitting}
            />
            {errors.workChunk && (
              <p className="mt-1 text-xs text-red-600">{errors.workChunk}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.category
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              disabled={submitting}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-xs text-red-600">{errors.category}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.quantity
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                disabled={submitting}
              />
              {errors.quantity && (
                <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional remarks or notes"
              disabled={submitting}
            />
          </div>
        </form>
      </div>

      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Creating...' : 'Create & Allocate'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InlineSpecCreation;
