import React, { useState, useEffect } from 'react';
import { X, FileCheck, Package, TrendingUp, Maximize2, Layers, Workflow, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { WorkOrderSpecService } from '../../services/workOrderSpecService';
import { WorkOrderSpecDetail, WorkOrderSpecAllocation, Ticket } from '../../types';
import { SpecAllocationProgressTracker } from './SpecAllocationProgressTracker';
import { SpecAllocationProgressService, SpecAllocationProgressSummary } from '../../services/specAllocationProgressService';
import FullScreenNavigableView from '../common/FullScreenNavigableView';

interface StepSpecsDisplayProps {
  stepId: string;
  stepTitle: string;
  ticketNumber: string;
  ticketTitle: string;
  ticketId: string;
  onClose: () => void;
  ticket?: Ticket;
  woInfoContent?: React.ReactNode;
  workflowContent?: React.ReactNode;
  woItemsCount?: number;
  woSpecsCount?: number;
  completedWorkflows?: number;
  totalWorkflows?: number;
}

const StepSpecsDisplay: React.FC<StepSpecsDisplayProps> = ({
  stepId,
  stepTitle,
  ticketNumber,
  ticketTitle,
  ticketId,
  onClose,
  ticket,
  woInfoContent,
  workflowContent,
  woItemsCount = 0,
  woSpecsCount = 0,
  completedWorkflows = 0,
  totalWorkflows = 0,
}) => {
  const [specs, setSpecs] = useState<Array<WorkOrderSpecDetail & { allocation: WorkOrderSpecAllocation }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAllocation, setSelectedAllocation] = useState<{ allocationId: string; specDetails: { description: string; allocatedQuantity: number; unit: string } } | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [progressSummaries, setProgressSummaries] = useState<Map<string, SpecAllocationProgressSummary>>(new Map());
  const [loadingProgress, setLoadingProgress] = useState(false);

  useEffect(() => {
    loadSpecs();
  }, [stepId]);

  const loadSpecs = async () => {
    try {
      setLoading(true);
      const data = await WorkOrderSpecService.getSpecDetailsForStep(stepId);
      setSpecs(data);

      if (data.length > 0) {
        await loadProgressSummaries(data);
      }
    } catch (error) {
      console.error('Error loading specs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgressSummaries = async (specsData: Array<WorkOrderSpecDetail & { allocation: WorkOrderSpecAllocation }>) => {
    try {
      setLoadingProgress(true);
      const allocations = specsData.map(spec => ({
        id: spec.allocation.id,
        allocatedQuantity: spec.allocation.allocatedQuantity,
        unit: spec.unit,
      }));

      const summaries = await SpecAllocationProgressService.getProgressSummariesForAllocations(allocations);
      setProgressSummaries(summaries);
    } catch (error) {
      console.error('Error loading progress summaries:', error);
    } finally {
      setLoadingProgress(false);
    }
  };

  const refreshAfterProgressUpdate = async () => {
    if (specs.length > 0) {
      await loadProgressSummaries(specs);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return 'bg-gray-200';
    if (percentage < 50) return 'bg-yellow-500';
    if (percentage < 100) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getProgressStatusColor = (percentage: number) => {
    if (percentage === 0) return 'text-gray-500';
    if (percentage < 50) return 'text-yellow-600';
    if (percentage < 100) return 'text-blue-600';
    return 'text-green-600';
  };

  const overallProgress = Array.from(progressSummaries.values()).reduce(
    (acc, summary) => {
      acc.totalAllocated += summary.allocatedQuantity;
      acc.totalCompleted += summary.completedQuantity;
      acc.specsWithProgress += summary.hasProgress ? 1 : 0;
      return acc;
    },
    { totalAllocated: 0, totalCompleted: 0, specsWithProgress: 0 }
  );

  const overallPercentage = overallProgress.totalAllocated > 0
    ? (overallProgress.totalCompleted / overallProgress.totalAllocated) * 100
    : 0;

  const renderSpecsContent = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">Allocated Specifications</h3>
          <div className="flex items-center space-x-1.5 text-xs text-gray-600 mt-0.5">
            <span>{ticketNumber}</span>
            <span>•</span>
            <span>{stepTitle}</span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <FileCheck className="w-3 h-3" />
              <span>Specifications</span>
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isFullScreen && (
            <button
              onClick={() => setIsFullScreen(true)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="View in full screen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 text-sm">Loading specifications...</div>
        </div>
      ) : specs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <FileCheck className="w-6 h-6 text-gray-400" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900 mb-1">No Specifications Allocated</h4>
          <p className="text-xs text-gray-600 max-w-md">
            No specifications have been allocated to this workflow step yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {specs.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Overall Spec Progress</span>
                </h4>
                <div className={`text-lg font-bold ${getProgressStatusColor(overallPercentage)}`}>
                  {overallPercentage.toFixed(1)}%
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div
                  className={`h-3 rounded-full transition-all ${getProgressColor(overallPercentage)}`}
                  style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-white rounded-lg p-2">
                  <p className="text-gray-500 mb-0.5">Total Specs</p>
                  <p className="text-sm font-semibold text-gray-900">{specs.length}</p>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <p className="text-gray-500 mb-0.5">In Progress</p>
                  <p className="text-sm font-semibold text-blue-600">{overallProgress.specsWithProgress}</p>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <p className="text-gray-500 mb-0.5">Completed Qty</p>
                  <p className="text-sm font-semibold text-green-600">
                    {overallProgress.totalCompleted.toFixed(2)} / {overallProgress.totalAllocated.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {specs.map((spec) => {
            const progress = progressSummaries.get(spec.allocation.id);
            return (
            <div
              key={spec.id}
              className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-900">
                      {spec.specMaster?.specCode || 'N/A'}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {spec.specMaster?.description || 'No description'}
                  </p>
                  {spec.specMaster?.category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {spec.specMaster.category}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Work Chunk</p>
                  <p className="text-xs font-medium text-gray-900">
                    {spec.specMaster?.workChunk || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Allocated Quantity</p>
                  <p className="text-xs font-semibold text-green-600">
                    {spec.allocation.allocatedQuantity} {spec.unit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Total Quantity</p>
                  <p className="text-xs font-medium text-gray-900">
                    {spec.quantity} {spec.unit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Unit</p>
                  <p className="text-xs font-medium text-gray-900">
                    {spec.unit}
                  </p>
                </div>
              </div>

              {progress && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-medium text-gray-700">Progress</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-bold ${getProgressStatusColor(progress.progressPercentage)}`}>
                        {progress.progressPercentage.toFixed(1)}%
                      </span>
                      {progress.progressPercentage >= 100 && (
                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(progress.progressPercentage)}`}
                      style={{ width: `${Math.min(progress.progressPercentage, 100)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500 mb-0.5">Completed</p>
                      <p className="font-semibold text-green-600">
                        {progress.completedQuantity.toFixed(2)} {spec.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">Entries</p>
                      <p className="font-semibold text-blue-600">{progress.entryCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">Status</p>
                      <div className="flex items-center space-x-1">
                        {progress.pendingEntries > 0 && (
                          <span className="flex items-center text-yellow-600">
                            <Clock className="w-3 h-3 mr-0.5" />
                            {progress.pendingEntries}
                          </span>
                        )}
                        {progress.verifiedEntries > 0 && (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="w-3 h-3 mr-0.5" />
                            {progress.verifiedEntries}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {progress.lastUpdateDate && (
                    <p className="text-xs text-gray-500 mt-2">
                      Last updated: {new Date(progress.lastUpdateDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {!progress && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-center text-xs text-gray-500 py-2">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" />
                    No progress recorded yet
                  </div>
                </div>
              )}

              {spec.remarks && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-0.5">Remarks</p>
                  <p className="text-xs text-gray-700">{spec.remarks}</p>
                </div>
              )}

              <button
                onClick={() => setSelectedAllocation({
                  allocationId: spec.allocation.id,
                  specDetails: {
                    description: spec.specMaster?.description || 'Unknown Spec',
                    allocatedQuantity: spec.allocation.allocatedQuantity,
                    unit: spec.unit
                  }
                })}
                className="w-full mt-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 flex items-center justify-center space-x-1"
              >
                <TrendingUp className="w-3 h-3" />
                <span>{progress && progress.hasProgress ? 'Update Progress' : 'Track Progress'}</span>
              </button>
            </div>
            );
          })}
        </div>
      )}

      {selectedAllocation && (
        <SpecAllocationProgressTracker
          allocationId={selectedAllocation.allocationId}
          ticketId={ticketId}
          specDetails={selectedAllocation.specDetails}
          onClose={() => {
            setSelectedAllocation(null);
            refreshAfterProgressUpdate();
          }}
        />
      )}
    </div>
  );

  const navigationCards = ticket ? [
    {
      id: 'wo-info',
      label: 'WO Info',
      icon: <FileText className="w-5 h-5" />,
      colorClass: 'bg-orange-100',
      activeColorClass: 'bg-orange-600 border-orange-600 text-white',
      enabled: !!woInfoContent,
    },
    {
      id: 'wo-details',
      label: 'WO Details',
      icon: <Package className="w-5 h-5" />,
      badge: woItemsCount + woSpecsCount > 0 ? `${woItemsCount + woSpecsCount} items` : undefined,
      colorClass: 'bg-blue-100',
      activeColorClass: 'bg-blue-600 border-blue-600 text-white',
      enabled: true,
    },
    {
      id: 'workflow',
      label: 'Workflow',
      icon: <Workflow className="w-5 h-5" />,
      badge: totalWorkflows > 0 ? `${completedWorkflows}/${totalWorkflows} completed` : undefined,
      colorClass: 'bg-green-100',
      activeColorClass: 'bg-green-600 border-green-600 text-white',
      enabled: !!workflowContent,
    },
  ] : [];

  const renderSectionContent = (activeSectionId: string) => {
    if (!ticket) {
      return renderSpecsContent();
    }

    switch (activeSectionId) {
      case 'wo-info':
        return woInfoContent ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {woInfoContent}
          </div>
        ) : (
          <div className="p-4 text-gray-500">No WO Info available</div>
        );
      case 'wo-details':
        return renderSpecsContent();
      case 'workflow':
        return workflowContent ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {workflowContent}
          </div>
        ) : (
          <div className="p-4 text-gray-500">No Workflow content available</div>
        );
      default:
        return renderSpecsContent();
    }
  };

  return (
    <>
      {!isFullScreen && renderSpecsContent()}

      {isFullScreen && (
        <FullScreenNavigableView
          isOpen={isFullScreen}
          onClose={() => setIsFullScreen(false)}
          ticketNumber={ticketNumber}
          ticketTitle={ticketTitle}
          breadcrumbs={[
            { label: 'Work Order', icon: <Package className="w-4 h-4" /> },
            { label: 'Workflow', icon: <Workflow className="w-4 h-4" /> },
            { label: stepTitle, icon: <Layers className="w-4 h-4" /> },
            { label: 'Specifications', icon: <FileCheck className="w-4 h-4" /> },
          ]}
          contextInfo={
            <div className="flex items-center gap-4 text-sm">
              <span>Allocated Specs: {specs.length}</span>
              {specs.length > 0 && (
                <>
                  <span>•</span>
                  <span>
                    Total Allocated: {specs.reduce((sum, s) => sum + s.allocation.allocatedQuantity, 0).toFixed(2)} units
                  </span>
                </>
              )}
            </div>
          }
          initialSection="wo-details"
          navigationCards={navigationCards}
        >
          {(activeSectionId) => renderSectionContent(activeSectionId)}
        </FullScreenNavigableView>
      )}
    </>
  );
};

export default StepSpecsDisplay;
