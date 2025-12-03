import React, { useState, useEffect } from 'react';
import { Package, ListChecks } from 'lucide-react';
import WOTabsSection from './WOTabsSection';
import WorkflowManagement from './StepManagement';
import { Ticket } from '../../types';
import { DocumentMetadata } from '../../services/fileService';
import { WorkOrderItemService } from '../../services/workOrderItemService';
import { WorkOrderSpecService } from '../../services/workOrderSpecService';

interface WOWorkflowTabsProps {
  ticket: Ticket;
  canEdit: boolean;
  canManage: boolean;
  refreshKey: number;
  onRefresh: () => void;
  onViewDocument: (doc: DocumentMetadata, workflowTitle: string) => void;
  onViewStepSpecs: (stepId: string, stepTitle: string) => void;
  onAllocateSpec: (stepId: string, stepTitle: string) => void;
  onCreateSpec?: (stepId: string, stepTitle: string) => void;
  onAllocateItem: (stepId: string, stepTitle: string) => void;
  onOpenClarification?: (stepId: string, stepTitle: string, assignedUserId: string | undefined) => void;
  onViewProgress?: (stepId: string, stepTitle: string) => void;
  selectedModule?: { id: string };
  completedWorkflows: number;
  totalWorkflows: number;
  workflowsByLevel: {
    level1: number;
    level2: number;
    level3: number;
  };
}

type TabType = 'wo-details' | 'workflow';

const WOWorkflowTabs: React.FC<WOWorkflowTabsProps> = ({
  ticket,
  canEdit,
  canManage,
  refreshKey,
  onRefresh,
  onViewDocument,
  onViewStepSpecs,
  onAllocateSpec,
  onCreateSpec,
  onAllocateItem,
  onOpenClarification,
  onViewProgress,
  selectedModule,
  completedWorkflows,
  totalWorkflows,
  workflowsByLevel
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('workflow');
  const [woItemsCount, setWoItemsCount] = useState(0);
  const [woSpecsCount, setWoSpecsCount] = useState(0);
  const [loadingWoCounts, setLoadingWoCounts] = useState(true);

  const isWOModule = selectedModule?.id === '550e8400-e29b-41d4-a716-446655440106';

  useEffect(() => {
    const loadWOCounts = async () => {
      if (!isWOModule) {
        setLoadingWoCounts(false);
        return;
      }

      try {
        setLoadingWoCounts(true);
        const [items, specs] = await Promise.all([
          WorkOrderItemService.getItemDetailsByTicket(ticket.id),
          WorkOrderSpecService.getSpecDetailsByTicket(ticket.id),
        ]);
        setWoItemsCount(items.length);
        setWoSpecsCount(specs.length);
      } catch (error) {
        console.error('Error loading WO counts:', error);
      } finally {
        setLoadingWoCounts(false);
      }
    };

    loadWOCounts();
  }, [ticket.id, refreshKey, isWOModule]);

  const hasWOData = woItemsCount > 0 || woSpecsCount > 0;
  const showWOTab = isWOModule && hasWOData;

  useEffect(() => {
    if (!loadingWoCounts && !hasWOData && activeTab === 'wo-details') {
      setActiveTab('workflow');
    }
  }, [hasWOData, loadingWoCounts, activeTab]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200">
        <div className="flex items-center px-6 py-4">
          <div className="flex space-x-1">
            {showWOTab && (
              <button
                onClick={() => setActiveTab('wo-details')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'wo-details'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>WO Details</span>
                {(woItemsCount + woSpecsCount) > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      activeTab === 'wo-details'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {woItemsCount + woSpecsCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setActiveTab('workflow')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'workflow'
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <ListChecks className="w-4 h-4" />
              <span>Workflow</span>
              {totalWorkflows > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === 'workflow'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {completedWorkflows}/{totalWorkflows}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'workflow' && totalWorkflows > 0 && (
            <div className="ml-auto flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(completedWorkflows / totalWorkflows) * 100}%` }}
                  ></div>
                </div>
                <span className="text-gray-600">{Math.round((completedWorkflows / totalWorkflows) * 100)}%</span>
              </div>
              <div className="flex items-center space-x-2 border-l pl-3 border-gray-300">
                {workflowsByLevel.level1 > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2.5 h-2.5 bg-blue-400 rounded-full"></div>
                    <span className="text-xs text-gray-600">{workflowsByLevel.level1}</span>
                  </div>
                )}
                {workflowsByLevel.level2 > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full"></div>
                    <span className="text-xs text-gray-600">{workflowsByLevel.level2}</span>
                  </div>
                )}
                {workflowsByLevel.level3 > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2.5 h-2.5 bg-amber-400 rounded-full"></div>
                    <span className="text-xs text-gray-600">{workflowsByLevel.level3}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'wo-details' && showWOTab && (
        <WOTabsSection
          ticketId={ticket.id}
          canEdit={canEdit}
          refreshKey={refreshKey}
          onRefresh={onRefresh}
        />
      )}

      {activeTab === 'workflow' && (
        <div className="p-6">
          <WorkflowManagement
            ticket={ticket}
            canManage={canManage}
            onViewDocument={(doc, step) => {
              onViewDocument(doc, step.title);
            }}
            onViewStepSpecs={onViewStepSpecs}
            onAllocateSpec={onAllocateSpec}
            onCreateSpec={onCreateSpec}
            onAllocateItem={onAllocateItem}
            onOpenClarification={onOpenClarification}
            onViewProgress={onViewProgress}
          />
        </div>
      )}
    </div>
  );
};

export default WOWorkflowTabs;
