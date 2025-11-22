import React, { useState, useEffect } from 'react';
import { X, FileCheck, Package } from 'lucide-react';
import { WorkOrderSpecService } from '../../services/workOrderSpecService';
import { WorkOrderSpecDetail, WorkOrderSpecAllocation } from '../../types';

interface ViewStepSpecsModalProps {
  stepId: string;
  stepTitle: string;
  onClose: () => void;
}

const ViewStepSpecsModal: React.FC<ViewStepSpecsModalProps> = ({
  stepId,
  stepTitle,
  onClose,
}) => {
  const [specs, setSpecs] = useState<Array<WorkOrderSpecDetail & { allocation: WorkOrderSpecAllocation }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpecs();
  }, [stepId]);

  const loadSpecs = async () => {
    try {
      setLoading(true);
      const data = await WorkOrderSpecService.getSpecDetailsForStep(stepId);
      setSpecs(data);
    } catch (error) {
      console.error('Error loading specs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Allocated Specifications</h2>
              <p className="text-sm text-gray-600">{stepTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading specifications...</div>
            </div>
          ) : specs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FileCheck className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Specifications Allocated</h3>
              <p className="text-gray-600 max-w-md">
                No specifications have been allocated to this workflow step yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {specs.map((spec) => (
                <div
                  key={spec.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Package className="w-4 h-4 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">
                          {spec.specMaster?.specCode || 'N/A'}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {spec.specMaster?.description || 'No description'}
                      </p>
                      {spec.specMaster?.category && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {spec.specMaster.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Work Chunk</p>
                      <p className="text-sm font-medium text-gray-900">
                        {spec.specMaster?.workChunk || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Allocated Quantity</p>
                      <p className="text-sm font-semibold text-green-600">
                        {spec.allocation.allocatedQuantity} {spec.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Quantity</p>
                      <p className="text-sm font-medium text-gray-900">
                        {spec.quantity} {spec.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Unit</p>
                      <p className="text-sm font-medium text-gray-900">
                        {spec.unit}
                      </p>
                    </div>
                  </div>

                  {spec.remarks && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Remarks</p>
                      <p className="text-sm text-gray-700">{spec.remarks}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {specs.length === 0 ? (
                'No specifications allocated'
              ) : (
                `Total: ${specs.length} specification${specs.length !== 1 ? 's' : ''}`
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewStepSpecsModal;
