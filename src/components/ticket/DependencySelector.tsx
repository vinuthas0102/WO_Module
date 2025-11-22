import React from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { WorkflowStep } from '../../types';

interface DependencySelectorProps {
  isParallel: boolean;
  dependencyMode: 'all' | 'any_one';
  selectedDependencies: string[];
  availableSteps: WorkflowStep[];
  isDependencyLocked: boolean;
  isEditMode: boolean;
  isEO: boolean;
  onDependencyModeChange: (mode: 'all' | 'any_one') => void;
  onSelectedDependenciesChange: (dependencies: string[]) => void;
}

const getHierarchicalNumber = (step: WorkflowStep) => {
  const level1 = step.level_1 || 0;
  const level2 = step.level_2 || 0;
  const level3 = step.level_3 || 0;
  return `${level1}.${level2}.${level3}`;
};

const DependencySelector: React.FC<DependencySelectorProps> = ({
  isParallel,
  dependencyMode,
  selectedDependencies,
  availableSteps,
  isDependencyLocked,
  isEditMode,
  isEO,
  onDependencyModeChange,
  onSelectedDependenciesChange,
}) => {
  if (isParallel) {
    return null;
  }

  if (!isEO || (isEditMode && isDependencyLocked)) {
    if (selectedDependencies.length === 0) {
      return null;
    }

    return (
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Lock className="w-4 h-4 text-gray-600" />
          <h4 className="text-sm font-medium text-gray-900">Dependencies (Locked)</h4>
        </div>
        <p className="text-xs text-gray-600 mb-2">
          Dependencies are locked and cannot be modified after workflow creation.
        </p>
        <div className="space-y-1">
          {selectedDependencies.map((depId) => {
            const depStep = availableSteps.find(s => s.id === depId);
            if (!depStep) return null;
            return (
              <div key={depId} className="text-sm text-gray-700 flex items-center space-x-2">
                <span className="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded">
                  {getHierarchicalNumber(depStep)}
                </span>
                <span>{depStep.title}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 space-y-4">
      <div className="flex items-start space-x-2">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-900 mb-1">Serial Workflow Dependencies</h4>
          <p className="text-xs text-blue-800">
            Configure which workflows must be completed before this one can proceed. Dependencies will be locked after creation.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Dependency Mode</label>
        <div className="flex items-center space-x-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="dependencyMode"
              value="all"
              checked={dependencyMode === 'all'}
              onChange={() => onDependencyModeChange('all')}
              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">All dependencies must complete</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="dependencyMode"
              value="any_one"
              checked={dependencyMode === 'any_one'}
              onChange={() => onDependencyModeChange('any_one')}
              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Any one dependency must complete</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {dependencyMode === 'all'
            ? 'All selected dependencies must be completed before this workflow can proceed.'
            : 'At least one of the selected dependencies must be completed before this workflow can proceed.'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Dependencies</label>
        {availableSteps.length === 0 ? (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-200">
            No available workflows to depend on. Create workflows at the same or higher level first.
          </div>
        ) : (
          <div className="space-y-2">
            <select
              multiple
              value={selectedDependencies}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                onSelectedDependenciesChange(selected);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
            >
              {availableSteps.map((step) => (
                <option key={step.id} value={step.id}>
                  {getHierarchicalNumber(step)} - {step.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Hold Ctrl/Cmd to select multiple workflows. Selected: {selectedDependencies.length}
            </p>
          </div>
        )}
      </div>

      {selectedDependencies.length > 0 && (
        <div className="bg-white border border-blue-200 rounded p-3">
          <h5 className="text-xs font-medium text-gray-900 mb-2">Selected Dependencies:</h5>
          <div className="space-y-1">
            {selectedDependencies.map((depId) => {
              const depStep = availableSteps.find(s => s.id === depId);
              if (!depStep) return null;
              return (
                <div key={depId} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {getHierarchicalNumber(depStep)}
                    </span>
                    <span className="text-gray-700">{depStep.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectedDependenciesChange(
                        selectedDependencies.filter(id => id !== depId)
                      );
                    }}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
        <div className="flex items-start space-x-2">
          <Lock className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-800">
            Dependencies will be locked after this workflow is created and cannot be modified later.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DependencySelector;
