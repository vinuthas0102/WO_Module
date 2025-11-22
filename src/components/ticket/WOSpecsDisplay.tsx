import React, { useState, useEffect } from 'react';
import { Edit, Trash2, FileCheck, AlertCircle } from 'lucide-react';
import { WorkOrderSpecDetail } from '../../types';
import { WorkOrderSpecService } from '../../services/workOrderSpecService';

interface WOSpecsDisplayProps {
  ticketId: string;
  onRefresh?: () => void;
}

const WOSpecsDisplay: React.FC<WOSpecsDisplayProps> = ({ ticketId, onRefresh }) => {
  const [specs, setSpecs] = useState<WorkOrderSpecDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSpec, setEditingSpec] = useState<WorkOrderSpecDetail | null>(null);
  const [editQuantity, setEditQuantity] = useState(0);
  const [editUnit, setEditUnit] = useState('');
  const [editRemarks, setEditRemarks] = useState('');

  useEffect(() => {
    loadSpecs();
  }, [ticketId]);

  const loadSpecs = async () => {
    try {
      setLoading(true);
      const data = await WorkOrderSpecService.getSpecDetailsByTicket(ticketId);
      setSpecs(data);
    } catch (error) {
      console.error('Error loading specs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (spec: WorkOrderSpecDetail) => {
    setEditingSpec(spec);
    setEditQuantity(spec.quantity);
    setEditUnit(spec.unit);
    setEditRemarks(spec.remarks || '');
  };

  const handleSaveEdit = async () => {
    if (!editingSpec) return;

    try {
      await WorkOrderSpecService.updateSpecDetail(editingSpec.id, {
        quantity: editQuantity,
        unit: editUnit,
        remarks: editRemarks || undefined,
      });

      alert('Spec updated successfully');
      setEditingSpec(null);
      await loadSpecs();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error updating spec:', error);
      alert('Failed to update spec');
    }
  };

  const handleDelete = async (specId: string) => {
    if (!confirm('Are you sure you want to delete this specification?')) return;

    try {
      await WorkOrderSpecService.deleteSpecDetail(specId);
      alert('Spec deleted successfully');
      await loadSpecs();
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error('Error deleting spec:', error);
      alert(error.message || 'Failed to delete spec');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500 text-sm">Loading specifications...</div>
      </div>
    );
  }

  if (specs.length === 0) {
    return (
      <div className="text-center py-8">
        <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No specifications added to this work order yet.</p>
      </div>
    );
  }

  const totalSpecs = specs.length;
  const totalAllocated = specs.reduce((sum, spec) => sum + (spec.allocatedQuantity || 0), 0);
  const totalQuantity = specs.reduce((sum, spec) => sum + spec.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileCheck className="w-5 h-5 text-green-600" />
            <div>
              <h4 className="font-semibold text-green-900">Specifications Summary</h4>
              <p className="text-sm text-green-700">
                Total: {totalSpecs} specs | Quantity: {totalQuantity.toFixed(2)} units
              </p>
            </div>
          </div>
          {totalAllocated > 0 && (
            <div className="text-sm text-green-700">
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
                Spec Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Work Chunk
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
            {specs.map((spec) => (
              <tr key={spec.id} className="hover:bg-gray-50">
                {editingSpec?.id === spec.id ? (
                  <>
                    <td className="px-4 py-3 text-sm" colSpan={9}>
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
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingSpec(null)}
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
                      {spec.specMaster?.specCode}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {spec.specMaster?.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                      <div className="truncate" title={spec.specMaster?.workChunk}>
                        {spec.specMaster?.workChunk}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {spec.specMaster?.category}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {spec.quantity} {spec.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {spec.allocatedQuantity?.toFixed(2) || 0} {spec.unit}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`font-medium ${
                          (spec.remainingQuantity || 0) > 0
                            ? 'text-green-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {spec.remainingQuantity?.toFixed(2) || 0} {spec.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {spec.remarks || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(spec)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(spec.id)}
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

      {specs.some(spec => (spec.allocatedQuantity || 0) > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            Some specifications have allocations to tasks. Remove allocations before deleting specs.
          </p>
        </div>
      )}
    </div>
  );
};

export default WOSpecsDisplay;
