import React, { useState, useEffect } from 'react';
import { Package, ListChecks, FileText, BookOpen, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import WOTabsSection from './WOTabsSection';
import WorkflowManagement from './StepManagement';
import WOInfoDisplay from './WOInfoDisplay';
import { Ticket } from '../../types';
import { DocumentMetadata } from '../../services/fileService';
import { WorkOrderItemService } from '../../services/workOrderItemService';
import { WorkOrderSpecService } from '../../services/workOrderSpecService';
import { MeasurementBookService } from '../../services/measurementBookService';
import { BillingService } from '../../services/billingService';
import { MBookTabContent } from './MBookTabContent';
import { BillManager } from './BillManager';

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
  createdByUser?: { id: string; name: string };
  assignedToUser?: { id: string; name: string };
  isOverdue: boolean;
  userRole?: string;
  getPriorityColor: (priority: string) => string;
  formatDate: (date: Date) => string;
  ticketAttachments: DocumentMetadata[];
  loadingAttachments: boolean;
  uploadingFile: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadAttachment: (attachment: DocumentMetadata) => void;
  onDeleteAttachment: (id: string) => void;
  activeHighlightedStepId?: string | null;
}

type TabType = 'wo-info' | 'wo-details' | 'measurement-book' | 'bills' | 'workflow';

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
  workflowsByLevel,
  createdByUser,
  assignedToUser,
  isOverdue,
  userRole,
  getPriorityColor,
  formatDate,
  ticketAttachments,
  loadingAttachments,
  uploadingFile,
  fileInputRef,
  onFileUpload,
  onDownloadAttachment,
  onDeleteAttachment,
  activeHighlightedStepId
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('wo-info');
  const [woItemsCount, setWoItemsCount] = useState(0);
  const [woSpecsCount, setWoSpecsCount] = useState(0);
  const [mbookCount, setMbookCount] = useState(0);
  const [billsCount, setBillsCount] = useState(0);
  const [loadingWoCounts, setLoadingWoCounts] = useState(true);
  const [loadingMbookCount, setLoadingMbookCount] = useState(true);
  const [loadingBillsCount, setLoadingBillsCount] = useState(true);
  const [visibleStartIndex, setVisibleStartIndex] = useState(0);

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

  useEffect(() => {
    const loadMbookCount = async () => {
      if (!isWOModule) {
        setLoadingMbookCount(false);
        return;
      }

      try {
        setLoadingMbookCount(true);
        const entries = await MeasurementBookService.getMbookEntriesByTicket(ticket.id);
        setMbookCount(entries.length);
      } catch (error) {
        console.error('Error loading mbook count:', error);
      } finally {
        setLoadingMbookCount(false);
      }
    };

    loadMbookCount();
  }, [ticket.id, refreshKey, isWOModule]);

  useEffect(() => {
    const loadBillsCount = async () => {
      if (!isWOModule) {
        setLoadingBillsCount(false);
        return;
      }

      try {
        setLoadingBillsCount(true);
        const bills = await BillingService.getBillsByTicket(ticket.id);
        setBillsCount(bills.length);
      } catch (error) {
        console.error('Error loading bills count:', error);
      } finally {
        setLoadingBillsCount(false);
      }
    };

    loadBillsCount();
  }, [ticket.id, refreshKey, isWOModule]);

  const hasWOData = woItemsCount > 0 || woSpecsCount > 0;
  const showWODetailsTab = isWOModule && hasWOData;
  const showMBookTab = isWOModule && mbookCount > 0;
  const showBillsTab = isWOModule && billsCount > 0;

  const workOrderData = ticket.data as any;
  const showWOInfoTab = isWOModule;

  useEffect(() => {
    if (!loadingWoCounts && !hasWOData && activeTab === 'wo-details') {
      setActiveTab('wo-info');
    }
  }, [hasWOData, loadingWoCounts, activeTab]);

  const getVisibleTabs = (): TabType[] => {
    const tabs: TabType[] = [];
    if (showWOInfoTab) tabs.push('wo-info');
    if (showWODetailsTab) tabs.push('wo-details');
    tabs.push('workflow');
    if (showMBookTab) tabs.push('measurement-book');
    if (showBillsTab) tabs.push('bills');
    return tabs;
  };

  const MAX_VISIBLE_TABS = 3;

  const getVisibleTabsWindow = (): TabType[] => {
    const allTabs = getVisibleTabs();
    if (allTabs.length <= MAX_VISIBLE_TABS) {
      return allTabs;
    }
    return allTabs.slice(visibleStartIndex, visibleStartIndex + MAX_VISIBLE_TABS);
  };

  const navigateTab = (direction: 'prev' | 'next') => {
    const allTabs = getVisibleTabs();

    if (direction === 'prev' && visibleStartIndex > 0) {
      setVisibleStartIndex(visibleStartIndex - 1);
    } else if (direction === 'next' && visibleStartIndex + MAX_VISIBLE_TABS < allTabs.length) {
      setVisibleStartIndex(visibleStartIndex + 1);
    }
  };

  const canNavigatePrev = () => {
    return visibleStartIndex > 0;
  };

  const canNavigateNext = () => {
    const allTabs = getVisibleTabs();
    return visibleStartIndex + MAX_VISIBLE_TABS < allTabs.length;
  };

  useEffect(() => {
    const allTabs = getVisibleTabs();
    const activeIndex = allTabs.indexOf(activeTab);

    if (activeIndex >= 0) {
      if (activeIndex < visibleStartIndex) {
        setVisibleStartIndex(activeIndex);
      } else if (activeIndex >= visibleStartIndex + MAX_VISIBLE_TABS) {
        setVisibleStartIndex(Math.max(0, activeIndex - MAX_VISIBLE_TABS + 1));
      }
    }
  }, [activeTab, showWOInfoTab, showWODetailsTab, showMBookTab, showBillsTab]);

  const renderTab = (tab: TabType) => {
    const isActive = activeTab === tab;

    const getTabStyles = (tab: TabType, isActive: boolean) => {
      const baseClasses = 'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200';
      const inactiveClasses = 'text-gray-600 hover:text-gray-900 hover:bg-gray-50';

      const activeStyles: Record<TabType, string> = {
        'wo-info': 'bg-orange-50 text-orange-700 border-b-2 border-orange-600',
        'wo-details': 'bg-blue-50 text-blue-700 border-b-2 border-blue-600',
        'workflow': 'bg-teal-50 text-teal-700 border-b-2 border-teal-600',
        'measurement-book': 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600',
        'bills': 'bg-green-50 text-green-700 border-b-2 border-green-600'
      };

      return `${baseClasses} ${isActive ? activeStyles[tab] : inactiveClasses}`;
    };

    const getBadgeStyles = (tab: TabType, isActive: boolean) => {
      const baseClasses = 'px-2 py-0.5 rounded-full text-xs font-semibold';
      const inactiveClasses = 'bg-gray-200 text-gray-600';

      const activeStyles: Record<TabType, string> = {
        'wo-info': 'bg-orange-100 text-orange-700',
        'wo-details': 'bg-blue-100 text-blue-700',
        'workflow': 'bg-teal-100 text-teal-700',
        'measurement-book': 'bg-emerald-100 text-emerald-700',
        'bills': 'bg-green-100 text-green-700'
      };

      return `${baseClasses} ${isActive ? activeStyles[tab] : inactiveClasses}`;
    };

    switch (tab) {
      case 'wo-info':
        return (
          <button key={tab} onClick={() => setActiveTab(tab)} className={getTabStyles(tab, isActive)}>
            <FileText className="w-4 h-4" />
            <span>WO Info</span>
          </button>
        );
      case 'wo-details':
        return (
          <button key={tab} onClick={() => setActiveTab(tab)} className={getTabStyles(tab, isActive)}>
            <Package className="w-4 h-4" />
            <span>WO Details</span>
            {(woItemsCount + woSpecsCount) > 0 && (
              <span className={getBadgeStyles(tab, isActive)}>
                {woItemsCount + woSpecsCount}
              </span>
            )}
          </button>
        );
      case 'workflow':
        return (
          <button key={tab} onClick={() => setActiveTab(tab)} className={getTabStyles(tab, isActive)}>
            <ListChecks className="w-4 h-4" />
            <span>Workflow</span>
            {totalWorkflows > 0 && (
              <span className={getBadgeStyles(tab, isActive)}>
                {completedWorkflows}/{totalWorkflows}
              </span>
            )}
          </button>
        );
      case 'measurement-book':
        return (
          <button key={tab} onClick={() => setActiveTab(tab)} className={getTabStyles(tab, isActive)}>
            <BookOpen className="w-4 h-4" />
            <span>Measurement Book</span>
            {mbookCount > 0 && (
              <span className={getBadgeStyles(tab, isActive)}>
                {mbookCount}
              </span>
            )}
          </button>
        );
      case 'bills':
        return (
          <button key={tab} onClick={() => setActiveTab(tab)} className={getTabStyles(tab, isActive)}>
            <DollarSign className="w-4 h-4" />
            <span>Bills</span>
            {billsCount > 0 && (
              <span className={getBadgeStyles(tab, isActive)}>
                {billsCount}
              </span>
            )}
          </button>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center flex-1">
            <button
              onClick={() => navigateTab('prev')}
              disabled={!canNavigatePrev()}
              className={`mr-3 p-2 rounded-lg transition-all duration-200 ${
                canNavigatePrev()
                  ? 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="Previous tab"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex space-x-1 flex-1">
              {getVisibleTabsWindow().map(tab => renderTab(tab))}
            </div>
            <button
              onClick={() => navigateTab('next')}
              disabled={!canNavigateNext()}
              className={`ml-3 p-2 rounded-lg transition-all duration-200 ${
                canNavigateNext()
                  ? 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="Next tab"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          {getVisibleTabs().length > MAX_VISIBLE_TABS && (
            <div className="ml-4 text-xs text-gray-500 font-medium">
              {visibleStartIndex + 1}-{Math.min(visibleStartIndex + MAX_VISIBLE_TABS, getVisibleTabs().length)} of {getVisibleTabs().length}
            </div>
          )}

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

      {activeTab === 'wo-info' && showWOInfoTab && (
        <WOInfoDisplay
          workOrderData={workOrderData}
          ticket={{
            description: ticket.description,
            priority: ticket.priority,
            department: ticket.department,
            category: ticket.category,
            createdAt: ticket.createdAt,
            dueDate: ticket.dueDate
          }}
          createdByUser={createdByUser}
          assignedToUser={assignedToUser}
          totalWorkflows={totalWorkflows}
          completedWorkflows={completedWorkflows}
          isOverdue={isOverdue}
          userRole={userRole}
          getPriorityColor={getPriorityColor}
          formatDate={formatDate}
          ticketAttachments={ticketAttachments}
          loadingAttachments={loadingAttachments}
          uploadingFile={uploadingFile}
          canEdit={canEdit}
          fileInputRef={fileInputRef}
          onFileUpload={onFileUpload}
          onDownloadAttachment={onDownloadAttachment}
          onDeleteAttachment={onDeleteAttachment}
        />
      )}

      {activeTab === 'wo-details' && showWODetailsTab && (
        <WOTabsSection
          ticketId={ticket.id}
          ticketNumber={ticket.ticketNumber}
          ticketTitle={ticket.title}
          canEdit={canEdit}
          refreshKey={refreshKey}
          onRefresh={onRefresh}
          ticket={ticket}
          woInfoContent={
            <WOInfoDisplay
              workOrderData={workOrderData}
              ticket={{
                description: ticket.description,
                priority: ticket.priority,
                department: ticket.department,
                category: ticket.category,
                createdAt: ticket.createdAt,
                dueDate: ticket.dueDate
              }}
              createdByUser={createdByUser}
              assignedToUser={assignedToUser}
              totalWorkflows={totalWorkflows}
              completedWorkflows={completedWorkflows}
              isOverdue={isOverdue}
              userRole={userRole}
              getPriorityColor={getPriorityColor}
              formatDate={formatDate}
              ticketAttachments={ticketAttachments}
              loadingAttachments={loadingAttachments}
              uploadingFile={uploadingFile}
              canEdit={canEdit}
              fileInputRef={fileInputRef}
              onFileUpload={onFileUpload}
              onDownloadAttachment={onDownloadAttachment}
              onDeleteAttachment={onDeleteAttachment}
            />
          }
          workflowContent={
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center space-x-2 text-green-700">
                  <ListChecks className="w-5 h-5" />
                  <span className="text-sm font-semibold">Workflow Tasks</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    {completedWorkflows}/{totalWorkflows}
                  </span>
                </div>
              </div>
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
                  activeHighlightedStepId={activeHighlightedStepId}
                />
              </div>
            </div>
          }
          completedWorkflows={completedWorkflows}
          totalWorkflows={totalWorkflows}
        />
      )}

      {activeTab === 'measurement-book' && showMBookTab && (
        <MBookTabContent
          ticketId={ticket.id}
          ticketNumber={ticket.ticketNumber}
          onRefresh={onRefresh}
        />
      )}

      {activeTab === 'bills' && showBillsTab && (
        <BillManager
          ticketId={ticket.id}
          ticketNumber={ticket.ticketNumber}
          onClose={() => {}}
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
            activeHighlightedStepId={activeHighlightedStepId}
          />
        </div>
      )}
    </div>
  );
};

export default WOWorkflowTabs;
