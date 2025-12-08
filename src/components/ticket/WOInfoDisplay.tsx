import React from 'react';
import { Package } from 'lucide-react';

interface WOInfoDisplayProps {
  workOrderData: {
    workOrderType?: string;
    estimatedCost?: number;
    contractorName?: string;
    contractorContact?: string;
  };
}

const WOInfoDisplay: React.FC<WOInfoDisplayProps> = ({ workOrderData }) => {
  const hasAnyData = workOrderData.workOrderType ||
                     workOrderData.estimatedCost ||
                     workOrderData.contractorName ||
                     workOrderData.contractorContact;

  if (!hasAnyData) {
    return (
      <div className="p-6 text-center text-gray-500">
        No work order information available
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
          <Package className="w-4 h-4 text-orange-600" />
          <span>Work Order Information</span>
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {workOrderData.workOrderType && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
              <span className="text-sm text-gray-900">{workOrderData.workOrderType}</span>
            </div>
          )}
          {workOrderData.estimatedCost && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Estimated Cost</label>
              <span className="text-sm text-gray-900">₹{workOrderData.estimatedCost.toLocaleString()}</span>
            </div>
          )}
          {workOrderData.contractorName && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Contractor</label>
              <span className="text-sm text-gray-900">{workOrderData.contractorName}</span>
            </div>
          )}
          {workOrderData.contractorContact && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Contact</label>
              <span className="text-sm text-gray-900">{workOrderData.contractorContact}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WOInfoDisplay;
