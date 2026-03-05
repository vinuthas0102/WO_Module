import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { TrendingUp, CheckCircle, AlertCircle, Package, Calendar, FileText, Upload, X, Edit2, Send, Shield } from 'lucide-react';
import {
  SpecAllocationProgressService,
  SpecAllocationProgress,
  SpecAllocationProgressWithDetails
} from '../../services/specAllocationProgressService';
import { useAuth } from '../../context/AuthContext';
import { TicketService } from '../../services/ticketService';

interface SpecAllocationProgressTrackerProps {
  allocationId: string;
  ticketId: string;
  specDetails: {
    description: string;
    allocatedQuantity: number;
    unit: string;
  };
  workflowStepId?: string;
  onClose: () => void;
  onRefresh?: () => void;
}

export const SpecAllocationProgressTracker: React.FC<SpecAllocationProgressTrackerProps> = ({
  allocationId,
  ticketId,
  specDetails,
  workflowStepId,
  onClose,
  onRefresh
}) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<SpecAllocationProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<SpecAllocationProgressWithDetails | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [workDoneQuantity, setWorkDoneQuantity] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [measurementDate, setMeasurementDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [editedWorkDoneQuantity, setEditedWorkDoneQuantity] = useState<number>(0);
  const [editedComment, setEditedComment] = useState('');
  const [editedMeasurementDate, setEditedMeasurementDate] = useState('');

  useEffect(() => {
    loadEntries();
  }, [allocationId]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await SpecAllocationProgressService.getProgressEntries(allocationId);
      setEntries(data);
    } catch (error) {
      console.error('Error loading progress entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async () => {
    if (!user || workDoneQuantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    try {
      setSubmitting(true);
      await SpecAllocationProgressService.createProgressEntry(
        allocationId,
        ticketId,
        workDoneQuantity,
        comment,
        measurementDate,
        user.id
      );

      setWorkDoneQuantity(0);
      setComment('');
      setShowForm(false);
      await loadEntries();

      const newTotalCompleted = entries.reduce((sum, entry) => sum + entry.workDoneQuantity, 0) + workDoneQuantity;
      const newProgressPercentage = (newTotalCompleted / specDetails.allocatedQuantity) * 100;

      if (newProgressPercentage >= 100) {
        setNotification('Progress saved! This spec is now 100% complete. Task may be automatically completed.');
        setTimeout(() => setNotification(null), 5000);
      } else if (entries.length === 0) {
        setNotification('Progress saved! Task status updated to WIP.');
        setTimeout(() => setNotification(null), 4000);
      } else {
        setNotification('Progress entry saved successfully!');
        setTimeout(() => setNotification(null), 3000);
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('Error creating progress entry:', error);
      alert(error.message || 'Failed to create progress entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetails = async (entry: SpecAllocationProgress) => {
    try {
      const details = await SpecAllocationProgressService.getProgressEntryWithDetails(entry.id);
      setSelectedEntry(details);
    } catch (error) {
      console.error('Error loading entry details:', error);
    }
  };

  const handleUpdateStatus = async (entryId: string, status: 'submitted' | 'verified' | 'approved') => {
    if (!user) return;

    try {
      await SpecAllocationProgressService.updateProgressStatus(entryId, status, user.id);

      await TicketService.createAuditLog({
        ticketId,
        stepId: workflowStepId,
        action: status === 'submitted' ? 'SPEC_PROGRESS_SUBMITTED' : status === 'verified' ? 'SPEC_PROGRESS_VERIFIED' : 'SPEC_PROGRESS_APPROVED',
        actionCategory: 'workflow_action',
        description: `Spec progress entry #${entries.find(e => e.id === entryId)?.entryNumber} ${status}`,
        performedBy: user.id,
        metadata: {
          entryId,
          allocationId,
          status,
        },
      });

      await loadEntries();
      if (selectedEntry && selectedEntry.id === entryId) {
        const updated = await SpecAllocationProgressService.getProgressEntryWithDetails(entryId);
        setSelectedEntry(updated);
      }

      const totalCompleted = entries.reduce((sum, entry) => sum + entry.workDoneQuantity, 0);
      const progressPercentage = (totalCompleted / specDetails.allocatedQuantity) * 100;

      if (progressPercentage >= 100 && (status === 'verified' || status === 'approved')) {
        setNotification('Status updated! This spec is complete. Task may be automatically completed.');
        setTimeout(() => setNotification(null), 5000);
      } else {
        setNotification(`Status updated to ${status}!`);
        setTimeout(() => setNotification(null), 3000);
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(error.message || 'Failed to update status');
    }
  };

  const handleEditEntry = (entry: SpecAllocationProgressWithDetails) => {
    setIsEditingEntry(true);
    setEditedWorkDoneQuantity(entry.workDoneQuantity);
    setEditedComment(entry.comment || '');
    setEditedMeasurementDate(entry.measurementDate);
  };

  const handleCancelEdit = () => {
    setIsEditingEntry(false);
    setEditedWorkDoneQuantity(0);
    setEditedComment('');
    setEditedMeasurementDate('');
  };

  const handleSaveEdit = async () => {
    if (!user || !selectedEntry) return;

    if (editedWorkDoneQuantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    try {
      setSubmitting(true);

      await SpecAllocationProgressService.updateProgressEntry(
        selectedEntry.id,
        editedWorkDoneQuantity,
        editedComment,
        editedMeasurementDate
      );

      await TicketService.createAuditLog({
        ticketId,
        stepId: workflowStepId,
        action: 'SPEC_PROGRESS_UPDATED',
        actionCategory: 'workflow_action',
        description: `Spec progress entry #${selectedEntry.entryNumber} updated`,
        performedBy: user.id,
        metadata: {
          entryId: selectedEntry.id,
          allocationId,
          oldQuantity: selectedEntry.workDoneQuantity,
          newQuantity: editedWorkDoneQuantity,
        },
      });

      await loadEntries();
      const updated = await SpecAllocationProgressService.getProgressEntryWithDetails(selectedEntry.id);
      setSelectedEntry(updated);
      setIsEditingEntry(false);

      setNotification('Progress entry updated successfully!');
      setTimeout(() => setNotification(null), 3000);

      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('Error updating progress entry:', error);
      alert(error.message || 'Failed to update progress entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickSubmit = async (entry: SpecAllocationProgress, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm('Submit this entry for verification?')) return;
    await handleUpdateStatus(entry.id, 'submitted');
  };

  const handleQuickVerify = async (entry: SpecAllocationProgress, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm('Verify this entry?')) return;
    await handleUpdateStatus(entry.id, 'verified');
  };

  const handleQuickEdit = async (entry: SpecAllocationProgress, event: React.MouseEvent) => {
    event.stopPropagation();
    const details = await SpecAllocationProgressService.getProgressEntryWithDetails(entry.id);
    setSelectedEntry(details);
    handleEditEntry(details);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'submitted': return 'bg-blue-100 text-blue-700';
      case 'verified': return 'bg-green-100 text-green-700';
      case 'approved': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const totalCompleted = entries.reduce((sum, entry) => sum + entry.workDoneQuantity, 0);
  const progressPercentage = (totalCompleted / specDetails.allocatedQuantity) * 100;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Spec Progress Tracking</h2>
            <p className="text-sm text-gray-600">{specDetails.description}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {notification && (
          <div className="bg-green-50 border-b border-green-200 px-4 py-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">{notification}</p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                Allocated: {specDetails.allocatedQuantity} {specDetails.unit}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">
                Completed: {totalCompleted.toFixed(2)} {specDetails.unit}
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-600 mt-1 text-right">
            {progressPercentage.toFixed(1)}% Complete
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full mb-4 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
            >
              <TrendingUp className="w-5 h-5" />
              <span>Add Progress Entry</span>
            </button>
          )}

          {showForm && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">New Progress Entry</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Work Done Quantity ({specDetails.unit})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={workDoneQuantity}
                    onChange={(e) => setWorkDoneQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter quantity"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Measurement Date
                  </label>
                  <input
                    type="date"
                    value={measurementDate}
                    onChange={(e) => setMeasurementDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Comments
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Add any comments about this measurement..."
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleCreateEntry}
                    disabled={submitting || workDoneQuantity <= 0}
                    className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : 'Save Entry'}
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setWorkDoneQuantity(0);
                      setComment('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 text-sm">Loading progress entries...</div>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mb-3" />
              <h4 className="text-sm font-semibold text-gray-900 mb-1">No Progress Entries</h4>
              <p className="text-xs text-gray-600">
                Add your first progress entry to start tracking work completion
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const canEdit = user && SpecAllocationProgressService.canEditEntry(entry, user.id, user.role);
                const canSubmit = user && SpecAllocationProgressService.canSubmitEntry(entry, user.id, user.role);
                const canVerify = user && SpecAllocationProgressService.canVerifyEntry(entry, user.role);

                return (
                  <div
                    key={entry.id}
                    onClick={() => handleViewDetails(entry)}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-500">Entry #{entry.entryNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                          {entry.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(entry.measurementDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Work Done</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {entry.workDoneQuantity.toFixed(2)} {specDetails.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Cumulative</p>
                        <p className="text-sm font-semibold text-green-600">
                          {entry.cumulativeQuantity.toFixed(2)} {specDetails.unit}
                        </p>
                      </div>
                    </div>

                    {entry.comment && (
                      <div className="text-xs text-gray-600 border-t border-gray-100 pt-2 mt-2">
                        <FileText className="w-3 h-3 inline mr-1" />
                        {entry.comment}
                      </div>
                    )}

                    {(canEdit || canSubmit || canVerify) && (
                      <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-100">
                        {canEdit && (
                          <button
                            onClick={(e) => handleQuickEdit(entry, e)}
                            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                            title="Edit entry"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        )}
                        {canSubmit && (
                          <button
                            onClick={(e) => handleQuickSubmit(entry, e)}
                            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                            title="Submit for verification"
                          >
                            <Send className="w-3 h-3" />
                            <span>Submit</span>
                          </button>
                        )}
                        {canVerify && (
                          <button
                            onClick={(e) => handleQuickVerify(entry, e)}
                            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                            title="Verify entry"
                          >
                            <Shield className="w-3 h-3" />
                            <span>Verify</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedEntry && (
          <div className="fixed inset-0 z-[60] bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Progress Entry Details</h3>
                  <p className="text-sm text-gray-600">Entry #{selectedEntry.entryNumber}</p>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {isEditingEntry ? (
                    <>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p className="text-xs font-medium text-yellow-800">
                          Editing Entry - Changes will recalculate cumulative quantities for all subsequent entries
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Work Done Quantity ({specDetails.unit})
                        </label>
                        <input
                          type="number"
                          value={editedWorkDoneQuantity}
                          onChange={(e) => setEditedWorkDoneQuantity(parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={submitting}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Measurement Date
                        </label>
                        <input
                          type="date"
                          value={editedMeasurementDate}
                          onChange={(e) => setEditedMeasurementDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={submitting}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Comments (Optional)
                        </label>
                        <textarea
                          value={editedComment}
                          onChange={(e) => setEditedComment(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Add any notes or comments..."
                          disabled={submitting}
                        />
                      </div>

                      <div className="flex items-center space-x-2 pt-3">
                        <button
                          onClick={handleSaveEdit}
                          disabled={submitting}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={submitting}
                          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Work Done Quantity</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {selectedEntry.workDoneQuantity.toFixed(2)} {specDetails.unit}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Cumulative Total</p>
                            <p className="text-sm font-semibold text-green-600">
                              {selectedEntry.cumulativeQuantity.toFixed(2)} {specDetails.unit}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Measurement Date</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(selectedEntry.measurementDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Status</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedEntry.status)}`}>
                              {selectedEntry.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {selectedEntry.comment && (
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-2">Comments</p>
                          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                            {selectedEntry.comment}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-2">Measured By</p>
                    <p className="text-sm text-gray-900">
                      {selectedEntry.measuredByUser?.full_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedEntry.measuredByUser?.email}
                    </p>
                  </div>

                  {selectedEntry.submittedBy && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">Submitted By</p>
                      <p className="text-sm text-gray-900">
                        {selectedEntry.submittedByUser?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedEntry.submittedAt &&
                          `Submitted on ${new Date(selectedEntry.submittedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  )}

                  {selectedEntry.verifiedBy && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">Verified By</p>
                      <p className="text-sm text-gray-900">
                        {selectedEntry.verifiedByUser?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedEntry.verificationDate &&
                          `Verified on ${new Date(selectedEntry.verificationDate).toLocaleDateString()}`}
                      </p>
                    </div>
                  )}

                  {!isEditingEntry && user && (
                    <div className="space-y-2">
                      {SpecAllocationProgressService.canEditEntry(selectedEntry, user.id, user.role) && (
                        <button
                          onClick={() => handleEditEntry(selectedEntry)}
                          className="w-full px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 flex items-center justify-center space-x-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Edit Entry</span>
                        </button>
                      )}

                      {SpecAllocationProgressService.canSubmitEntry(selectedEntry, user.id, user.role) && (
                        <button
                          onClick={() => handleUpdateStatus(selectedEntry.id, 'submitted')}
                          className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2"
                        >
                          <Send className="w-4 h-4" />
                          <span>Submit for Verification</span>
                        </button>
                      )}

                      {SpecAllocationProgressService.canVerifyEntry(selectedEntry, user.role) && (
                        <button
                          onClick={() => handleUpdateStatus(selectedEntry.id, 'verified')}
                          className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 flex items-center justify-center space-x-2"
                        >
                          <Shield className="w-4 h-4" />
                          <span>Verify Entry</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
