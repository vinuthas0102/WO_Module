import React, { useState, useEffect } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { WorkOrderSpecMaster } from '../../types';
import { WorkOrderSpecService } from '../../services/workOrderSpecService';

interface WOSpecSelectorProps {
  ticketId: string;
  userId: string;
  onClose: () => void;
  onSpecAdded: () => void;
}

const WOSpecSelector: React.FC<WOSpecSelectorProps> = ({
  ticketId,
  userId,
  onClose,
  onSpecAdded,
}) => {
  const [specs, setSpecs] = useState<WorkOrderSpecMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSpec, setSelectedSpec] = useState<WorkOrderSpecMaster | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSpecs();
  }, []);

  const loadSpecs = async () => {
    try {
      setLoading(true);
      const data = await WorkOrderSpecService.getAllSpecsMaster(true);
      setSpecs(data);
    } catch (error) {
      console.error('Error loading specs:', error);
      alert('Failed to load specs');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSpec = (spec: WorkOrderSpecMaster) => {
    setSelectedSpec(spec);
    setQuantity(spec.defaultQuantity);
    setUnit(spec.unit);
  };

  const handleAddSpec = async () => {
    if (!selectedSpec || quantity <= 0) {
      alert('Please select a spec and enter a valid quantity');
      return;
    }

    try {
      setSubmitting(true);
      await WorkOrderSpecService.addSpecToTicket(
        ticketId,
        selectedSpec.id,
        quantity,
        unit,
        remarks || undefined,
        userId
      );

      alert('Spec added successfully');
      onSpecAdded();
      onClose();
    } catch (error) {
      console.error('Error adding spec:', error);
      alert('Failed to add spec');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [...new Set(specs.map(spec => spec.category))];

  const filteredSpecs = specs.filter(spec => {
    const matchesSearch = !searchTerm ||
      spec.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spec.specCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spec.workChunk.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || spec.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-bold text-gray-900">Add Specification to Work Order</h2>
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
                    placeholder="Search specifications..."
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

              {selectedSpec && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-green-900">{selectedSpec.description}</h3>
                      <p className="text-sm text-green-700">Code: {selectedSpec.specCode} | Category: {selectedSpec.category}</p>
                      <p className="text-sm text-green-700 mt-1">Work: {selectedSpec.workChunk}</p>
                    </div>
                    <button
                      onClick={() => setSelectedSpec(null)}
                      className="text-green-600 hover:text-green-800"
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
                    onClick={handleAddSpec}
                    disabled={submitting || quantity <= 0}
                    className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {submitting ? 'Adding...' : 'Add Spec to WO'}
                  </button>
                </div>
              )}
            </div>

            <div className="max-h-[50vh] overflow-y-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Spec Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Work Chunk
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
                  {filteredSpecs.map((spec) => (
                    <tr
                      key={spec.id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedSpec?.id === spec.id ? 'bg-green-50' : ''
                      }`}
                      onClick={() => handleSelectSpec(spec)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {spec.specCode}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {spec.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                        {spec.workChunk}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {spec.category}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {spec.defaultQuantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {spec.unit}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectSpec(spec);
                          }}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredSpecs.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No specs found. {searchTerm && 'Try adjusting your search.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WOSpecSelector;
