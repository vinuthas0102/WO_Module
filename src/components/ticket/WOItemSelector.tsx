import React, { useState, useEffect } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { WorkOrderItemMaster } from '../../types';
import { WorkOrderItemService } from '../../services/workOrderItemService';

interface WOItemSelectorProps {
  ticketId: string;
  userId: string;
  onClose: () => void;
  onItemAdded: () => void;
}

const WOItemSelector: React.FC<WOItemSelectorProps> = ({
  ticketId,
  userId,
  onClose,
  onItemAdded,
}) => {
  const [items, setItems] = useState<WorkOrderItemMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState<WorkOrderItemMaster | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await WorkOrderItemService.getAllItemsMaster(true);
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
      alert('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (item: WorkOrderItemMaster) => {
    setSelectedItem(item);
    setQuantity(item.defaultQuantity);
    setUnit(item.unit);
  };

  const handleAddItem = async () => {
    if (!selectedItem || quantity <= 0) {
      alert('Please select an item and enter a valid quantity');
      return;
    }

    try {
      setSubmitting(true);
      await WorkOrderItemService.addItemToTicket(
        ticketId,
        selectedItem.id,
        quantity,
        unit,
        remarks || undefined,
        userId
      );

      alert('Item added successfully');
      onItemAdded();
      onClose();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [...new Set(items.map(item => item.category))];

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-bold text-gray-900">Add Item to Work Order</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4">
            <div className="mb-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {selectedItem && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-blue-900">{selectedItem.description}</h3>
                      <p className="text-sm text-blue-700">Code: {selectedItem.itemCode} | Category: {selectedItem.category}</p>
                    </div>
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={quantity}
                        onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Unit *
                      </label>
                      <input
                        type="text"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Remarks
                      </label>
                      <input
                        type="text"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddItem}
                    disabled={submitting || quantity <= 0}
                    className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {submitting ? 'Adding...' : 'Add Item to WO'}
                  </button>
                </div>
              )}
            </div>

            <div className="max-h-[50vh] overflow-y-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Default Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedItem?.id === item.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleSelectItem(item)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.itemCode}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.category}
                        {item.subcategory && (
                          <div className="text-xs text-gray-500">{item.subcategory}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.defaultQuantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.unit}
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

              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No items found. {searchTerm && 'Try adjusting your search.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WOItemSelector;
