import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Settings, MoreVertical, Ticket as TicketIcon, Layers, ChevronRight, Users, FileJson, Package, FileCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { useNavigation } from '../../context/NavigationContext';
import Header from '../layout/Header';
import StatusCards from './StatusCards';
import SearchPanel from './SearchPanel';
import TicketGrid from './TicketGrid';
import TicketView from '../ticket/TicketView';
import TicketForm from '../ticket/TicketForm';
import BulkTicketCreationModal from '../ticket/BulkTicketCreationModal';
import CopyTicketModal from '../ticket/CopyTicketModal';
import LoadingSpinner from '../common/LoadingSpinner';
import FieldConfigurationManager from '../admin/FieldConfigurationManager';
import UserManagementPage from '../admin/UserManagementPage';
import UserPreferencesPage from '../admin/UserPreferencesPage';
import FileReferenceTemplateManager from '../admin/FileReferenceTemplateManager';
import ItemMasterManager from '../admin/ItemMasterManager';
import SpecMasterManager from '../admin/SpecMasterManager';
import { getModuleTerminologyLower } from '../../lib/utils';
import { Ticket, TicketStatus } from '../../types';

interface SearchFilters {
  search: string;
  status: TicketStatus | '';
  assignedTo: string;
  priority: string;
  department: string;
}

const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, string> = {
    'Wrench': '🔧',
    'AlertTriangle': '⚠️',
    'Users': '👥',
    'FileText': '📄',
    'Briefcase': '💼'
  };
  return iconMap[iconName] || '📋';
};

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <div className="max-w-7xl mx-auto mb-4">
    <button
      onClick={onClick}
      className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
    >
      <span>←</span>
      <span>Back to Dashboard</span>
    </button>
  </div>
);

const DashboardPage: React.FC = () => {
  const { user, selectedModule, availableModules } = useAuth();
  const { tickets, loading, error, getFilteredTickets } = useTickets();

  const terminology = getModuleTerminologyLower(selectedModule?.id, 'singular');
  const terminologyPlural = getModuleTerminologyLower(selectedModule?.id, 'plural');

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showTicketView, setShowTicketView] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false);
  const [showCopyTicketModal, setShowCopyTicketModal] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState<Ticket | null>(null);
  const [copiedAttachmentIds, setCopiedAttachmentIds] = useState<string[]>([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | null>(null);
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showUserPreferences, setShowUserPreferences] = useState(false);
  const [showFileReferenceManager, setShowFileReferenceManager] = useState(false);
  const [showItemMasterManager, setShowItemMasterManager] = useState(false);
  const [showSpecMasterManager, setShowSpecMasterManager] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showCreateSubmenu, setShowCreateSubmenu] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const [initialThreadId, setInitialThreadId] = useState<string | null>(null);

  const { pendingNavigation, clearPendingNavigation } = useNavigation();

  useEffect(() => {
    if (!pendingNavigation) return;
    const target = tickets.find(t => t.id === pendingNavigation.ticketId);
    if (target) {
      setInitialThreadId(pendingNavigation.threadId);
      setSelectedTicket(target);
      setShowTicketView(true);
      clearPendingNavigation();
    }
  }, [pendingNavigation, tickets]);

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    search: '',
    status: '',
    assignedTo: '',
    priority: '',
    department: ''
  });

  useEffect(() => {
    setSearchFilters(prev => ({
      ...prev,
      status: statusFilter || ''
    }));
  }, [statusFilter]);

  useEffect(() => {
    if (selectedTicket && showTicketView) {
      const updatedTicket = tickets.find(t => t.id === selectedTicket.id);
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
      }
    }
  }, [tickets, showTicketView]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };

    if (showActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionsMenu]);

  const filteredTickets = useMemo(() => {
    const filters = {
      search: searchFilters.search,
      status: searchFilters.status || undefined,
      assignedTo: searchFilters.assignedTo === 'unassigned' ? undefined : searchFilters.assignedTo || undefined,
      priority: searchFilters.priority || undefined,
      department: searchFilters.department || undefined
    };

    let result = getFilteredTickets(filters);

    if (searchFilters.assignedTo === 'unassigned') {
      result = result.filter(ticket => !ticket.assignedTo);
    }

    return result;
  }, [tickets, searchFilters, getFilteredTickets]);

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowTicketView(true);
  };

  const handleEditTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowTicketView(false);
    setShowEditForm(true);
  };

  const handleDeleteTicket = async (ticketId: string) => {
    console.log('Delete ticket:', ticketId);
  };

  const handleToggleExpand = (ticketId: string) => {
    const newExpanded = new Set(expandedTickets);
    if (newExpanded.has(ticketId)) {
      newExpanded.delete(ticketId);
    } else {
      newExpanded.add(ticketId);
    }
    setExpandedTickets(newExpanded);
  };

  const handleModifyTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowTicketView(false);
    setShowEditForm(true);
  };

  const closeActionsMenu = () => {
    setShowActionsMenu(false);
    setShowCreateSubmenu(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-lg">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (showUserManagement && user?.role === 'EO') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50">
        <Header />
        <main className="px-4 sm:px-6 lg:px-8 py-6">
          <BackButton onClick={() => setShowUserManagement(false)} />
          <UserManagementPage />
        </main>
      </div>
    );
  }

  if (showUserPreferences) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50">
        <Header />
        <main className="px-4 sm:px-6 lg:px-8 py-6">
          <BackButton onClick={() => setShowUserPreferences(false)} />
          <UserPreferencesPage />
        </main>
      </div>
    );
  }

  if (showFileReferenceManager && user?.role === 'EO') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <BackButton onClick={() => setShowFileReferenceManager(false)} />
          <FileReferenceTemplateManager user={user} />
        </main>
      </div>
    );
  }

  if (showItemMasterManager && user?.role === 'EO') {
    return (
      <ItemMasterManager
        userId={user.id}
        onClose={() => setShowItemMasterManager(false)}
      />
    );
  }

  if (showSpecMasterManager && user?.role === 'EO') {
    return (
      <SpecMasterManager
        userId={user.id}
        onClose={() => setShowSpecMasterManager(false)}
      />
    );
  }

  if (showAdminPanel && user?.role === 'EO') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <BackButton onClick={() => setShowAdminPanel(false)} />
          <FieldConfigurationManager
            modules={availableModules}
            user={user}
          />
        </main>
      </div>
    );
  }

  if (showTicketView && selectedTicket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50">
        <Header />
        <TicketView
          ticket={selectedTicket}
          onClose={() => {
            setShowTicketView(false);
            setSelectedTicket(null);
            setInitialThreadId(null);
          }}
          onEdit={handleEditTicket}
          onDelete={handleDeleteTicket}
          initialThreadId={initialThreadId}
        />
      </div>
    );
  }

  const welcomeMessage = `Welcome back, ${user?.name}! You have access to ${
    user?.role === 'EO' ? 'all tickets across departments' :
    user?.role === 'DO' ? `${user.department} department tickets` :
    'your personal tickets'
  }.`;

  const actionsMenuComponent = (
    <div ref={actionsMenuRef}>
      <button
        onClick={() => setShowActionsMenu(!showActionsMenu)}
        className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 border border-white border-opacity-30"
        title="Actions Menu"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {showActionsMenu && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[9999]">
          <div>
            <button
              onClick={() => setShowCreateSubmenu(!showCreateSubmenu)}
              className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors flex items-center justify-between text-gray-700 hover:text-orange-600"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-orange-500 p-2 rounded-lg shadow-sm">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Create</div>
                  <div className="text-xs text-gray-500">New {terminology} options</div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${showCreateSubmenu ? 'rotate-90' : ''}`} />
            </button>

            {showCreateSubmenu && (
              <div className="bg-blue-50 border-t border-blue-100 py-1.5 px-2">
                <button
                  onClick={() => {
                    setCopiedTicket(null);
                    setShowCreateForm(true);
                    closeActionsMenu();
                  }}
                  className="w-full px-3 py-2.5 text-left hover:bg-white hover:shadow-sm rounded-md transition-all flex items-center space-x-3 text-gray-700 hover:text-blue-600"
                >
                  <div className="bg-blue-500 p-1.5 rounded-md shadow-sm">
                    <TicketIcon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-blue-700">Single {terminology.charAt(0).toUpperCase() + terminology.slice(1)}</div>
                    <div className="text-xs text-blue-600">Create one {terminology}</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowCopyTicketModal(true);
                    closeActionsMenu();
                  }}
                  className="w-full px-3 py-2.5 text-left hover:bg-white hover:shadow-sm rounded-md transition-all flex items-center space-x-3 text-gray-700 hover:text-teal-600 mt-1"
                >
                  <div className="bg-teal-500 p-1.5 rounded-md shadow-sm">
                    <Plus className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-teal-700">Copy from Old</div>
                    <div className="text-xs text-teal-600">Clone existing {terminology}</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowBulkCreateModal(true);
                    closeActionsMenu();
                  }}
                  className="w-full px-3 py-2.5 text-left hover:bg-white hover:shadow-sm rounded-md transition-all flex items-center space-x-3 text-gray-700 hover:text-green-600 mt-1"
                >
                  <div className="bg-green-600 p-1.5 rounded-md shadow-sm">
                    <Layers className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-green-700">Bulk Create</div>
                    <div className="text-xs text-green-600">Multiple {terminologyPlural}</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {user?.role === 'EO' && (
            <>
              <button
                onClick={() => { setShowUserManagement(true); closeActionsMenu(); }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 text-gray-700 hover:text-gray-900 border-t border-gray-100"
              >
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-sm">User Management</div>
                  <div className="text-xs text-gray-500">Manage system users</div>
                </div>
              </button>

              <button
                onClick={() => { setShowUserPreferences(true); closeActionsMenu(); }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 text-gray-700 hover:text-gray-900"
              >
                <div className="bg-gray-600 p-2 rounded-lg">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-sm">Display Preferences</div>
                  <div className="text-xs text-gray-500">Customize icon display</div>
                </div>
              </button>

              <button
                onClick={() => { setShowAdminPanel(true); closeActionsMenu(); }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 text-gray-700 hover:text-gray-900"
              >
                <div className="bg-gray-700 p-2 rounded-lg">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-sm">Admin Setup</div>
                  <div className="text-xs text-gray-500">Configure fields & modules</div>
                </div>
              </button>

              <button
                onClick={() => { setShowFileReferenceManager(true); closeActionsMenu(); }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 text-gray-700 hover:text-gray-900"
              >
                <div className="bg-cyan-600 p-2 rounded-lg">
                  <FileJson className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-sm">File References</div>
                  <div className="text-xs text-gray-500">Manage file reference templates</div>
                </div>
              </button>

              <button
                onClick={() => { setShowItemMasterManager(true); closeActionsMenu(); }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 text-gray-700 hover:text-gray-900"
              >
                <div className="bg-orange-600 p-2 rounded-lg">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-sm">WO Items Master</div>
                  <div className="text-xs text-gray-500">Manage work order items</div>
                </div>
              </button>

              <button
                onClick={() => { setShowSpecMasterManager(true); closeActionsMenu(); }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 text-gray-700 hover:text-gray-900"
              >
                <div className="bg-green-600 p-2 rounded-lg">
                  <FileCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-medium text-sm">WO Specs Master</div>
                  <div className="text-xs text-gray-500">Manage work order specifications</div>
                </div>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-gray-50">
      <Header
        showWelcome={true}
        moduleIcon={selectedModule?.icon}
        welcomeMessage={welcomeMessage}
        actionsMenu={actionsMenuComponent}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">

        <StatusCards
          onStatusFilter={setStatusFilter}
          activeFilter={statusFilter}
        />

        {/* Unified Summary Frame */}
        <div className="bg-white rounded-xl border border-gray-300 shadow-lg overflow-hidden">
          {/* Frame Header with Controls */}
          <div className="sticky top-16 z-20 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 px-6 py-4 flex justify-end items-center shadow-sm">
            <SearchPanel
              filters={searchFilters}
              onFiltersChange={setSearchFilters}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>

          {/* Work Order Cards */}
          <div className="p-6 bg-white">
            <TicketGrid
              tickets={filteredTickets}
              onTicketClick={handleTicketClick}
              expandedTickets={expandedTickets}
              onToggleExpand={handleToggleExpand}
              onModifyTicket={handleModifyTicket}
              viewMode={viewMode}
            />
          </div>
        </div>
      </main>

      <TicketForm
        isOpen={showCreateForm}
        onClose={() => {
          setShowCreateForm(false);
          setCopiedTicket(null);
          setCopiedAttachmentIds([]);
        }}
        copiedTicket={copiedTicket}
        copiedAttachmentIds={copiedAttachmentIds}
      />

      {showCopyTicketModal && (
        <CopyTicketModal
          onClose={() => setShowCopyTicketModal(false)}
          onSelectTicket={(ticket, attachmentIds) => {
            setCopiedTicket(ticket);
            setCopiedAttachmentIds(attachmentIds);
            setShowCreateForm(true);
          }}
        />
      )}

      {showBulkCreateModal && (
        <BulkTicketCreationModal
          onClose={() => setShowBulkCreateModal(false)}
          onSuccess={() => {
            setShowBulkCreateModal(false);
          }}
        />
      )}

      <TicketForm
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
      />
    </div>
  );
};

export default DashboardPage;
