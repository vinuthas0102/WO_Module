import React from 'react';
import { Package } from 'lucide-react';
import { WorkOrderSpecService } from '../../services/workOrderSpecService';
import { SpecAllocationProgressService } from '../../services/specAllocationProgressService';

const SpecProgressIndicator: React.FC<{ stepId: string; ticketId: string }> = ({ stepId }) => {
  const [specs, setSpecs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [progressSummaries, setProgressSummaries] = React.useState<Map<string, any>>(new Map());
  const [showDetails, setShowDetails] = React.useState(false);

  React.useEffect(() => {
    const loadSpecs = async () => {
      try {
        const data = await WorkOrderSpecService.getSpecDetailsForStep(stepId);
        setSpecs(data);

        if (data.length > 0) {
          const allocations = data.map((spec: any) => ({
            id: spec.allocation.id,
            allocatedQuantity: spec.allocation.allocatedQuantity,
            unit: spec.unit,
          }));
          const summaries = await SpecAllocationProgressService.getProgressSummariesForAllocations(allocations);
          setProgressSummaries(summaries);
        }
      } catch (error) {
        console.error('Failed to load specs:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSpecs();
  }, [stepId]);

  if (loading || specs.length === 0) return null;

  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return 'bg-gray-400';
    if (percentage < 50) return 'bg-yellow-500';
    if (percentage < 100) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const calculateOverallProgress = () => {
    let totalWeightedProgress = 0;
    let totalWeight = 0;
    let completedCount = 0;
    let inProgressCount = 0;

    specs.forEach((spec: any) => {
      const summary = progressSummaries.get(spec.allocation.id);
      const percentage = summary?.progressPercentage || 0;
      const weight = spec.allocation.allocatedQuantity || 1;

      totalWeightedProgress += percentage * weight;
      totalWeight += weight;

      if (percentage === 100) {
        completedCount++;
      } else if (percentage > 0) {
        inProgressCount++;
      }
    });

    const overallPercentage = totalWeight > 0 ? totalWeightedProgress / totalWeight : 0;

    return {
      percentage: overallPercentage,
      completed: completedCount,
      inProgress: inProgressCount,
      notStarted: specs.length - completedCount - inProgressCount,
      total: specs.length
    };
  };

  const progress = calculateOverallProgress();

  return (
    <div className="mt-2">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full text-left hover:bg-gray-50 rounded p-1 transition-colors"
      >
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-medium text-gray-700 flex items-center space-x-1">
            <Package className="w-3 h-3" />
            <span>Specs Progress ({progress.total})</span>
          </div>
          <div className="text-xs text-gray-600">
            {progress.completed}/{progress.total} completed
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className={`${getProgressColor(progress.percentage)} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-700 font-semibold w-12 text-right">
            {progress.percentage.toFixed(0)}%
          </span>
        </div>
        {progress.inProgress > 0 && (
          <div className="text-[10px] text-gray-500 mt-0.5">
            {progress.inProgress} in progress, {progress.notStarted} not started
          </div>
        )}
      </button>

      {showDetails && (
        <div className="mt-2 pl-2 space-y-1 border-l-2 border-gray-200">
          {specs.map((spec: any) => {
            const summary = progressSummaries.get(spec.allocation.id);
            const percentage = summary?.progressPercentage || 0;
            return (
              <div key={spec.allocation.id} className="text-xs">
                <div className="flex items-center justify-between">
                  <div className="truncate text-gray-700 font-medium flex-1">
                    {spec.specMaster?.description || 'Spec'}
                  </div>
                  <span className="text-gray-600 text-[10px] ml-2">{percentage.toFixed(0)}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-1 mt-0.5">
                  <div
                    className={`${getProgressColor(percentage)} h-1 rounded-full transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SpecProgressIndicator;
