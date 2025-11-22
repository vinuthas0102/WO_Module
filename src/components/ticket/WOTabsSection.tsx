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

type TabType = 'items' | 'specs';

const WOTabsSection: React.FC<WOTabsSectionProps> = ({
  ticketId,
  canEdit,
  refreshKey,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('items');
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
        WorkOrderSpecService.getSpecDetailsByTicket(ticketId),
      ]);
      setItemsCount(items.length);
      setSpecsCount(specs.length);

      if (items.length === 0 && specs.length > 0 && activeTab === 'items') {
        setActiveTab('specs');
      }
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
    <>
      <div className="border-b border-gray-200">
        <div className="flex items-center px-6 py-4">
          <div className="flex space-x-1">
            {itemsCount > 0 && (
              <button
                onClick={() => setActiveTab('items')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'items'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Items</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === 'items'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {itemsCount}
                </span>
              </button>
            )}

            {specsCount > 0 && (
              <button
                onClick={() => setActiveTab('specs')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'specs'
                    ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                <span>Specifications</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === 'specs'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {specsCount}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'items' && itemsCount > 0 && (
          <WOItemsDisplay
            key={`items-${refreshKey}`}
            ticketId={ticketId}
            onRefresh={onRefresh}
          />
        )}
        {activeTab === 'specs' && specsCount > 0 && (
          <WOSpecsDisplay
            key={`specs-${refreshKey}`}
            ticketId={ticketId}
            onRefresh={onRefresh}
          />
        )}
      </div>
    </>
  );
};

export default WOTabsSection;
