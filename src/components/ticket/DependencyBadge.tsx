import React, { useState, useEffect } from 'react';
import { Lock, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { WorkflowStep } from '../../types';
import { DependencyService } from '../../services/dependencyService';

interface DependencyBadgeProps {
  step: WorkflowStep;
  allSteps: WorkflowStep[];
}

const getHierarchicalNumber = (step: WorkflowStep) => {
  const level1 = step.level_1 || 0;
  const level2 = step.level_2 || 0;
  const level3 = step.level_3 || 0;
  return `${level1}.${level2}.${level3}`;
};

const DependencyBadge: React.FC<DependencyBadgeProps> = ({ step, allSteps }) => {
  const [dependencies, setDependencies] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (step.is_parallel !== false) return;

    const loadDependencies = async () => {
      setLoading(true);
      try {
        const deps = await DependencyService.getStepDependencies(step.id);
        const depStepIds = deps.map(d => d.dependsOnStepId);
        const depSteps = allSteps.filter(s => depStepIds.includes(s.id));
        setDependencies(depSteps);
      } catch (error) {
        console.error('Failed to load dependencies:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDependencies();
  }, [step.id, step.is_parallel, allSteps]);

  if (step.is_parallel !== false || dependencies.length === 0) {
    return null;
  }

  const completedCount = dependencies.filter(
    d => d.status === 'COMPLETED' || d.status === 'CLOSED'
  ).length;
  const totalCount = dependencies.length;
  const allCompleted = completedCount === totalCount;
  const anyCompleted = completedCount > 0;
  const dependencyMode = step.dependency_mode || 'all';
  const canProceed = dependencyMode === 'all' ? allCompleted : anyCompleted;

  return (
    <div className="mt-2">
      <div className="relative">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`w-full flex items-center justify-between space-x-2 px-2 py-1.5 text-xs rounded border ${
            canProceed
              ? 'bg-green-50 text-green-800 border-green-300'
              : 'bg-orange-50 text-orange-800 border-orange-300'
          } hover:opacity-80 transition-opacity`}
        >
          <div className="flex items-center space-x-2">
            {canProceed ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <AlertTriangle className="w-3 h-3" />
            )}
            <span className="font-medium">
              Dependencies: {completedCount}/{totalCount}
            </span>
            {step.is_dependency_locked && (
              <Lock className="w-3 h-3" />
            )}
          </div>
          <span className="text-xs opacity-75">
            {dependencyMode === 'all' ? 'All required' : 'Any one required'}
          </span>
        </button>

        {showDetails && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 p-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-900">Dependency Details</h4>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {loading ? (
              <div className="text-xs text-gray-600 py-2 text-center">Loading...</div>
            ) : (
              <div className="space-y-1.5">
                <div className="text-xs text-gray-600 bg-gray-50 p-1.5 rounded">
                  <strong>Mode:</strong> {dependencyMode === 'all'
                    ? 'All dependencies must be completed'
                    : 'At least one dependency must be completed'}
                </div>

                <div className="space-y-1">
                  {dependencies.map((dep) => {
                    const isCompleted = dep.status === 'COMPLETED' || dep.status === 'CLOSED';
                    return (
                      <div
                        key={dep.id}
                        className={`flex items-center justify-between text-xs p-1.5 rounded ${
                          isCompleted
                            ? 'bg-green-50 text-green-900'
                            : 'bg-gray-50 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                          {isCompleted ? (
                            <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                          ) : (
                            <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          )}
                          <span className="font-mono text-xs flex-shrink-0">
                            {getHierarchicalNumber(dep)}
                          </span>
                          <span className="truncate">{dep.title}</span>
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          isCompleted
                            ? 'bg-green-200 text-green-800'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {dep.status}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {!canProceed && (
                  <div className="mt-2 text-xs bg-orange-50 text-orange-800 p-2 rounded border border-orange-200">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    This workflow cannot be completed until {
                      dependencyMode === 'all'
                        ? 'all dependencies are completed'
                        : 'at least one dependency is completed'
                    }.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DependencyBadge;
