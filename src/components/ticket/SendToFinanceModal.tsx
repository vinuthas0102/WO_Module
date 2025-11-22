import React, { useState, useEffect } from 'react';
import { X, IndianRupee, FileText, User, AlertCircle } from 'lucide-react';
import { Ticket, CostDeductedFrom, FinanceApprovalRequest } from '../../types';
import { FinanceApprovalService } from '../../services/financeApprovalService';
import { useAuth } from '../../context/AuthContext';

interface SendToFinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  onSuccess: () => void;
}

const SendToFinanceModal: React.FC<SendToFinanceModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onSuccess
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [financeOfficers, setFinanceOfficers] = useState<Array<{ id: string; name: string; email: string; department: string }>>([]);
  const [formData, setFormData] = useState<{
    tentativeCost: string;
    costDeductedFrom: CostDeductedFrom | '';
    financeOfficerId: string;
    remarks: string;
  }>({
    tentativeCost: '',
    costDeductedFrom: '',
    financeOfficerId: '',
    remarks: ''
  });

  const [errors, setErrors] = useState<{
    tentativeCost?: string;
    costDeductedFrom?: string;
    financeOfficerId?: string;
    remarks?: string;
  }>({});

  useEffect(() => {
    if (isOpen) {
      loadFinanceOfficers();
    }
  }, [isOpen]);

  const loadFinanceOfficers = async () => {
    try {
      const officers = await FinanceApprovalService.getFinanceOfficers();
      setFinanceOfficers(officers);
    } catch (error) {
      console.error('Error loading finance officers:', error);
      alert('Failed to load finance officers. Please try again.');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    const cost = parseFloat(formData.tentativeCost);
    if (!formData.tentativeCost || isNaN(cost) || cost <= 0) {
      newErrors.tentativeCost = 'Please enter a valid cost greater than 0';
    }

    if (!formData.costDeductedFrom) {
      newErrors.costDeductedFrom = 'Please select who will bear the cost';
    }

    if (!formData.financeOfficerId) {
      newErrors.financeOfficerId = 'Please select a finance officer';
    }

    if (!formData.remarks || formData.remarks.trim().length < 10) {
      newErrors.remarks = 'Remarks must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) return;

    setLoading(true);
    try {
      const request: FinanceApprovalRequest = {
        ticketId: ticket.id,
        tentativeCost: parseFloat(formData.tentativeCost),
        costDeductedFrom: formData.costDeductedFrom as CostDeductedFrom,
        financeOfficerId: formData.financeOfficerId,
        remarks: formData.remarks.trim()
      };

      await FinanceApprovalService.submitToFinance(request, user.id);

      alert('Ticket successfully submitted to finance department for approval');

      setFormData({
        tentativeCost: '',
        costDeductedFrom: '',
        financeOfficerId: '',
        remarks: ''
      });
      setErrors({});

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting to finance:', error);
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Failed to submit to finance department. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      tentativeCost: '',
      costDeductedFrom: '',
      financeOfficerId: '',
      remarks: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const costBearerOptions: CostDeductedFrom[] = [
    'Current Tenant/Employee',
    'Vacating Tenant/Employee',
    'Borne by Management'
  ];

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" onClick={handleClose}></div>

        <div className="relative bg-white rounded-lg shadow-2xl max-w-lg w-full border-2 border-blue-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-2">
              <IndianRupee className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Send to Finance Department
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Ticket:</strong> {ticket.ticketNumber} - {ticket.title}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tentative Cost (Rs) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IndianRupee className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.tentativeCost}
                  onChange={(e) => setFormData({ ...formData, tentativeCost: e.target.value })}
                  className={`w-full pl-10 pr-3 py-2 border ${errors.tentativeCost ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm`}
                  placeholder="Enter estimated cost"
                  disabled={loading}
                />
              </div>
              {errors.tentativeCost && (
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.tentativeCost}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost to be Deducted From *
              </label>
              <select
                value={formData.costDeductedFrom}
                onChange={(e) => setFormData({ ...formData, costDeductedFrom: e.target.value as CostDeductedFrom })}
                className={`w-full px-3 py-2 border ${errors.costDeductedFrom ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm`}
                disabled={loading}
              >
                <option value="">Select cost bearer...</option>
                {costBearerOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.costDeductedFrom && (
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.costDeductedFrom}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Finance Officer *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  value={formData.financeOfficerId}
                  onChange={(e) => setFormData({ ...formData, financeOfficerId: e.target.value })}
                  className={`w-full pl-10 pr-3 py-2 border ${errors.financeOfficerId ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm`}
                  disabled={loading || financeOfficers.length === 0}
                >
                  <option value="">Select finance officer...</option>
                  {financeOfficers.map(officer => (
                    <option key={officer.id} value={officer.id}>
                      {officer.name} - {officer.department}
                    </option>
                  ))}
                </select>
              </div>
              {errors.financeOfficerId && (
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.financeOfficerId}
                </p>
              )}
              {financeOfficers.length === 0 && (
                <p className="text-xs text-amber-600 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  No finance officers available
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks *
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <FileText className="h-4 w-4 text-gray-400" />
                </div>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={4}
                  className={`w-full pl-10 pr-3 py-2 border ${errors.remarks ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm`}
                  placeholder="Provide details about the work, reason for cost, and any other relevant information (minimum 10 characters)..."
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                {errors.remarks ? (
                  <p className="text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.remarks}
                  </p>
                ) : (
                  <p className={`text-xs ${formData.remarks.length >= 10 ? 'text-green-600' : 'text-gray-500'}`}>
                    {formData.remarks.length}/10 characters minimum
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || financeOfficers.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center space-x-2"
              >
                <IndianRupee className="w-4 h-4" />
                <span>{loading ? 'Submitting...' : 'Submit to Finance'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SendToFinanceModal;
