import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { WorkOrderSpecDetail } from '../../types';
import { WorkOrderSpecService } from '../../services/workOrderSpecService';

interface SpecAllocationModalProps {
  ticketId: string;
  workflowStepId: string;
  workflowStepTitle: string;
  userId: string;
  onClose: () => void;
  onAllocated: () => void;
}

const SpecAllocationModal: React.FC<SpecAllocationModalProps> = ({
  ticketId,
  workflowStepId,
  workflowStepTitle,
  userId,
  onClose,
  onAllocated,
}) => {
  const [specs, setSpecs] = useState<WorkOrderSpecDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpec, setSelectedSpec] = useState<WorkOrderSpecDetail | null>(null);
  const [allocationQuantity, setAllocationQuantity] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAvailableSpecs();
  }, [ticketId]);

  const loadAvailableSpecs = async () => {
    try {
      setLoading(true);
      const data = await WorkOrderSpecService.getSpecDetailsByTicket(ticketId);
      const availableSpecs = data.filter(spec => (spec.remainingQuantity || 0) > 0);
      setSpecs(availableSpecs);
    } catch (error) {
      console.error('Error loading specs:', error);
      alert('Failed to load specs');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSpec = (spec: WorkOrderSpecDetail) => {
    setSelectedSpec(spec);
    setAllocationQuantity(spec.remainingQuantity || 0);
  };

  const handleAllocate = async () => {
    if (!selectedSpec || allocationQuantity <= 0) {
      alert('Please select a spec and enter a valid allocation quantity');
      return;
    }

    if (allocationQuantity > (selectedSpec.remainingQuantity || 0)) {
      alert('Allocation quantity cannot exceed remaining quantity');
      return;
    }

    try {
      setSubmitting(true);
      await WorkOrderSpecService.allocateSpecToStep(
        selectedSpec.id,
        workflowStepId,
        allocationQuantity,
        userId
      );

      alert('Spec allocated successfully');
      onAllocated();
      onClose();
    } catch (error: any) {
      console.error('Error allocating spec:', error);
      alert(error.message || 'Failed to allocate spec');
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Allocate Specifications</h2>
              <p className="text-sm text-gray-600">to: {workflowStepTitle}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4">
            {specs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No specs available for allocation. All specs are fully allocated or no specs have been added to this work order.
              </div>
            ) : (
              <>
                {selectedSpec && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-green-900">
                          {selectedSpec.specMaster?.description}
                        </h3>
                        <p className="text-sm text-green-700">
                          Code: {selectedSpec.specMaster?.specCode} | Available: {selectedSpec.remainingQuantity?.toFixed(2)} {selectedSpec.unit}
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          Work: {selectedSpec.specMaster?.workChunk}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedSpec(null)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Allocation Quantity (Max: {selectedSpec.remainingQuantity?.toFixed(2)} {selectedSpec.unit})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={allocationQuantity}
                        onChange={(e) => setAllocationQuantity(parseFloat(e.target.value) || 0)}
                        max={selectedSpec.remainingQuantity}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <button
                      onClick={handleAllocate}
                      disabled={submitting || allocationQuantity <= 0 || allocationQuantity > (selectedSpec.remainingQuantity || 0)}
                      className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {submitting ? 'Allocating...' : 'Allocate Spec'}
                    </button>
                  </div>
                )}

                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Spec
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Work Chunk
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
                      {specs.map((spec) => (
                        <tr
                          key={spec.id}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            selectedSpec?.id === spec.id ? 'bg-green-50' : ''
                          }`}
                          onClick={() => handleSelectSpec(spec)}
                        >
                          <td className="px-4 py-3 text-sm">
                            <div className="font-medium text-gray-900">
                              {spec.specMaster?.description}
                            </div>
                            <div className="text-xs text-gray-500">
                              {spec.specMaster?.specCode}
                            </div>
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
                          <td className="px-4 py-3 text-sm font-medium text-green-600">
                            {spec.remainingQuantity?.toFixed(2)} {spec.unit}
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
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecAllocationModal;
