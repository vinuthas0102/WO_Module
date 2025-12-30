import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, CheckCircle, AlertCircle, Calendar, DollarSign, Package, Filter, X, Edit, Trash2, Check, Send } from 'lucide-react';
import {
  MeasurementBookService,
  MeasurementBookEntryWithDetails
} from '../../services/measurementBookService';
import { WorkOrderSpecService } from '../../services/workOrderSpecService';
import { useAuth } from '../../context/AuthContext';
import { ActionIconDefinition } from '../../types';
import IconDisplayWrapper from '../iconDisplay/IconDisplayWrapper';
import { UserPreferencesService } from '../../services/userPreferencesService';

interface MeasurementBookManagerProps {
  ticketId: string;
  ticketNumber: string;
  onClose: () => void;
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

export const MeasurementBookManager: React.FC<MeasurementBookManagerProps> = ({
  ticketId,
  ticketNumber,
  onClose
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

      const entries = Array.from(selectedAllocations).map(allocId => {
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
        entries,
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

  const selectAllAllocations = () => {
    const allIds = new Set(allocations.map(a => a.id));
    setSelectedAllocations(allIds);
    const newEntries: Record<string, BatchEntryData> = {};
    allocations.forEach(alloc => {
      if (!batchEntries[alloc.id]) {
        newEntries[alloc.id] = {
          allocationId: alloc.id,
          description: '',
          quantityMeasured: 0,
          rate: 0,
        };
      } else {
        newEntries[alloc.id] = batchEntries[alloc.id];
      }
    });
    setBatchEntries(newEntries);
  };

  const deselectAllAllocations = () => {
    setSelectedAllocations(new Set());
    setBatchEntries({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'submitted': return 'bg-blue-100 text-blue-700';
      case 'verified': return 'bg-green-100 text-green-700';
      case 'approved': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredEntries = filterStatus === 'all'
    ? entries
    : entries.filter(e => e.status === filterStatus);

  const totalAmount = filteredEntries.reduce((sum, e) => sum + e.amount, 0);
  const batchTotalAmount = Array.from(selectedAllocations).reduce((sum, allocId) => {
    const entry = batchEntries[allocId];
    return sum + (entry ? entry.quantityMeasured * entry.rate : 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <BookOpen className="w-5 h-5" />
              <span>Measurement Book</span>
            </h2>
            <p className="text-sm text-gray-600">{ticketNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  {filteredEntries.length} Entries
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">
                  Total: ₹{totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="verified">Verified</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!showForm && !multiSelectMode && (
            <div className="mb-4 flex justify-end">
              <IconDisplayWrapper
                actions={[
                  {
                    id: 'add-single-entry',
                    icon: Plus,
                    label: 'Add Single Entry',
                    action: () => { setShowForm(true); setMultiSelectMode(false); },
                    color: '#2563eb'
                  },
                  {
                    id: 'add-multiple-entries',
                    icon: CheckCircle,
                    label: 'Add Multiple Entries',
                    action: () => { setMultiSelectMode(true); setShowForm(true); },
                    color: '#16a34a'
                  }
                ]}
                preferences={userPreferences || undefined}
                loading={loadingPreferences}
              />
            </div>
          )}

          {showForm && !multiSelectMode && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                {editingEntry ? 'Edit' : 'New'} Measurement Entry
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Spec Allocation *
                  </label>
                  <select
                    value={formData.specAllocationId}
                    onChange={(e) => handleAllocationChange(e.target.value)}
                    disabled={!!editingEntry}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select spec allocation</option>
                    {allocations.map((alloc) => (
                      <option key={alloc.id} value={alloc.id}>
                        {alloc.specDetail.specMaster?.description} - {alloc.workflow_step?.title}
                        (Allocated: {alloc.allocated_quantity} {alloc.specDetail.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Describe the work/measurement..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Quantity Measured * ({formData.unit})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantityMeasured}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantityMeasured: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Work Type
                  </label>
                  <select
                    value={formData.workType}
                    onChange={(e) => setFormData(prev => ({ ...prev, workType: e.target.value as 'work' | 'procurement' }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="work">Work</option>
                    <option value="procurement">Procurement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Entry Date
                  </label>
                  <input
                    type="date"
                    value={formData.entryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, entryDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Additional remarks..."
                  />
                </div>

                {formData.quantityMeasured > 0 && formData.rate > 0 && (
                  <div className="col-span-2 bg-blue-50 rounded-lg p-3">
                    <p className="text-sm font-semibold text-gray-900">
                      Amount: ₹{(formData.quantityMeasured * formData.rate).toFixed(2)}
                    </p>
                  </div>
                )}

                <div className="col-span-2 flex space-x-2">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !formData.specAllocationId || formData.quantityMeasured <= 0}
                    className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Entry'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {showForm && multiSelectMode && (
            <div className="mb-4 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Create Multiple Entries ({selectedAllocations.size} selected)
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={selectAllAllocations}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllAllocations}
                      className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Work Type (applies to all)
                    </label>
                    <select
                      value={commonData.workType}
                      onChange={(e) => setCommonData(prev => ({ ...prev, workType: e.target.value as 'work' | 'procurement' }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="work">Work</option>
                      <option value="procurement">Procurement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Entry Date (applies to all)
                    </label>
                    <input
                      type="date"
                      value={commonData.entryDate}
                      onChange={(e) => setCommonData(prev => ({ ...prev, entryDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Total Amount
                    </label>
                    <div className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-300 rounded-md font-semibold text-blue-900">
                      ₹{batchTotalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Remarks (applies to all)
                  </label>
                  <textarea
                    value={commonData.remarks}
                    onChange={(e) => setCommonData(prev => ({ ...prev, remarks: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Additional remarks..."
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allocations.map((alloc) => {
                  const isSelected = selectedAllocations.has(alloc.id);
                  const entry = batchEntries[alloc.id];
                  const amount = entry ? entry.quantityMeasured * entry.rate : 0;

                  return (
                    <div
                      key={alloc.id}
                      className={`border rounded-lg p-3 transition-colors ${
                        isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAllocationSelection(alloc.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex-1">
                          <div className="mb-2">
                            <p className="text-sm font-medium text-gray-900">
                              {alloc.specDetail.specMaster?.description}
                            </p>
                            <p className="text-xs text-gray-600">
                              {alloc.workflow_step?.title} | Allocated: {alloc.allocated_quantity} {alloc.specDetail.unit}
                            </p>
                          </div>

                          {isSelected && (
                            <div className="grid grid-cols-4 gap-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Quantity ({alloc.specDetail.unit})
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={entry?.quantityMeasured || 0}
                                  onChange={(e) => updateBatchEntry(alloc.id, 'quantityMeasured', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="0.00"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Rate (₹)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={entry?.rate || 0}
                                  onChange={(e) => updateBatchEntry(alloc.id, 'rate', parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="0.00"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Amount
                                </label>
                                <div className="w-full px-2 py-1 text-sm bg-gray-100 border border-gray-300 rounded font-medium">
                                  ₹{amount.toFixed(2)}
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Description
                                </label>
                                <input
                                  type="text"
                                  value={entry?.description || ''}
                                  onChange={(e) => updateBatchEntry(alloc.id, 'description', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Description..."
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleBatchSubmit}
                  disabled={submitting || selectedAllocations.size === 0}
                  className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : `Create ${selectedAllocations.size} Entries`}
                </button>
                <button
                  onClick={resetBatchForm}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 text-sm">Loading entries...</div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mb-3" />
              <h4 className="text-sm font-semibold text-gray-900 mb-1">No Entries Found</h4>
              <p className="text-xs text-gray-600">
                {filterStatus === 'all'
                  ? 'Add your first measurement entry to start tracking work'
                  : `No entries with status "${filterStatus}"`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{entry.mbookNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                          {entry.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {entry.workType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{entry.description}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {entry.status === 'draft' && (user?.role === 'EO' || user?.role === 'DO') && (
                        <>
                          <button
                            onClick={() => handleEdit(entry)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Quantity</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {entry.quantityMeasured.toFixed(2)} {entry.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Rate</p>
                      <p className="text-sm font-semibold text-gray-900">
                        ₹{entry.rate.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Amount</p>
                      <p className="text-sm font-semibold text-green-600">
                        ₹{entry.amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(entry.entryDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {entry.remarks && (
                    <p className="text-xs text-gray-600 border-t border-gray-100 pt-2 mt-2">
                      {entry.remarks}
                    </p>
                  )}

                  <div className="flex items-center justify-between border-t border-gray-100 pt-2 mt-2">
                    <p className="text-xs text-gray-500">
                      Created by {entry.createdByUser?.name || 'Unknown'}
                    </p>
                    <div onClick={(e) => e.stopPropagation()}>
                      <IconDisplayWrapper
                        actions={(() => {
                          const actions: ActionIconDefinition[] = [];

                          if (entry.status === 'draft' && user?.id === entry.createdBy) {
                            actions.push({
                              id: `submit-${entry.id}`,
                              icon: Send,
                              label: 'Submit',
                              action: () => handleUpdateStatus(entry.id, 'submitted'),
                              color: '#2563eb'
                            });
                          }

                          if (entry.status === 'submitted' && user?.role === 'EO') {
                            actions.push({
                              id: `verify-${entry.id}`,
                              icon: Check,
                              label: 'Verify',
                              action: () => handleUpdateStatus(entry.id, 'verified'),
                              color: '#16a34a'
                            });
                          }

                          if (entry.status === 'verified' && user?.role === 'EO') {
                            actions.push({
                              id: `approve-${entry.id}`,
                              icon: CheckCircle,
                              label: 'Approve',
                              action: () => handleUpdateStatus(entry.id, 'approved'),
                              color: '#ea580c'
                            });
                          }

                          return actions;
                        })()}
                        preferences={userPreferences || undefined}
                        loading={loadingPreferences}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
