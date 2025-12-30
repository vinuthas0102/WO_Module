import React, { useState, useEffect } from 'react';
import { FileText, Plus, CheckCircle, DollarSign, Calendar, X, CreditCard, Send } from 'lucide-react';
import {
  BillingService,
  BillWithDetails
} from '../../services/billingService';
import {
  MeasurementBookService,
  MeasurementBookEntryWithDetails
} from '../../services/measurementBookService';
import { useAuth } from '../../context/AuthContext';
import { ActionIconDefinition } from '../../types';
import IconDisplayWrapper from '../iconDisplay/IconDisplayWrapper';
import { UserPreferencesService } from '../../services/userPreferencesService';

interface BillManagerProps {
  ticketId: string;
  ticketNumber: string;
  onClose: () => void;
}

export const BillManager: React.FC<BillManagerProps> = ({
  ticketId,
  ticketNumber,
  onClose
}) => {
  const { user } = useAuth();
  const [bills, setBills] = useState<BillWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillWithDetails | null>(null);
  const [approvedEntries, setApprovedEntries] = useState<MeasurementBookEntryWithDetails[]>([]);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(true);

  useEffect(() => {
    loadBills();
    loadApprovedEntries();
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

  const loadBills = async () => {
    try {
      setLoading(true);
      const data = await BillingService.getBillsByTicket(ticketId);
      setBills(data);
    } catch (error) {
      console.error('Error loading bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApprovedEntries = async () => {
    try {
      const data = await MeasurementBookService.getMbookEntriesByStatus(ticketId, 'approved');

      const unbilledEntries = await Promise.all(
        data.map(async (entry) => {
          const { supabase } = await import('../../lib/supabase');
          const { data: billLinks } = await supabase
            .from('bill_mbook_entries')
            .select('bill_id')
            .eq('mbook_entry_id', entry.id)
            .limit(1);

          return billLinks && billLinks.length === 0 ? entry : null;
        })
      );

      setApprovedEntries(unbilledEntries.filter(Boolean) as MeasurementBookEntryWithDetails[]);
    } catch (error) {
      console.error('Error loading approved entries:', error);
    }
  };

  const handleCreateBill = async () => {
    if (!user || selectedEntryIds.length === 0) {
      alert('Please select at least one measurement book entry');
      return;
    }

    try {
      setSubmitting(true);
      await BillingService.createBill(
        ticketId,
        selectedEntryIds,
        billDate,
        description,
        remarks,
        user.id
      );

      setSelectedEntryIds([]);
      setBillDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setRemarks('');
      setShowCreateForm(false);
      await loadBills();
      await loadApprovedEntries();
    } catch (error: any) {
      console.error('Error creating bill:', error);
      alert(error.message || 'Failed to create bill');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBillStatus = async (
    billId: string,
    status: 'submitted' | 'approved' | 'paid',
    paymentDate?: string,
    paymentReference?: string
  ) => {
    if (!user) return;

    try {
      await BillingService.updateBillStatus(billId, status, user.id, paymentDate, paymentReference);
      await loadBills();
      if (selectedBill && selectedBill.id === billId) {
        const updated = await BillingService.getBillById(billId);
        setSelectedBill(updated);
      }
    } catch (error: any) {
      console.error('Error updating bill status:', error);
      alert(error.message || 'Failed to update status');
    }
  };

  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntryIds(prev =>
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'submitted': return 'bg-blue-100 text-blue-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'paid': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const selectedEntriesTotal = approvedEntries
    .filter(e => selectedEntryIds.includes(e.id))
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col m-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Bills Management</span>
            </h2>
            <p className="text-sm text-gray-600">{ticketNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!showCreateForm && (
            <div className="mb-4 flex justify-end">
              <IconDisplayWrapper
                actions={[
                  {
                    id: 'create-new-bill',
                    icon: Plus,
                    label: 'Create New Bill',
                    action: () => setShowCreateForm(true),
                    color: '#2563eb',
                    disabled: approvedEntries.length === 0,
                    tooltip: approvedEntries.length === 0 ? 'No approved entries available' : undefined
                  }
                ]}
                preferences={userPreferences || undefined}
                loading={loadingPreferences}
              />
            </div>
          )}

          {showCreateForm && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Create New Bill</h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setSelectedEntryIds([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Bill Date
                  </label>
                  <input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Brief description of the bill..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Additional remarks..."
                  />
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Select Measurement Book Entries ({selectedEntryIds.length} selected)
                </p>
                {selectedEntryIds.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-2 mb-2">
                    <p className="text-sm font-semibold text-blue-900">
                      Selected Total: ₹{selectedEntriesTotal.toFixed(2)}
                    </p>
                  </div>
                )}
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {approvedEntries.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">
                      No approved measurement book entries available for billing
                    </p>
                  ) : (
                    approvedEntries.map((entry) => (
                      <label
                        key={entry.id}
                        className={`flex items-start space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50 ${
                          selectedEntryIds.includes(entry.id) ? 'border-green-500 bg-green-50' : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedEntryIds.includes(entry.id)}
                          onChange={() => toggleEntrySelection(entry.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 text-xs">
                          <p className="font-medium text-gray-900">{entry.mbookNumber}</p>
                          <p className="text-gray-600">{entry.description}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-gray-500">
                              {entry.quantityMeasured.toFixed(2)} {entry.unit} × ₹{entry.rate.toFixed(2)}
                            </span>
                            <span className="font-semibold text-green-600">₹{entry.amount.toFixed(2)}</span>
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <button
                onClick={handleCreateBill}
                disabled={submitting || selectedEntryIds.length === 0}
                className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating Bill...' : 'Create Bill'}
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 text-sm">Loading bills...</div>
            </div>
          ) : bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mb-3" />
              <h4 className="text-sm font-semibold text-gray-900 mb-1">No Bills Created</h4>
              <p className="text-xs text-gray-600">
                Create your first bill from approved measurement book entries
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bills.map((bill) => (
                <div
                  key={bill.id}
                  onClick={() => setSelectedBill(bill)}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{bill.billNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                          {bill.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {bill.billType}
                        </span>
                      </div>
                      {bill.description && (
                        <p className="text-sm text-gray-600">{bill.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">₹{bill.totalAmount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(bill.billDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 mb-2">
                    {bill.mbookEntries.length} measurement book {bill.mbookEntries.length === 1 ? 'entry' : 'entries'}
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                    <p className="text-xs text-gray-500">
                      Created by {bill.createdByUser?.name || 'Unknown'}
                    </p>
                    <div onClick={(e) => e.stopPropagation()}>
                      <IconDisplayWrapper
                        actions={(() => {
                          const actions: ActionIconDefinition[] = [];

                          if (bill.status === 'draft' && (user?.role === 'EO' || user?.role === 'DO' || user?.role === 'FINANCE')) {
                            actions.push({
                              id: `submit-bill-${bill.id}`,
                              icon: Send,
                              label: 'Submit Bill',
                              action: () => handleUpdateBillStatus(bill.id, 'submitted'),
                              color: '#2563eb'
                            });
                          }

                          if (bill.status === 'submitted' && user?.role === 'EO') {
                            actions.push({
                              id: `approve-bill-${bill.id}`,
                              icon: CheckCircle,
                              label: 'Approve Bill',
                              action: () => handleUpdateBillStatus(bill.id, 'approved'),
                              color: '#16a34a'
                            });
                          }

                          if (bill.status === 'approved' && (user?.role === 'EO' || user?.role === 'DO' || user?.role === 'FINANCE')) {
                            actions.push({
                              id: `mark-paid-${bill.id}`,
                              icon: CreditCard,
                              label: 'Mark as Paid',
                              action: () => {
                                const paymentDate = prompt('Enter payment date (YYYY-MM-DD):');
                                const paymentRef = prompt('Enter payment reference:');
                                if (paymentDate && paymentRef) {
                                  handleUpdateBillStatus(bill.id, 'paid', paymentDate, paymentRef);
                                }
                              },
                              color: '#9333ea'
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

        {selectedBill && (
          <div className="fixed inset-0 z-[60] bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Bill Details</h3>
                  <p className="text-sm text-gray-600">{selectedBill.billNumber}</p>
                </div>
                <button
                  onClick={() => setSelectedBill(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Bill Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(selectedBill.billDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBill.status)}`}>
                        {selectedBill.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Bill Type</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{selectedBill.billType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                      <p className="text-lg font-bold text-green-600">₹{selectedBill.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {selectedBill.description && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-700 mb-1">Description</p>
                    <p className="text-sm text-gray-600">{selectedBill.description}</p>
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Measurement Book Entries</p>
                  <div className="space-y-2">
                    {selectedBill.mbookEntries.map((entry) => (
                      <div key={entry.id} className="bg-white border border-gray-200 rounded p-3">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-900">{entry.mbookNumber}</p>
                            <p className="text-xs text-gray-600">{entry.description}</p>
                          </div>
                          <p className="text-sm font-semibold text-green-600">₹{entry.amount.toFixed(2)}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {entry.quantityMeasured.toFixed(2)} {entry.unit} × ₹{entry.rate.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedBill.remarks && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-700 mb-1">Remarks</p>
                    <p className="text-sm text-gray-600">{selectedBill.remarks}</p>
                  </div>
                )}

                {selectedBill.paymentDate && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-purple-900 mb-1">Payment Information</p>
                    <p className="text-sm text-purple-700">
                      Paid on {new Date(selectedBill.paymentDate).toLocaleDateString()}
                    </p>
                    {selectedBill.paymentReference && (
                      <p className="text-xs text-purple-600">Ref: {selectedBill.paymentReference}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
