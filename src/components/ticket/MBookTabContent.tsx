import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, CheckCircle, AlertCircle, Calendar, DollarSign, Package, Filter, Edit, Trash2, Check, Send } from 'lucide-react';
import {
  MeasurementBookService,
  MeasurementBookEntryWithDetails
} from '../../services/measurementBookService';
import { WorkOrderSpecService } from '../../services/workOrderSpecService';
import { useAuth } from '../../context/AuthContext';
import { ActionIconDefinition } from '../../types';
import IconDisplayWrapper from '../iconDisplay/IconDisplayWrapper';
import { UserPreferencesService } from '../../services/userPreferencesService';
import TabExpandButton from '../common/TabExpandButton';

interface MBookTabContentProps {
  ticketId: string;
  ticketNumber: string;
  onRefresh?: () => void;
  onExpand?: () => void;
}

interface AllocationWithDetails {
  id: string;
  allocated_quantity: number;
  workflow_step?: { id: string; title: string };
  specDetail: any;
}

interface BatchEntryData {
  allocationId: string;
  description: string;
  quantityMeasured: number;
  rate: number;
}

export const MBookTabContent: React.FC<MBookTabContentProps> = ({
  ticketId,
  ticketNumber,
  onRefresh,
  onExpand
}) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<MeasurementBookEntryWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MeasurementBookEntryWithDetails | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<MeasurementBookEntryWithDetails | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(true);

  const [formData, setFormData] = useState({
    specAllocationId: '',
    description: '',
    quantityMeasured: 0,
    unit: '',
    rate: 0,
    workType: 'work' as 'work' | 'procurement',
    entryDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });
  const [allocations, setAllocations] = useState<AllocationWithDetails[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedAllocations, setSelectedAllocations] = useState<Set<string>>(new Set());
  const [batchEntries, setBatchEntries] = useState<Record<string, BatchEntryData>>({});
  const [commonData, setCommonData] = useState({
    workType: 'work' as 'work' | 'procurement',
    entryDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  useEffect(() => {
    loadEntries();
    loadSpecAllocations();
  }, [ticketId]);

  useEffect(() => {
    const loadPreferences = async () => {
      if (user) {
        try {
          const prefs = await UserPreferencesService.getUserPreferences(user.id);
          setUserPreferences(prefs);
        } catch (error) {
          console.error('Failed to load user preferences:', error);
        } finally {
          setLoadingPreferences(false);
        }
      } else {
        setLoadingPreferences(false);
      }
    };
    loadPreferences();
  }, [user]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await MeasurementBookService.getMbookEntriesByTicket(ticketId);
      setEntries(data);
    } catch (error) {
      console.error('Error loading mbook entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSpecAllocations = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      const specDetails = await WorkOrderSpecService.getSpecDetailsByTicket(ticketId);

      const allAllocations = await Promise.all(
        specDetails.flatMap(async (spec) => {
          const { data, error } = await supabase
            .from('work_order_spec_allocations')
            .select(`
              *,
              workflow_step:workflow_steps(id, title)
            `)
            .eq('spec_detail_id', spec.id);

          if (error) return [];
          return (data || []).map((alloc: any) => ({
            ...alloc,
            specDetail: spec,
          }));
        })
      );

      setAllocations(allAllocations.flat());
    } catch (error) {
      console.error('Error loading spec allocations:', error);
    }
  };

  const handleAllocationChange = (allocationId: string) => {
    const allocation = allocations.find(a => a.id === allocationId);
    if (allocation) {
      setFormData(prev => ({
        ...prev,
        specAllocationId: allocationId,
        unit: allocation.specDetail.unit || '',
      }));
    }
  };

  const handleSubmit = async () => {
    if (!user || !formData.specAllocationId || formData.quantityMeasured <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      if (editingEntry) {
        await MeasurementBookService.updateMbookEntry(
          editingEntry.id,
          formData.description,
          formData.quantityMeasured,
          formData.rate,
          formData.entryDate,
          formData.remarks
        );
      } else {
        await MeasurementBookService.createMbookEntry(
          ticketId,
          formData.specAllocationId,
          undefined,
          formData.description,
          formData.quantityMeasured,
          formData.unit,
          formData.rate,
          formData.workType,
          formData.entryDate,
          formData.remarks,
          user.id
        );
      }

      resetForm();
      await loadEntries();
      onRefresh?.();
    } catch (error: any) {
      console.error('Error saving mbook entry:', error);
      alert(error.message || 'Failed to save entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchSubmit = async () => {
    if (!user || selectedAllocations.size === 0) {
      alert('Please select at least one spec allocation');
      return;
    }

    const invalidEntries = Array.from(selectedAllocations).filter(
      allocId => !batchEntries[allocId] || batchEntries[allocId].quantityMeasured <= 0
    );

    if (invalidEntries.length > 0) {
      alert('Please enter valid quantity for all selected specs');
      return;
    }

    try {
      setSubmitting(true);

      const entriesData = Array.from(selectedAllocations).map(allocId => {
        const entry = batchEntries[allocId];
        const allocation = allocations.find(a => a.id === allocId);
        return {
          specAllocationId: allocId,
          description: entry.description,
          quantityMeasured: entry.quantityMeasured,
          unit: allocation?.specDetail.unit || '',
          rate: entry.rate,
        };
      });

      const results = await MeasurementBookService.createBatchMbookEntries(
        ticketId,
        entriesData,
        commonData.workType,
        commonData.entryDate,
        commonData.remarks,
        user.id
      );

      if (results.failed.length > 0) {
        alert(`Created ${results.success.length} entries. ${results.failed.length} failed.`);
      } else {
        alert(`Successfully created ${results.success.length} entries`);
      }

      resetBatchForm();
      await loadEntries();
      onRefresh?.();
    } catch (error: any) {
      console.error('Error creating batch entries:', error);
      alert(error.message || 'Failed to create entries');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (entry: MeasurementBookEntryWithDetails) => {
    setEditingEntry(entry);
    setFormData({
      specAllocationId: entry.specAllocationId || '',
      description: entry.description,
      quantityMeasured: entry.quantityMeasured,
      unit: entry.unit,
      rate: entry.rate,
      workType: entry.workType,
      entryDate: entry.entryDate,
      remarks: entry.remarks || '',
    });
    setShowForm(true);
    setMultiSelectMode(false);
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      await MeasurementBookService.deleteMbookEntry(entryId);
      await loadEntries();
      onRefresh?.();
    } catch (error: any) {
      console.error('Error deleting entry:', error);
      alert(error.message || 'Failed to delete entry');
    }
  };

  const handleUpdateStatus = async (entryId: string, status: 'submitted' | 'verified' | 'approved') => {
    if (!user) return;

    try {
      await MeasurementBookService.updateMbookStatus(entryId, status, user.id);
      await loadEntries();
      if (selectedEntry && selectedEntry.id === entryId) {
        const updated = await MeasurementBookService.getMbookEntryById(entryId);
        setSelectedEntry(updated);
      }
      onRefresh?.();
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(error.message || 'Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      specAllocationId: '',
      description: '',
      quantityMeasured: 0,
      unit: '',
      rate: 0,
      workType: 'work',
      entryDate: new Date().toISOString().split('T')[0],
      remarks: '',
    });
    setEditingEntry(null);
    setShowForm(false);
    setMultiSelectMode(false);
  };

  const resetBatchForm = () => {
    setSelectedAllocations(new Set());
    setBatchEntries({});
    setCommonData({
      workType: 'work',
      entryDate: new Date().toISOString().split('T')[0],
      remarks: '',
    });
    setMultiSelectMode(false);
    setShowForm(false);
  };

  const toggleAllocationSelection = (allocationId: string) => {
    const newSelected = new Set(selectedAllocations);
    if (newSelected.has(allocationId)) {
      newSelected.delete(allocationId);
      const newEntries = { ...batchEntries };
      delete newEntries[allocationId];
      setBatchEntries(newEntries);
    } else {
      newSelected.add(allocationId);
      const allocation = allocations.find(a => a.id === allocationId);
      if (allocation && !batchEntries[allocationId]) {
        setBatchEntries({
          ...batchEntries,
          [allocationId]: {
            allocationId,
            description: '',
            quantityMeasured: 0,
            rate: 0,
          },
        });
      }
    }
    setSelectedAllocations(newSelected);
  };

  const updateBatchEntry = (allocationId: string, field: keyof BatchEntryData, value: any) => {
    setBatchEntries({
      ...batchEntries,
      [allocationId]: {
        ...batchEntries[allocationId],
        [field]: value,
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'submitted': return 'bg-blue-100 text-blue-700';
      case 'verified': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredEntries = filterStatus === 'all'
    ? entries
    : entries.filter(e => e.status === filterStatus);

  const statusCounts = {
    all: entries.length,
    draft: entries.filter(e => e.status === 'draft').length,
    submitted: entries.filter(e => e.status === 'submitted').length,
    verified: entries.filter(e => e.status === 'verified').length,
    approved: entries.filter(e => e.status === 'approved').length,
  };

  const actionIcons: ActionIconDefinition[] = [
    {
      id: 'add-entry',
      label: 'Add Entry',
      icon: Plus,
      category: 'Create',
      action: () => {
        resetForm();
        setShowForm(true);
        setMultiSelectMode(false);
      },
    },
    {
      id: 'batch-create',
      label: 'Batch Create',
      icon: Package,
      category: 'Create',
      action: () => {
        resetBatchForm();
        setShowForm(true);
        setMultiSelectMode(true);
      },
    },
  ];

  return (
    <div className="bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-emerald-700">
            <BookOpen className="w-5 h-5" />
            <span className="text-sm font-semibold">Measurement Book</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {onExpand && <TabExpandButton onClick={onExpand} />}
            {!loadingPreferences && userPreferences && (
              <IconDisplayWrapper
                actions={actionIcons}
                preferences={userPreferences}
                triggerButtonLabel="Actions"
                position="bottom-right"
              />
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading measurement book entries...</div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All ({statusCounts.all})</option>
                  <option value="draft">Draft ({statusCounts.draft})</option>
                  <option value="submitted">Submitted ({statusCounts.submitted})</option>
                  <option value="verified">Verified ({statusCounts.verified})</option>
                  <option value="approved">Approved ({statusCounts.approved})</option>
                </select>
              </div>
            </div>

            {showForm && !multiSelectMode && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  {editingEntry ? 'Edit Entry' : 'New Entry'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {!editingEntry && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Spec Allocation
                      </label>
                      <select
                        value={formData.specAllocationId}
                        onChange={(e) => handleAllocationChange(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      >
                        <option value="">Select allocation...</option>
                        {allocations.map(alloc => (
                          <option key={alloc.id} value={alloc.id}>
                            {alloc.specDetail?.description} - {alloc.workflow_step?.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity Measured
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.quantityMeasured}
                      onChange={(e) => setFormData({ ...formData, quantityMeasured: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entry Date
                    </label>
                    <input
                      type="date"
                      value={formData.entryDate}
                      onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Remarks
                    </label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Entry'}
                  </button>
                </div>
              </div>
            )}

            {filteredEntries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No measurement book entries found
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEntries.map(entry => (
                  <div key={entry.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-semibold text-gray-900">{entry.description}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(entry.status)}`}>
                            {entry.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Package className="w-3 h-3" />
                            <span>Qty: {entry.quantityMeasured} {entry.unit}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3" />
                            <span>Rate: ₹{entry.rate}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{entry.entryDate}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3" />
                            <span>Total: ₹{(entry.quantityMeasured * entry.rate).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {entry.status === 'draft' && (
                          <>
                            <button
                              onClick={() => handleEdit(entry)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(entry.id, 'submitted')}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="Submit"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {entry.status === 'submitted' && user?.role === 'EO' && (
                          <button
                            onClick={() => handleUpdateStatus(entry.id, 'verified')}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded"
                            title="Verify"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {entry.status === 'verified' && user?.role === 'DO' && (
                          <button
                            onClick={() => handleUpdateStatus(entry.id, 'approved')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
