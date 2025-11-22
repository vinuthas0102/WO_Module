import React, { useState, useEffect } from 'react';
import { X, Plus, Package, CheckCircle } from 'lucide-react';
import { WorkOrderSpecDetail } from '../../types';
import { WorkOrderSpecService } from '../../services/workOrderSpecService';

interface SpecAllocationDisplayProps {
  ticketId: string;
  workflowStepId: string;
  workflowStepTitle: string;
  ticketNumber: string;
  userId: string;
  onClose: () => void;
  onAllocated: () => void;
}

const SpecAllocationDisplay: React.FC<SpecAllocationDisplayProps> = ({
  ticketId,
  workflowStepId,
  workflowStepTitle,
  ticketNumber,
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
      setSelectedSpec(null);
      setAllocationQuantity(0);
      await loadAvailableSpecs();
      onAllocated();
    } catch (error: any) {
      console.error('Error allocating spec:', error);
      alert(error.message || 'Failed to allocate spec');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">Allocate Specifications</h3>
          <div className="flex items-center space-x-1.5 text-xs text-gray-600 mt-0.5">
            <span>{ticketNumber}</span>
            <span>•</span>
            <span>{workflowStepTitle}</span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Package className="w-3 h-3" />
              <span>Allocate Specs</span>
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 text-sm">Loading specifications...</div>
        </div>
      ) : (
        <>
          {selectedSpec && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                    <h4 className="text-sm font-semibold text-green-900">
                      {selectedSpec.specMaster?.description}
                    </h4>
                  </div>
                  <p className="text-xs text-green-700">
                    Code: {selectedSpec.specMaster?.specCode}
                  </p>
                  <p className="text-xs text-green-700">
                    Available: {selectedSpec.remainingQuantity?.toFixed(2)} {selectedSpec.unit}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSpec(null)}
                  className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                  title="Deselect"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-700">
                  Allocation Quantity (Max: {selectedSpec.remainingQuantity?.toFixed(2)} {selectedSpec.unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={allocationQuantity}
                  onChange={(e) => setAllocationQuantity(parseFloat(e.target.value) || 0)}
                  max={selectedSpec.remainingQuantity}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <button
                onClick={handleAllocate}
                disabled={submitting || allocationQuantity <= 0 || allocationQuantity > (selectedSpec.remainingQuantity || 0)}
                className="w-full px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Allocating...' : 'Allocate Spec'}
              </button>
            </div>
          )}

          {specs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">No Specs Available</h4>
              <p className="text-xs text-gray-600 max-w-md">
                All specs are fully allocated or no specs have been added to this work order.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              <div className="text-xs text-gray-600 bg-blue-50 px-3 py-1.5 rounded border border-blue-200">
                Available: {specs.length} specification{specs.length !== 1 ? 's' : ''}
              </div>

              {specs.map((spec) => (
                <div
                  key={spec.id}
                  onClick={() => handleSelectSpec(spec)}
                  className={`bg-white border rounded-lg p-3 cursor-pointer transition-all ${
                    selectedSpec?.id === spec.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-blue-400 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Package className="w-3.5 h-3.5 text-blue-600" />
                        <h4 className="text-sm font-semibold text-gray-900">
                          {spec.specMaster?.description}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        Code: {spec.specMaster?.specCode}
                      </p>
                      {spec.specMaster?.category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {spec.specMaster.category}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSpec(spec);
                      }}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Select"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Work Chunk</p>
                      <p className="text-xs font-medium text-gray-900 truncate" title={spec.specMaster?.workChunk}>
                        {spec.specMaster?.workChunk || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Available Qty</p>
                      <p className="text-xs font-semibold text-green-600">
                        {spec.remainingQuantity?.toFixed(2)} {spec.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Total Qty</p>
                      <p className="text-xs font-medium text-gray-900">
                        {spec.quantity} {spec.unit}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SpecAllocationDisplay;
