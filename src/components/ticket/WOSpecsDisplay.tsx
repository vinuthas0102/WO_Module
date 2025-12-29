import React, { useState, useEffect } from 'react';
import { Edit, Trash2, FileCheck, AlertCircle, Maximize2, Package, FileText, ListChecks, TrendingUp, CheckCircle } from 'lucide-react';
import { WorkOrderSpecDetail, Ticket } from '../../types';
import { WorkOrderSpecService } from '../../services/workOrderSpecService';
import { SpecAllocationProgressService, SpecAllocationProgressSummary } from '../../services/specAllocationProgressService';
import { supabase } from '../../lib/supabase';
import FullScreenNavigableView from '../common/FullScreenNavigableView';

interface WOSpecsDisplayProps {
  ticketId: string;
  ticketNumber: string;
  ticketTitle: string;
  onRefresh?: () => void;
  ticket?: Ticket;
  woInfoContent?: React.ReactNode;
  workflowContent?: React.ReactNode;
  woItemsCount?: number;
  woSpecsCount?: number;
  completedWorkflows?: number;
  totalWorkflows?: number;
}

const WOSpecsDisplay: React.FC<WOSpecsDisplayProps> = ({
  ticketId,
  ticketNumber,
  ticketTitle,
  onRefresh,
  ticket,
  woInfoContent,
  workflowContent,
  woItemsCount = 0,
  woSpecsCount = 0,
  completedWorkflows = 0,
  totalWorkflows = 0,
}) => {
  const [specs, setSpecs] = useState<WorkOrderSpecDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSpec, setEditingSpec] = useState<WorkOrderSpecDetail | null>(null);
  const [editQuantity, setEditQuantity] = useState(0);
  const [editUnit, setEditUnit] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [specProgress, setSpecProgress] = useState<Map<string, { completedQty: number; totalAllocatedQty: number; progressPercentage: number }>>(new Map());

  useEffect(() => {
    loadSpecs();
  }, [ticketId]);

  const loadSpecs = async () => {
    try {
      setLoading(true);
      const data = await WorkOrderSpecService.getSpecDetailsByTicket(ticketId);
      setSpecs(data);

      if (data.length > 0) {
        await loadSpecProgress(data);
      }
    } catch (error) {
      console.error('Error loading specs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSpecProgress = async (specsData: WorkOrderSpecDetail[]) => {
    try {
      const { data: allocations, error } = await supabase
        .from('work_order_spec_allocations')
        .select('id, spec_detail_id, allocated_quantity')
        .in('spec_detail_id', specsData.map(s => s.id));

      if (error) throw error;

      const allocationsBySpec = new Map<string, Array<{ id: string; allocatedQuantity: number }>>();
      (allocations || []).forEach((alloc: any) => {
        if (!allocationsBySpec.has(alloc.spec_detail_id)) {
          allocationsBySpec.set(alloc.spec_detail_id, []);
        }
        allocationsBySpec.get(alloc.spec_detail_id)!.push({
          id: alloc.id,
          allocatedQuantity: parseFloat(alloc.allocated_quantity) || 0,
        });
      });

      const progressMap = new Map<string, { completedQty: number; totalAllocatedQty: number; progressPercentage: number }>();

      for (const spec of specsData) {
        const specAllocations = allocationsBySpec.get(spec.id) || [];
        let totalCompleted = 0;
        let totalAllocated = 0;

        for (const alloc of specAllocations) {
          totalAllocated += alloc.allocatedQuantity;
          const summary = await SpecAllocationProgressService.getProgressSummaryForAllocation(
            alloc.id,
            alloc.allocatedQuantity
          );
          totalCompleted += summary.completedQuantity;
        }

        const progressPercentage = totalAllocated > 0 ? (totalCompleted / totalAllocated) * 100 : 0;

        progressMap.set(spec.id, {
          completedQty: totalCompleted,
          totalAllocatedQty: totalAllocated,
          progressPercentage,
        });
      }

      setSpecProgress(progressMap);
    } catch (error) {
      console.error('Error loading spec progress:', error);
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

  const overallProgress = Array.from(specProgress.values()).reduce(
    (acc, progress) => {
      acc.totalCompleted += progress.completedQty;
      acc.totalAllocated += progress.totalAllocatedQty;
      acc.specsWithProgress += progress.totalAllocatedQty > 0 && progress.completedQty > 0 ? 1 : 0;
      return acc;
    },
    { totalCompleted: 0, totalAllocated: 0, specsWithProgress: 0 }
  );

  const overallPercentage = overallProgress.totalAllocated > 0
    ? (overallProgress.totalCompleted / overallProgress.totalAllocated) * 100
    : 0;

  const renderSpecsTable = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <FileCheck className="w-5 h-5 text-green-600" />
            <div>
              <h4 className="font-semibold text-green-900">Specifications Summary</h4>
              <p className="text-sm text-green-700">
                Total: {totalSpecs} specs | Quantity: {totalQuantity.toFixed(2)} units
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {!isFullScreen && (
              <button
                onClick={() => setIsFullScreen(true)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-1"
                title="View in full screen"
              >
                <Maximize2 className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Full Screen</span>
              </button>
            )}
          </div>
        </div>

        {overallProgress.totalAllocated > 0 && (
          <div className="mt-3 pt-3 border-t border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              </div>
              <span className={`text-sm font-bold ${
                overallPercentage >= 100 ? 'text-green-600' :
                overallPercentage >= 50 ? 'text-blue-600' :
                overallPercentage > 0 ? 'text-yellow-600' : 'text-gray-500'
              }`}>
                {overallPercentage.toFixed(1)}%
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  overallPercentage >= 100 ? 'bg-green-500' :
                  overallPercentage >= 50 ? 'bg-blue-500' :
                  overallPercentage > 0 ? 'bg-yellow-500' : 'bg-gray-200'
                }`}
                style={{ width: `${Math.min(overallPercentage, 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-white rounded-lg p-2">
                <p className="text-gray-500 mb-0.5">Allocated</p>
                <p className="text-sm font-semibold text-blue-600">
                  {overallProgress.totalAllocated.toFixed(2)} units
                </p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-gray-500 mb-0.5">Completed</p>
                <p className="text-sm font-semibold text-green-600">
                  {overallProgress.totalCompleted.toFixed(2)} units
                </p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-gray-500 mb-0.5">In Progress</p>
                <p className="text-sm font-semibold text-gray-900">
                  {overallProgress.specsWithProgress} / {totalSpecs}
                </p>
              </div>
            </div>
          </div>
        )}
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
                Progress
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
                    <td className="px-4 py-3 text-sm" colSpan={10}>
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
                    <td className="px-4 py-3 text-sm">
                      {(() => {
                        const progress = specProgress.get(spec.id);
                        if (!progress || progress.totalAllocatedQty === 0) {
                          return <span className="text-gray-400 text-xs">No progress</span>;
                        }

                        const percentage = progress.progressPercentage;
                        const color = percentage >= 100 ? 'bg-green-500' : percentage >= 50 ? 'bg-blue-500' : percentage > 0 ? 'bg-yellow-500' : 'bg-gray-200';
                        const textColor = percentage >= 100 ? 'text-green-600' : percentage >= 50 ? 'text-blue-600' : percentage > 0 ? 'text-yellow-600' : 'text-gray-500';

                        return (
                          <div className="min-w-[120px]">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-semibold ${textColor}`}>
                                {percentage.toFixed(1)}%
                              </span>
                              {percentage >= 100 && <CheckCircle className="w-3 h-3 text-green-600" />}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${color}`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {progress.completedQty.toFixed(2)} / {progress.totalAllocatedQty.toFixed(2)}
                            </div>
                          </div>
                        );
                      })()}
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

  const hasNavigationData = ticket && woInfoContent && workflowContent;

  const navigationCards = hasNavigationData ? [
    {
      id: 'wo-info',
      label: 'WO Info',
      icon: <FileText className="w-5 h-5" />,
      badge: ticket ? `${completedWorkflows}/${totalWorkflows} workflows` : undefined,
      colorClass: 'bg-orange-100 text-orange-600',
      activeColorClass: 'bg-orange-600 border-orange-600 text-white',
      enabled: true,
    },
    {
      id: 'wo-details',
      label: 'WO Details',
      icon: <Package className="w-5 h-5" />,
      badge: `${woItemsCount + woSpecsCount} items`,
      colorClass: 'bg-blue-100 text-blue-600',
      activeColorClass: 'bg-blue-600 border-blue-600 text-white',
      enabled: true,
    },
    {
      id: 'workflow',
      label: 'Workflow',
      icon: <ListChecks className="w-5 h-5" />,
      badge: `${completedWorkflows}/${totalWorkflows} completed`,
      colorClass: 'bg-green-100 text-green-600',
      activeColorClass: 'bg-green-600 border-green-600 text-white',
      enabled: true,
    },
  ] : [];

  return (
    <>
      {renderSpecsTable()}

      {hasNavigationData ? (
        <FullScreenNavigableView
          isOpen={isFullScreen}
          onClose={() => setIsFullScreen(false)}
          ticketNumber={ticketNumber}
          ticketTitle={ticketTitle}
          breadcrumbs={[
            { label: 'Work Order', icon: <Package className="w-4 h-4" /> },
            { label: 'Specifications', icon: <FileCheck className="w-4 h-4" /> },
          ]}
          contextInfo={
            <div className="flex items-center gap-4 text-sm">
              <span>Allocated Specs: {specs.length}</span>
              <span>•</span>
              <span>Total Allocated: {totalAllocated.toFixed(2)} units</span>
            </div>
          }
          initialSection="wo-details"
          navigationCards={navigationCards}
        >
          {(activeSectionId) => {
            if (activeSectionId === 'wo-info') {
              return woInfoContent;
            } else if (activeSectionId === 'wo-details') {
              return (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center space-x-2 text-blue-700">
                      <FileCheck className="w-5 h-5" />
                      <span className="text-sm font-semibold">Work Order Specifications</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {totalSpecs}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    {renderSpecsTable()}
                  </div>
                </div>
              );
            } else if (activeSectionId === 'workflow') {
              return workflowContent;
            }
            return null;
          }}
        </FullScreenNavigableView>
      ) : (
        <FullScreenNavigableView
          isOpen={isFullScreen}
          onClose={() => setIsFullScreen(false)}
          ticketNumber={ticketNumber}
          ticketTitle={ticketTitle}
          breadcrumbs={[
            { label: 'Work Order', icon: <Package className="w-4 h-4" /> },
            { label: 'Specifications', icon: <FileCheck className="w-4 h-4" /> },
          ]}
          contextInfo={
            <div className="flex items-center gap-4 text-sm">
              <span>Total Specs: {totalSpecs}</span>
              <span>•</span>
              <span>Total Quantity: {totalQuantity.toFixed(2)} units</span>
              {totalAllocated > 0 && (
                <>
                  <span>•</span>
                  <span>Allocated: {totalAllocated.toFixed(2)} units</span>
                </>
              )}
            </div>
          }
          initialSection="specs"
          navigationCards={[{
            id: 'specs',
            label: 'Specifications',
            icon: <FileCheck className="w-5 h-5" />,
            badge: `${totalSpecs} specs`,
            colorClass: 'bg-green-100 text-green-600',
            activeColorClass: 'bg-green-600 border-green-600 text-white',
            enabled: true,
          }]}
        >
          {() => (
            <div className="bg-white rounded-lg shadow-sm p-6">
              {renderSpecsTable()}
            </div>
          )}
        </FullScreenNavigableView>
      )}
    </>
  );
};

export default WOSpecsDisplay;
