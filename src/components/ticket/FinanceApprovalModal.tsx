import React, { useState, useRef } from 'react';
import { X, CheckCircle, FileText, Upload, AlertCircle, IndianRupee } from 'lucide-react';
import { FinanceApproval } from '../../types';
import { FileService } from '../../services/fileService';

interface FinanceApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  approval: FinanceApproval;
  onApprove: (remarks: string, file: File | null) => Promise<void>;
  loading: boolean;
}

const FinanceApprovalModal: React.FC<FinanceApprovalModalProps> = ({
  isOpen,
  onClose,
  approval,
  onApprove,
  loading
}) => {
  const [remarks, setRemarks] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = FileService.validateFile(file);
    if (!validation.valid) {
      setFileError(validation.error || 'Invalid file');
      setSelectedFile(null);
      return;
    }

    setFileError(null);
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (remarks.trim().length > 0 && remarks.trim().length < 10) {
      alert('If providing remarks, they must be at least 10 characters');
      return;
    }

    try {
      await onApprove(remarks.trim(), selectedFile);
      setRemarks('');
      setSelectedFile(null);
      setFileError(null);
    } catch (error) {
      console.error('Error in modal submit:', error);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setRemarks('');
      setSelectedFile(null);
      setFileError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
          onClick={handleClose}
        ></div>

        <div className="relative bg-white rounded-lg shadow-2xl max-w-lg w-full border-2 border-green-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Approve Finance Request
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
            <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <IndianRupee className="w-4 h-4 text-green-700" />
                  <p className="text-green-900">
                    <strong>Cost:</strong> Rs {approval.tentativeCost.toLocaleString('en-IN')}
                  </p>
                </div>
                <p className="text-green-800">
                  <strong>Bearer:</strong> {approval.costDeductedFrom}
                </p>
                <div className="pt-2 border-t border-green-200">
                  <p className="text-xs text-green-700">
                    <strong>Requester Remarks:</strong>
                  </p>
                  <p className="text-xs text-green-800 mt-1 leading-relaxed">
                    {approval.remarks}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Approval Remarks <span className="text-gray-500 font-normal">(Optional)</span>
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
                placeholder="Provide any comments or notes about this approval (minimum 10 characters if provided)..."
                disabled={loading}
              />
              {remarks.length > 0 && (
                <p className={`text-xs mt-1 ${remarks.length >= 10 ? 'text-green-600' : 'text-amber-600'}`}>
                  {remarks.length}/10 characters minimum
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supporting Document <span className="text-gray-500 font-normal">(Optional)</span>
              </label>

              {fileError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
                  <p className="text-xs text-red-800">{fileError}</p>
                </div>
              )}

              {selectedFile ? (
                <div className="border-2 border-green-300 bg-green-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900">{selectedFile.name}</p>
                        <p className="text-xs text-green-700">
                          {FileService.formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-red-600 hover:text-red-800 text-sm"
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-green-600 hover:text-green-700 font-medium text-sm"
                    disabled={loading}
                  >
                    Click to upload
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, Images, Word, Excel (max 5MB)
                  </p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-blue-800 flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>
                  Approving this request will change the ticket status to "Approved by Finance"
                  and allow the work to be marked as completed.
                </span>
              </p>
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
                disabled={loading || (remarks.length > 0 && remarks.length < 10)}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{loading ? 'Approving...' : 'Approve Request'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FinanceApprovalModal;
