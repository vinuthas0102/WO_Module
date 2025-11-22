import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { WorkOrderItemDetail } from '../../types';
import { WorkOrderItemService } from '../../services/workOrderItemService';

interface ItemAllocationModalProps {
  ticketId: string;
  workflowStepId: string;
  workflowStepTitle: string;
  userId: string;
  onClose: () => void;
  onAllocated: () => void;
}

const ItemAllocationModal: React.FC<ItemAllocationModalProps> = ({
  ticketId,
  workflowStepId,
  workflowStepTitle,
  userId,
  onClose,
  onAllocated,
}) => {
  const [items, setItems] = useState<WorkOrderItemDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WorkOrderItemDetail | null>(null);
  const [allocationQuantity, setAllocationQuantity] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAvailableItems();
  }, [ticketId]);

  const loadAvailableItems = async () => {
    try {
      setLoading(true);
      const data = await WorkOrderItemService.getItemDetailsByTicket(ticketId);
      const availableItems = data.filter(item => (item.remainingQuantity || 0) > 0);
      setItems(availableItems);
    } catch (error) {
      console.error('Error loading items:', error);
      alert('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (item: WorkOrderItemDetail) => {
    setSelectedItem(item);
    setAllocationQuantity(item.remainingQuantity || 0);
  };

  const handleAllocate = async () => {
    if (!selectedItem || allocationQuantity <= 0) {
      alert('Please select an item and enter a valid allocation quantity');
      return;
    }

    if (allocationQuantity > (selectedItem.remainingQuantity || 0)) {
      alert('Allocation quantity cannot exceed remaining quantity');
      return;
    }

    try {
      setSubmitting(true);
      await WorkOrderItemService.allocateItemToStep(
        selectedItem.id,
        workflowStepId,
        allocationQuantity,
        userId
      );

      alert('Item allocated successfully');
      onAllocated();
      onClose();
    } catch (error: any) {
      console.error('Error allocating item:', error);
      alert(error.message || 'Failed to allocate item');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8">
          <div className="text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Allocate Items</h2>
              <p className="text-sm text-gray-600">to: {workflowStepTitle}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4">
            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No items available for allocation. All items are fully allocated or no items have been added to this work order.
              </div>
            ) : (
              <>
                {selectedItem && (
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-blue-900">
                          {selectedItem.itemMaster?.description}
                        </h3>
                        <p className="text-sm text-blue-700">
                          Code: {selectedItem.itemMaster?.itemCode} | Available: {selectedItem.remainingQuantity?.toFixed(2)} {selectedItem.unit}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedItem(null)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Allocation Quantity (Max: {selectedItem.remainingQuantity?.toFixed(2)} {selectedItem.unit})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={allocationQuantity}
                        onChange={(e) => setAllocationQuantity(parseFloat(e.target.value) || 0)}
                        max={selectedItem.remainingQuantity}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <button
                      onClick={handleAllocate}
                      disabled={submitting || allocationQuantity <= 0 || allocationQuantity > (selectedItem.remainingQuantity || 0)}
                      className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {submitting ? 'Allocating...' : 'Allocate Item'}
                    </button>
                  </div>
                )}

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Item
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Total Qty
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Available
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item) => (
                        <tr
                          key={item.id}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            selectedItem?.id === item.id ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => handleSelectItem(item)}
                        >
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium text-gray-900">
                              {item.itemMaster?.description}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.itemMaster?.itemCode}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.itemMaster?.category}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-green-600">
                            {item.remainingQuantity?.toFixed(2)} {item.unit}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectItem(item);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemAllocationModal;
