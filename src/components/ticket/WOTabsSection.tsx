import React, { useState, useEffect } from 'react';
import { Package, FileCheck } from 'lucide-react';
import WOItemsDisplay from './WOItemsDisplay';
import WOSpecsDisplay from './WOSpecsDisplay';
import { WorkOrderItemService } from '../../services/workOrderItemService';
import { WorkOrderSpecService } from '../../services/workOrderSpecService';

interface WOTabsSectionProps {
  ticketId: string;
  canEdit: boolean;
  refreshKey: number;
  onRefresh: () => void;
}

const WOTabsSection: React.FC<WOTabsSectionProps> = ({
  ticketId,
  canEdit,
  refreshKey,
  onRefresh,
}) => {
  const [itemsCount, setItemsCount] = useState(0);
  const [specsCount, setSpecsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCounts();
  }, [ticketId, refreshKey]);

  const loadCounts = async () => {
    try {
      setLoading(true);
      const [items, specs] = await Promise.all([
        WorkOrderItemService.getItemDetailsByTicket(ticketId),
        WorkOrderSpecService.getSpecDetailsByTicket(ticketId)
      ]);
      setItemsCount(items.length);
      setSpecsCount(specs.length);
    } catch (error) {
      console.error('Error loading counts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500 text-sm">Loading work order data...</div>
        </div>
      </div>
    );
  }

  if (itemsCount === 0 && specsCount === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {itemsCount > 0 && (
        <div>
          <div className="border-b border-gray-200">
            <div className="flex items-center px-6 py-4">
              <div className="flex items-center space-x-2 text-blue-700">
                <Package className="w-5 h-5" />
                <span className="text-sm font-semibold">Work Order Items</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {itemsCount}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <WOItemsDisplay
              key={`items-${refreshKey}`}
              ticketId={ticketId}
              onRefresh={onRefresh}
            />
          </div>
        </div>
      )}

      {specsCount > 0 && (
        <div>
          <div className="border-b border-gray-200">
            <div className="flex items-center px-6 py-4">
              <div className="flex items-center space-x-2 text-green-700">
                <FileCheck className="w-5 h-5" />
                <span className="text-sm font-semibold">Specifications</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  {specsCount}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <WOSpecsDisplay
              key={`specs-${refreshKey}`}
              ticketId={ticketId}
              onRefresh={onRefresh}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WOTabsSection;
