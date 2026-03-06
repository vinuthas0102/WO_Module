import React from 'react';
import { Plus, Search, Layers } from 'lucide-react';
import { Ticket, WorkflowStep, WorkflowStepStatus, DisplayMode } from '../../types';
import { CollapsibleFilterPanel } from '../common/CollapsibleFilterPanel';
import { TopRightControls } from '../common/TopRightControls';
import ViewTypeToggle from '../common/ViewTypeToggle';
import IconDisplayWrapper from '../iconDisplay/IconDisplayWrapper';
import BulkStepCreationModal from '../ticket/BulkStepCreationModal';
import { getStatusBadgeColor, hierarchyColorLegend } from '../../lib/hierarchyColors';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import StepCard, { StepCardSharedProps } from './StepCard';
import StepForm from './StepForm';

interface StepListContainerProps extends StepCardSharedProps {
  filteredRootSteps: WorkflowStep[];
  rootSteps: WorkflowStep[];
  hasActiveFilters: boolean | string | WorkflowStepStatus;
  activeFilterCount: number;
  displayMode: DisplayMode;
  handleDisplayModeChange: (mode: DisplayMode) => void;
  showAddForm: boolean;
  setShowAddForm: (show: boolean) => void;
  parentStepForNewStep: WorkflowStep | null;
  setParentStepForNewStep: (step: WorkflowStep | null) => void;
  isFilterPanelOpen: boolean;
  setIsFilterPanelOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterStatus: WorkflowStepStatus | '';
  setFilterStatus: (s: WorkflowStepStatus | '') => void;
  filterAssignedTo: string;
  setFilterAssignedTo: (id: string) => void;
  filterHierarchyLevel: '1' | '2' | '3' | '';
  setFilterHierarchyLevel: (l: '1' | '2' | '3' | '') => void;
  clearAllFilters: () => void;
  onBulkAdd: () => void;
  showBulkModal: boolean;
  bulkParentStep: WorkflowStep | null;
  onCloseBulkModal: () => void;
  onBulkSuccess: () => void;
}

const StepListContainer: React.FC<StepListContainerProps> = ({
  ticket,
  filteredRootSteps,
  rootSteps,
  hasActiveFilters,
  activeFilterCount,
  displayMode,
  handleDisplayModeChange,
  canManageWorkflows,
  showAddForm,
  setShowAddForm,
  editingStep,
  parentStepForNewStep,
  setParentStepForNewStep,
  isFilterPanelOpen,
  setIsFilterPanelOpen,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  filterAssignedTo,
  setFilterAssignedTo,
  filterHierarchyLevel,
  setFilterHierarchyLevel,
  clearAllFilters,
  onBulkAdd,
  showBulkModal,
  bulkParentStep,
  onCloseBulkModal,
  onBulkSuccess,
  handleAddWorkflow,
  getSortedWorkflows,
  getStepActionsFn,
  getHierarchicalWorkflowNumber,
  toggleExpanded,
  ...sharedProps
}) => {
  const { displayPreferences, user } = useAuth();
  const { users } = useTickets();

  const stepCardSharedProps: StepCardSharedProps = {
    ticket,
    canManageWorkflows,
    editingStep,
    handleAddWorkflow,
    getSortedWorkflows,
    getStepActionsFn,
    getHierarchicalWorkflowNumber,
    toggleExpanded,
    setParentStepForNewStep,
    ...sharedProps,
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        {canManageWorkflows && (
          <h3 className="text-base font-medium text-gray-900">Workflow</h3>
        )}
        <TopRightControls>
          {ticket.workflow.length > 0 && (
            <CollapsibleFilterPanel
              isOpen={isFilterPanelOpen}
              onToggle={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              onClear={clearAllFilters}
              activeFilterCount={activeFilterCount}
              position="right"
              direction="down"
              panelClassName="w-[500px]"
            >
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search workflows..."
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as WorkflowStepStatus | '')}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="WIP">WIP (Active)</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Assigned To</label>
                    <select
                      value={filterAssignedTo}
                      onChange={(e) => setFilterAssignedTo(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">All Users</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Hierarchy Level</label>
                    <select
                      value={filterHierarchyLevel}
                      onChange={(e) => setFilterHierarchyLevel(e.target.value as '1' | '2' | '3' | '')}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">All Levels</option>
                      <option value="1">Level 1</option>
                      <option value="2">Level 2</option>
                      <option value="3">Level 3</option>
                    </select>
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Showing {filteredRootSteps.length} of {rootSteps.length} workflows</span>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleFilterPanel>
          )}
          <ViewTypeToggle value={displayMode} onChange={handleDisplayModeChange} />
          {canManageWorkflows && !showAddForm && !editingStep && (
            <>
              <button
                onClick={() => {
                  setParentStepForNewStep(null);
                  setShowAddForm(true);
                  sharedProps.setAddingSubTaskForStepId(null);
                }}
                className="bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                title="Add Workflow"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={onBulkAdd}
                className="bg-green-600 text-white p-1.5 rounded-lg hover:bg-green-700 transition-colors duration-200"
                title="Bulk Add Workflows"
              >
                <Layers className="w-4 h-4" />
              </button>
            </>
          )}
        </TopRightControls>
      </div>

      {ticket.workflow.length > 0 && (
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg px-3 py-1.5 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Legend:</span>
            <div className="flex items-center space-x-3">
              {hierarchyColorLegend.map((item) => (
                <div key={item.level} className="flex items-center space-x-1">
                  <div className={`w-3 h-3 ${item.color} rounded border border-gray-400`}></div>
                  <span className="text-xs text-gray-700 font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAddForm && canManageWorkflows && (
        <StepForm
          parentStep={parentStepForNewStep}
          ticket={ticket}
          onSubmit={handleAddWorkflow}
          onCancel={() => {
            setShowAddForm(false);
            setParentStepForNewStep(null);
          }}
        />
      )}

      <div className="space-y-2">
        {filteredRootSteps.length === 0 && hasActiveFilters ? (
          <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-500">No workflows match your search criteria.</p>
            <button
              onClick={clearAllFilters}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Clear filters to see all workflows
            </button>
          </div>
        ) : displayMode === 'card' ? (
          getSortedWorkflows(filteredRootSteps).map(step => (
            <StepCard
              key={step.id}
              step={step}
              depth={0}
              {...stepCardSharedProps}
            />
          ))
        ) : displayMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Title</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Assigned To</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Progress</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Dependencies</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {getSortedWorkflows(filteredRootSteps).map(step => (
                  <tr key={step.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900 cursor-pointer" onClick={() => toggleExpanded(step.id)}>
                      {getHierarchicalWorkflowNumber(step)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 cursor-pointer" onClick={() => toggleExpanded(step.id)}>
                      {step.title}
                    </td>
                    <td className="px-4 py-2 text-sm cursor-pointer" onClick={() => toggleExpanded(step.id)}>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(step.status)}`}>
                        {step.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700 cursor-pointer" onClick={() => toggleExpanded(step.id)}>
                      {users.find(u => u.id === step.assignedTo)?.name || 'Unassigned'}
                    </td>
                    <td className="px-4 py-2 text-sm cursor-pointer" onClick={() => toggleExpanded(step.id)}>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${step.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 w-10">{step.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm cursor-pointer" onClick={() => toggleExpanded(step.id)}>
                      {step.dependsOn && step.dependsOn.length > 0 && (
                        <span className="text-xs text-gray-600">{step.dependsOn.length} deps</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center">
                        <IconDisplayWrapper
                          actions={getStepActionsFn(step)}
                          preferences={displayPreferences ?? undefined}
                          loading={!displayPreferences && !!user}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-1">
            {getSortedWorkflows(filteredRootSteps).map(step => (
              <div
                key={step.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3 flex-1 cursor-pointer" onClick={() => toggleExpanded(step.id)}>
                  <span className="text-sm font-medium text-gray-700 w-16">
                    {getHierarchicalWorkflowNumber(step)}
                  </span>
                  <span className="text-sm text-gray-900 flex-1">{step.title}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(step.status)}`}>
                    {step.status}
                  </span>
                  <span className="text-xs text-gray-600">
                    {users.find(u => u.id === step.assignedTo)?.name || 'Unassigned'}
                  </span>
                  <div className="flex items-center space-x-2 w-32">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${step.progress || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">{step.progress || 0}%</span>
                  </div>
                </div>
                <div onClick={(e) => e.stopPropagation()} className="ml-3">
                  <IconDisplayWrapper
                    actions={getStepActionsFn(step)}
                    preferences={displayPreferences ?? undefined}
                    loading={!displayPreferences && !!user}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showBulkModal && (
        <BulkStepCreationModal
          ticketId={ticket.id}
          parentStep={bulkParentStep || undefined}
          existingSteps={ticket.workflow}
          onClose={onCloseBulkModal}
          onSuccess={onBulkSuccess}
        />
      )}
    </div>
  );
};

export default StepListContainer;
