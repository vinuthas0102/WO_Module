import React, { useState, useEffect } from 'react';
import { X, FileCheck, Package, TrendingUp, Maximize2, Layers, Workflow, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import Breadcrumb from '../common/Breadcrumb';
import { WorkOrderSpecService } from '../../services/workOrderSpecService';
import { WorkOrderSpecDetail, WorkOrderSpecAllocation, Ticket } from '../../types';
import { SpecAllocationProgressTracker } from './SpecAllocationProgressTracker';
import { SpecAllocationProgressService, SpecAllocationProgressSummary } from '../../services/specAllocationProgressService';
import FullScreenNavigableView from '../common/FullScreenNavigableView';
import { exportCurrentScreen } from '../../lib/exportScreen';

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

  const getCardBorderColor = (progress: SpecAllocationProgressSummary | undefined) => {
    if (!progress || !progress.hasProgress) return 'border-l-gray-300';
    if (progress.progressPercentage >= 100) return 'border-l-green-500';
    if (progress.progressPercentage >= 50) return 'border-l-blue-500';
    return 'border-l-yellow-500';
  };

  const renderSpecsContent = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between pb-2 border-b border-gray-200 sticky top-0 bg-white z-10 -mx-0.5 px-0.5 pt-0.5">
        <div className="flex-1">
          <Breadcrumb
            items={[
              { label: ticketNumber },
              { label: 'Workflow' },
              { label: stepTitle },
              { label: 'Specifications' },
            ]}
          />
          <h3 className="text-sm font-semibold text-gray-900 mt-1">Allocated Specifications</h3>
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
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500 text-sm">Loading specifications...</div>
        </div>
      ) : specs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
            <FileCheck className="w-5 h-5 text-gray-400" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900 mb-1">No Specifications Allocated</h4>
          <p className="text-xs text-gray-500">No specifications have been allocated to this workflow step yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {specs.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  Overall Spec Progress
                </span>
                <span className={`text-sm font-bold ${getProgressStatusColor(overallPercentage)}`}>
                  {overallPercentage.toFixed(1)}%
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                <div
                  className={`h-1.5 rounded-full transition-all ${getProgressColor(overallPercentage)}`}
                  style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                />
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Specs:</span>
                  <span className="font-semibold text-gray-800">{specs.length}</span>
                </div>
                <div className="w-px h-3 bg-gray-300" />
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">In Progress:</span>
                  <span className="font-semibold text-blue-600">{overallProgress.specsWithProgress}</span>
                </div>
                <div className="w-px h-3 bg-gray-300" />
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Done:</span>
                  <span className="font-semibold text-green-600">
                    {overallProgress.totalCompleted.toFixed(1)} / {overallProgress.totalAllocated.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {specs.map((spec, index) => {
            const progress = progressSummaries.get(spec.allocation.id);
            const isEven = index % 2 === 0;
            return (
              <div
                key={spec.id}
                className={`border border-gray-200 border-l-4 ${getCardBorderColor(progress)} rounded-lg overflow-hidden hover:shadow-sm transition-shadow ${isEven ? 'bg-white' : 'bg-gray-50'}`}
              >
                <div className="px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Package className="w-3 h-3 text-blue-600 shrink-0" />
                      <span className="text-xs font-bold text-gray-900 truncate">
                        {spec.specMaster?.specCode || 'N/A'}
                      </span>
                      {spec.specMaster?.category && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 shrink-0">
                          {spec.specMaster.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {progress ? (
                        <>
                          {progress.progressPercentage >= 100 && (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          )}
                          <span className={`text-xs font-bold ${getProgressStatusColor(progress.progressPercentage)}`}>
                            {progress.progressPercentage.toFixed(1)}%
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <AlertCircle className="w-3 h-3" />
                          No data
                        </span>
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
                        className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-medium rounded hover:bg-blue-700 flex items-center gap-1 transition-colors"
                      >
                        <TrendingUp className="w-2.5 h-2.5" />
                        {progress && progress.hasProgress ? 'Update' : 'Track'}
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                    {spec.specMaster?.description || 'No description'}
                  </p>

                  <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                    {spec.specMaster?.workChunk && spec.specMaster.workChunk !== spec.specMaster.description && (
                      <>
                        <span className="text-gray-400">Chunk:</span>
                        <span className="text-gray-700 font-medium truncate max-w-[120px]">{spec.specMaster.workChunk}</span>
                        <div className="w-px h-3 bg-gray-200" />
                      </>
                    )}
                    <span className="text-gray-400">Alloc:</span>
                    <span className="text-green-700 font-semibold">{spec.allocation.allocatedQuantity} {spec.unit}</span>
                    <div className="w-px h-3 bg-gray-200" />
                    <span className="text-gray-400">Total:</span>
                    <span className="text-gray-700 font-medium">{spec.quantity} {spec.unit}</span>
                  </div>

                  {progress && progress.hasProgress && (
                    <div className="mt-1.5">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full transition-all ${getProgressColor(progress.progressPercentage)}`}
                          style={{ width: `${Math.min(progress.progressPercentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                        <span className="flex items-center gap-0.5">
                          <span className="font-medium text-green-600">{progress.completedQuantity.toFixed(1)} {spec.unit}</span>
                          <span>done</span>
                        </span>
                        <span className="flex items-center gap-0.5">
                          <span className="font-medium text-blue-600">{progress.entryCount}</span>
                          <span>entries</span>
                        </span>
                        {progress.pendingEntries > 0 && (
                          <span className="flex items-center gap-0.5 text-yellow-600">
                            <Clock className="w-2.5 h-2.5" />
                            {progress.pendingEntries} pending
                          </span>
                        )}
                        {progress.verifiedEntries > 0 && (
                          <span className="flex items-center gap-0.5 text-green-600">
                            <CheckCircle className="w-2.5 h-2.5" />
                            {progress.verifiedEntries} verified
                          </span>
                        )}
                        {progress.lastUpdateDate && (
                          <span className="ml-auto text-gray-400">
                            {new Date(progress.lastUpdateDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {spec.remarks && (
                    <p className="mt-1 text-[10px] text-gray-500 italic truncate">
                      {spec.remarks}
                    </p>
                  )}
                </div>
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
          workflowStepId={stepId}
          onClose={() => {
            setSelectedAllocation(null);
            refreshAfterProgressUpdate();
          }}
          onRefresh={refreshAfterProgressUpdate}
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
          onExport={() => exportCurrentScreen({ screenName: `Step_Specs_${ticketNumber}` })}
        >
          {(activeSectionId) => renderSectionContent(activeSectionId)}
        </FullScreenNavigableView>
      )}
    </>
  );
};

export default StepSpecsDisplay;
