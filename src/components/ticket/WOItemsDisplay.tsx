import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Package, AlertCircle } from 'lucide-react';
import { WorkOrderItemDetail } from '../../types';
import { WorkOrderItemService } from '../../services/workOrderItemService';

interface WOItemsDisplayProps {
  ticketId: string;
  onRefresh?: () => void;
}

const WOItemsDisplay: React.FC<WOItemsDisplayProps> = ({ ticketId, onRefresh }) => {
  const [items, setItems] = useState<WorkOrderItemDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<WorkOrderItemDetail | null>(null);
  const [editQuantity, setEditQuantity] = useState(0);
  const [editUnit, setEditUnit] = useState('');
  const [editRemarks, setEditRemarks] = useState('');

  useEffect(() => {
    loadItems();
  }, [ticketId]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await WorkOrderItemService.getItemDetailsByTicket(ticketId);
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: WorkOrderItemDetail) => {
    setEditingItem(item);
    setEditQuantity(item.quantity);
    setEditUnit(item.unit);
    setEditRemarks(item.remarks || '');
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      await WorkOrderItemService.updateItemDetail(editingItem.id, {
        quantity: editQuantity,
        unit: editUnit,
        remarks: editRemarks || undefined,
      });

      alert('Item updated successfully');
      setEditingItem(null);
      await loadItems();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await WorkOrderItemService.deleteItemDetail(itemId);
      alert('Item deleted successfully');
      await loadItems();
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error('Error deleting item:', error);
      alert(error.message || 'Failed to delete item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500 text-sm">Loading items...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No items added to this work order yet.</p>
      </div>
    );
  }

  const totalItems = items.length;
  const totalAllocated = items.reduce((sum, item) => sum + (item.allocatedQuantity || 0), 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="font-semibold text-blue-900">Items Summary</h4>
              <p className="text-sm text-blue-700">
                Total: {totalItems} items | Quantity: {totalQuantity.toFixed(2)} units
              </p>
            </div>
          </div>
          {totalAllocated > 0 && (
            <div className="text-sm text-blue-700">
              <span className="font-medium">Allocated:</span> {totalAllocated.toFixed(2)} units
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Item Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Quantity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Allocated
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Remaining
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Remarks
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                {editingItem?.id === item.id ? (
                  <>
                    <td className="px-4 py-3 text-sm" colSpan={8}>
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={editQuantity}
                              onChange={(e) => setEditQuantity(parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Unit
                            </label>
                            <input
                              type="text"
                              value={editUnit}
                              onChange={(e) => setEditUnit(e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Remarks
                            </label>
                            <input
                              type="text"
                              value={editRemarks}
                              onChange={(e) => setEditRemarks(e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.itemMaster?.itemCode}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.itemMaster?.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div>
                        <div>{item.itemMaster?.category}</div>
                        {item.itemMaster?.subcategory && (
                          <div className="text-xs text-gray-500">{item.itemMaster.subcategory}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {item.allocatedQuantity?.toFixed(2) || 0} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`font-medium ${
                          (item.remainingQuantity || 0) > 0
                            ? 'text-green-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {item.remainingQuantity?.toFixed(2) || 0} {item.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.remarks || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.some(item => (item.allocatedQuantity || 0) > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            Some items have allocations to tasks. Remove allocations before deleting items.
          </p>
        </div>
      )}
    </div>
  );
};

export default WOItemsDisplay;
