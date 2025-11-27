import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, AlertCircle, CheckCircle, Layers, Upload, Paperclip } from 'lucide-react';
import { BulkTicketRow, BulkTicketInput, TicketStatus } from '../../types';
import { useTickets } from '../../context/TicketContext';
import { useAuth } from '../../context/AuthContext';
import { getModuleTerminology } from '../../lib/utils';

interface BulkTicketCreationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const BulkTicketCreationModal: React.FC<BulkTicketCreationModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { users, createTicketsBulk, bulkOperationInProgress } = useTickets();
  const { user, selectedModule } = useAuth();
  const terminology = getModuleTerminology(selectedModule?.id, 'singular');
  const terminologyPlural = getModuleTerminology(selectedModule?.id, 'plural');
  const [rows, setRows] = useState<BulkTicketRow[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [operationResult, setOperationResult] = useState<{
    success: boolean;
    message: string;
    errors?: Array<{ index: number; title: string; error: string }>;
  } | null>(null);

  useEffect(() => {
    const initialRows: BulkTicketRow[] = Array.from({ length: 5 }, (_, i) => ({
      rowId: `row-${Date.now()}-${i}`,
      title: '',
      description: '',
      status: 'DRAFT' as TicketStatus,
      priority: 'MEDIUM' as const,
      category: 'General',
      assignedTo: '',
      department: user?.department || '',
      propertyId: 'PROP001',
      propertyLocation: 'Location01',
      attachments: null,
      errors: {},
    }));
    setRows(initialRows);
  }, [user]);

  const validateRow = (row: BulkTicketRow): boolean => {
    const errors: Record<string, string> = {};

    if (!row.title || row.title.trim() === '') {
      errors.title = 'Title is required';
    }

    if (!row.department || row.department.trim() === '') {
      errors.department = 'Department is required';
    }

    if (!row.propertyId || row.propertyId.trim() === '') {
      errors.propertyId = 'Property ID is required';
    }

    if (!row.propertyLocation || row.propertyLocation.trim() === '') {
      errors.propertyLocation = 'Property Location is required';
    }

    row.errors = errors;
    return Object.keys(errors).length === 0;
  };

  const updateRow = (rowId: string, field: keyof BulkTicketRow, value: any) => {
    setRows(prev => prev.map(row => {
      if (row.rowId === rowId) {
        const updated = { ...row, [field]: value };
        validateRow(updated);
        return updated;
      }
      return row;
    }));
  };

  const handleFileChange = (rowId: string, files: FileList | null) => {
    updateRow(rowId, 'attachments', files);
  };

  const addMoreRows = (count: number = 1) => {
    const newRows: BulkTicketRow[] = Array.from({ length: count }, (_, i) => ({
      rowId: `row-${Date.now()}-${i}`,
      title: '',
      description: '',
      status: 'DRAFT' as TicketStatus,
      priority: 'MEDIUM' as const,
      category: 'General',
      assignedTo: '',
      department: user?.department || '',
      propertyId: 'PROP001',
      propertyLocation: 'Location01',
      attachments: null,
      errors: {},
    }));
    setRows(prev => [...prev, ...newRows]);
  };

  const removeRow = (rowId: string) => {
    if (rows.length > 1) {
      setRows(prev => prev.filter(row => row.rowId !== rowId));
    }
  };

  const clearAllRows = () => {
    const clearedRows = rows.map(row => ({
      ...row,
      title: '',
      description: '',
      status: 'DRAFT' as TicketStatus,
      priority: 'MEDIUM' as const,
      category: 'General',
      assignedTo: '',
      department: user?.department || '',
      propertyId: 'PROP001',
      propertyLocation: 'Location01',
      attachments: null,
      errors: {},
    }));
    setRows(clearedRows);
  };

  const getValidRows = (): BulkTicketRow[] => {
    return rows.filter(row => row.title && row.title.trim() !== '');
  };

  const handleSubmit = () => {
    const validRows = getValidRows();

    if (validRows.length === 0) {
      alert('Please fill in at least one ticket with a title before saving.');
      return;
    }

    const allValid = validRows.every(row => validateRow(row));

    if (!allValid) {
      alert('Please fix validation errors before saving.');
      return;
    }

    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmation(false);
    const validRows = getValidRows();

    const ticketsToCreate: BulkTicketInput[] = validRows.map(row => ({
      title: row.title.trim(),
      description: row.description?.trim(),
      status: row.status,
      priority: row.priority,
      category: row.category,
      assignedTo: row.assignedTo || undefined,
      department: row.department.trim(),
      propertyId: row.propertyId.trim(),
      propertyLocation: row.propertyLocation.trim(),
      dueDate: row.dueDate,
    }));

    try {
      const result = await createTicketsBulk(ticketsToCreate);

      if (result.successCount === ticketsToCreate.length) {
        setOperationResult({
          success: true,
          message: `Successfully created ${result.successCount} ticket${result.successCount !== 1 ? 's' : ''}!`,
        });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setOperationResult({
          success: false,
          message: `Created ${result.successCount} of ${ticketsToCreate.length} tickets. ${result.failedCount} failed.`,
          errors: result.errors,
        });
      }
    } catch (error) {
      setOperationResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create tickets',
      });
    }
  };

  const validRowsCount = getValidRows().length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center space-x-2">
                <Layers className="w-6 h-6" />
                <span>Bulk Create {terminologyPlural}</span>
              </h2>
              <p className="text-orange-100 text-sm mt-1">
                Create multiple {terminologyPlural.toLowerCase()} at once for {selectedModule?.name || 'your module'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-red-600 rounded p-2 transition-colors"
              disabled={bulkOperationInProgress}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="mt-3 flex items-center space-x-4 text-sm">
            <span className="bg-red-600 px-3 py-1 rounded-full">
              Total Rows: {rows.length}
            </span>
            <span className="bg-red-600 px-3 py-1 rounded-full">
              Valid Tickets: {validRowsCount}
            </span>
            <span className="bg-red-600 px-3 py-1 rounded-full">
              Empty Rows: {rows.length - validRowsCount}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => addMoreRows(1)}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                disabled={bulkOperationInProgress}
              >
                <Plus className="w-4 h-4" />
                <span>Add 1 Row</span>
              </button>
              <button
                onClick={() => addMoreRows(5)}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                disabled={bulkOperationInProgress}
              >
                <Plus className="w-4 h-4" />
                <span>Add 5 Rows</span>
              </button>
              <button
                onClick={clearAllRows}
                className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                disabled={bulkOperationInProgress}
              >
                <X className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Tip: Only rows with titles will be saved
            </div>
          </div>

          <div className="space-y-3">
            {rows.map((row, index) => (
              <div
                key={row.rowId}
                className={`border rounded-lg p-4 transition-colors ${
                  row.title ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-700">
                    {index + 1}
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={row.title}
                        onChange={(e) => updateRow(row.rowId, 'title', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          row.errors?.title ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter ticket title"
                        disabled={bulkOperationInProgress}
                      />
                      {row.errors?.title && (
                        <p className="text-xs text-red-600 mt-1">{row.errors.title}</p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={row.description}
                        onChange={(e) => updateRow(row.rowId, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Enter ticket description"
                        rows={2}
                        disabled={bulkOperationInProgress}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={row.status}
                        onChange={(e) => updateRow(row.rowId, 'status', e.target.value as TicketStatus)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        disabled={bulkOperationInProgress}
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="CREATED">Created</option>
                        <option value="APPROVED">Approved</option>
                        <option value="ACTIVE">Active</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={row.priority}
                        onChange={(e) => updateRow(row.rowId, 'priority', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        disabled={bulkOperationInProgress}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={row.category}
                        onChange={(e) => updateRow(row.rowId, 'category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="General"
                        disabled={bulkOperationInProgress}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Assigned To
                      </label>
                      <select
                        value={row.assignedTo}
                        onChange={(e) => updateRow(row.rowId, 'assignedTo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        disabled={bulkOperationInProgress}
                      >
                        <option value="">Unassigned</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Est Completion Date
                      </label>
                      <input
                        type="date"
                        value={row.dueDate ? new Date(row.dueDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => updateRow(row.rowId, 'dueDate', e.target.value ? new Date(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        min={new Date().toISOString().split('T')[0]}
                        disabled={bulkOperationInProgress}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={row.department}
                        onChange={(e) => updateRow(row.rowId, 'department', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          row.errors?.department ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Department name"
                        disabled={bulkOperationInProgress}
                      />
                      {row.errors?.department && (
                        <p className="text-xs text-red-600 mt-1">{row.errors.department}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Property ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={row.propertyId}
                        onChange={(e) => updateRow(row.rowId, 'propertyId', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          row.errors?.propertyId ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="PROP001"
                        disabled={bulkOperationInProgress}
                      />
                      {row.errors?.propertyId && (
                        <p className="text-xs text-red-600 mt-1">{row.errors.propertyId}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Property Location <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={row.propertyLocation}
                        onChange={(e) => updateRow(row.rowId, 'propertyLocation', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm ${
                          row.errors?.propertyLocation ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Location01"
                        disabled={bulkOperationInProgress}
                      />
                      {row.errors?.propertyLocation && (
                        <p className="text-xs text-red-600 mt-1">{row.errors.propertyLocation}</p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Attachments
                      </label>
                      <div className="flex items-center space-x-2">
                        <label className="flex-1 flex items-center justify-center px-3 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                          <Upload className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-xs text-gray-600">
                            {row.attachments && row.attachments.length > 0
                              ? `${row.attachments.length} file${row.attachments.length !== 1 ? 's' : ''} selected`
                              : 'Upload files'}
                          </span>
                          <input
                            type="file"
                            multiple
                            onChange={(e) => handleFileChange(row.rowId, e.target.files)}
                            className="sr-only"
                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xlsx,.xls"
                            disabled={bulkOperationInProgress}
                          />
                        </label>
                        {row.attachments && row.attachments.length > 0 && (
                          <button
                            onClick={() => handleFileChange(row.rowId, null)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            disabled={bulkOperationInProgress}
                            title="Clear files"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {row.attachments && row.attachments.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Array.from(row.attachments).map((file, fileIndex) => (
                            <div
                              key={fileIndex}
                              className="flex items-center space-x-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{file.name}</span>
                              <span className="text-blue-500">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => removeRow(row.rowId)}
                    className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={rows.length === 1 || bulkOperationInProgress}
                    title="Remove row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 bg-gray-50 p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {validRowsCount} ticket{validRowsCount !== 1 ? 's' : ''} ready to create
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              disabled={bulkOperationInProgress}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm disabled:opacity-50"
              disabled={validRowsCount === 0 || bulkOperationInProgress}
            >
              <Save className="w-4 h-4" />
              <span>{bulkOperationInProgress ? 'Creating...' : `Create ${validRowsCount} ${validRowsCount !== 1 ? terminologyPlural : terminology}`}</span>
            </button>
          </div>
        </div>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Bulk Creation</h3>
                <p className="text-sm text-gray-600 mb-4">
                  You are about to create <strong>{validRowsCount}</strong> ticket{validRowsCount !== 1 ? 's' : ''}. This action will:
                </p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 mb-4">
                  <li>Generate {validRowsCount} new ticket{validRowsCount !== 1 ? 's' : ''}</li>
                  <li>Assign ticket numbers automatically</li>
                  <li>Notify assigned users (if specified)</li>
                </ul>
                <p className="text-sm text-gray-600 font-medium">
                  Do you want to proceed?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                disabled={bulkOperationInProgress}
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                disabled={bulkOperationInProgress}
              >
                {bulkOperationInProgress ? 'Creating...' : `Yes, Create ${terminologyPlural}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {operationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-start space-x-3 mb-4">
              {operationResult.success ? (
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className={`text-lg font-bold mb-2 ${operationResult.success ? 'text-green-900' : 'text-red-900'}`}>
                  {operationResult.success ? 'Success!' : 'Partial Success'}
                </h3>
                <p className="text-sm text-gray-700">{operationResult.message}</p>
              </div>
            </div>

            {operationResult.errors && operationResult.errors.length > 0 && (
              <div className="flex-1 overflow-y-auto">
                <h4 className="font-semibold text-sm text-gray-900 mb-2">Failed Tickets:</h4>
                <div className="space-y-2">
                  {operationResult.errors.map((error, idx) => (
                    <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-900">Row {error.index + 1}: {error.title}</p>
                      <p className="text-xs text-red-700 mt-1">{error.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end mt-6">
              <button
                onClick={() => {
                  if (operationResult.success) {
                    onSuccess();
                    onClose();
                  } else {
                    setOperationResult(null);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                {operationResult.success ? 'Close' : 'Continue Editing'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkTicketCreationModal;
