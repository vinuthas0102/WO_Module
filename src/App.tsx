import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Settings, MoreVertical, Ticket as TicketIcon, Layers, ChevronRight, Users, FileJson, Package, FileCheck } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TicketProvider, useTickets } from './context/TicketContext';
import LoginForm from './components/auth/LoginForm';
import ModuleSelection from './components/auth/ModuleSelection';
import LandingPage from './components/landing/LandingPage';
import Header from './components/layout/Header';
import StatusCards from './components/dashboard/StatusCards';
import SearchPanel from './components/dashboard/SearchPanel';
import TicketGrid from './components/dashboard/TicketGrid';
import TicketView from './components/ticket/TicketView';
import TicketForm from './components/ticket/TicketForm';
import BulkTicketCreationModal from './components/ticket/BulkTicketCreationModal';
import CopyTicketModal from './components/ticket/CopyTicketModal';
import LoadingSpinner from './components/common/LoadingSpinner';
import FieldConfigurationManager from './components/admin/FieldConfigurationManager';
import UserManagementPage from './components/admin/UserManagementPage';
import UserPreferencesPage from './components/admin/UserPreferencesPage';
import FileReferenceTemplateManager from './components/admin/FileReferenceTemplateManager';
import { getModuleTerminologyLower } from './lib/utils';
import ItemMasterManager from './components/admin/ItemMasterManager';
import SpecMasterManager from './components/admin/SpecMasterManager';
import { Ticket, TicketStatus } from './types';

interface SearchFilters {
  search: string;
  status: TicketStatus | '';
  assignedTo: string;
  priority: string;
  department: string;
}

const Dashboard: React.FC = () => {
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
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showUserPreferences, setShowUserPreferences] = useState(false);
  const [showFileReferenceManager, setShowFileReferenceManager] = useState(false);
  const [showItemMasterManager, setShowItemMasterManager] = useState(false);
  const [showSpecMasterManager, setShowSpecMasterManager] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showCreateSubmenu, setShowCreateSubmenu] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    search: '',
    status: '',
    assignedTo: '',
    priority: '',
    department: ''
  });

  // Apply status filter to search filters when status card is clicked
  useEffect(() => {
    setSearchFilters(prev => ({
      ...prev,
      status: statusFilter || ''
    }));
  }, [statusFilter]);

  // Update selectedTicket when tickets array changes to reflect workflow updates
  useEffect(() => {
    if (selectedTicket && showTicketView) {
      const updatedTicket = tickets.find(t => t.id === selectedTicket.id);
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
      }
    }
  }, [tickets, showTicketView]);

  // Close actions menu when clicking outside
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

    // Handle unassigned filter specially
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
    // In real app, this would call the delete function
    console.log('Delete ticket:', ticketId);
    // await deleteTicket(ticketId);
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

  const getIconComponent = (iconName: string) => {
    // Map icon names to actual emoji icons
    const iconMap: Record<string, string> = {
      'Wrench': '🔧',
      'AlertTriangle': '⚠️',
      'Users': '👥',
      'FileText': '📄',
      'Briefcase': '💼'
    };
    return iconMap[iconName] || '📋';
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-lg">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  // Show user management
  if (showUserManagement && user?.role === 'EO') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header />
        <main className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto mb-4">
            <button
              onClick={() => setShowUserManagement(false)}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </button>
          </div>
          <UserManagementPage />
        </main>
      </div>
    );
  }

  // Show user preferences
  if (showUserPreferences) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header />
        <main className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto mb-4">
            <button
              onClick={() => setShowUserPreferences(false)}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </button>
          </div>
          <UserPreferencesPage />
        </main>
      </div>
    );
  }

  // Show file reference template manager
  if (showFileReferenceManager && user?.role === 'EO') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <button
              onClick={() => setShowFileReferenceManager(false)}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </button>
          </div>
          <FileReferenceTemplateManager user={user} />
        </main>
      </div>
    );
  }

  // Show item master manager
  if (showItemMasterManager && user?.role === 'EO') {
    return (
      <ItemMasterManager
        userId={user.id}
        onClose={() => setShowItemMasterManager(false)}
      />
    );
  }

  // Show spec master manager
  if (showSpecMasterManager && user?.role === 'EO') {
    return (
      <SpecMasterManager
        userId={user.id}
        onClose={() => setShowSpecMasterManager(false)}
      />
    );
  }

  // Show admin panel
  if (showAdminPanel && user?.role === 'EO') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <button
              onClick={() => setShowAdminPanel(false)}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </button>
          </div>
          <FieldConfigurationManager
            modules={availableModules}
            user={user}
          />
        </main>
      </div>
    );
  }

  // Show ticket view screen
  if (showTicketView && selectedTicket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Header />
        <TicketView
          ticket={selectedTicket}
          onClose={() => {
            setShowTicketView(false);
            setSelectedTicket(null);
          }}
          onEdit={handleEditTicket}
          onDelete={handleDeleteTicket}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="mb-2 bg-white bg-opacity-60 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white border-opacity-20 relative z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {selectedModule && (
                <div className="flex items-center space-x-3">
                  <div className="text-4xl">
                    {getIconComponent(selectedModule.icon)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {selectedModule.name}
                    </h2>
                    <p className="text-gray-700 text-sm">
                      Welcome back, {user?.name}! You have access to{' '}
                      {user?.role === 'EO' ? 'all tickets across departments' : 
                       user?.role === 'DO' ? `${user.department} department tickets` : 
                       'your personal tickets'}.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative z-[100]" ref={actionsMenuRef}>
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                title="Actions Menu"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showActionsMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[9999]">
                  <div>
                    <button
                      onClick={() => setShowCreateSubmenu(!showCreateSubmenu)}
                      className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-colors flex items-center justify-between text-gray-700 hover:text-orange-600"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg shadow-sm">
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
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-t border-blue-100 py-1.5 px-2">
                        <button
                          onClick={() => {
                            setCopiedTicket(null);
                            setShowCreateForm(true);
                            setShowActionsMenu(false);
                            setShowCreateSubmenu(false);
                          }}
                          className="w-full px-3 py-2.5 text-left hover:bg-white hover:shadow-sm rounded-md transition-all flex items-center space-x-3 text-gray-700 hover:text-blue-600"
                        >
                          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-1.5 rounded-md shadow-sm">
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
                            setShowActionsMenu(false);
                            setShowCreateSubmenu(false);
                          }}
                          className="w-full px-3 py-2.5 text-left hover:bg-white hover:shadow-sm rounded-md transition-all flex items-center space-x-3 text-gray-700 hover:text-purple-600 mt-1"
                        >
                          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-1.5 rounded-md shadow-sm">
                            <Plus className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-purple-700">Copy from Old</div>
                            <div className="text-xs text-purple-600">Clone existing {terminology}</div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setShowBulkCreateModal(true);
                            setShowActionsMenu(false);
                            setShowCreateSubmenu(false);
                          }}
                          className="w-full px-3 py-2.5 text-left hover:bg-white hover:shadow-sm rounded-md transition-all flex items-center space-x-3 text-gray-700 hover:text-green-600 mt-1"
                        >
                          <div className="bg-gradient-to-r from-green-600 to-green-700 p-1.5 rounded-md shadow-sm">
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
                        onClick={() => {
                          setShowUserManagement(true);
                          setShowActionsMenu(false);
                          setShowCreateSubmenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 text-gray-700 hover:text-gray-900 border-t border-gray-100"
                      >
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 rounded-lg">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">User Management</div>
                          <div className="text-xs text-gray-500">Manage system users</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserPreferences(true);
                          setShowActionsMenu(false);
                          setShowCreateSubmenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 text-gray-700 hover:text-gray-900"
                      >
                        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-2 rounded-lg">
                          <Settings className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Display Preferences</div>
                          <div className="text-xs text-gray-500">Customize icon display</div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setShowAdminPanel(true);
                          setShowActionsMenu(false);
                          setShowCreateSubmenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 text-gray-700 hover:text-gray-900"
                      >
                        <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-2 rounded-lg">
                          <Settings className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">Admin Setup</div>
                          <div className="text-xs text-gray-500">Configure fields & modules</div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setShowFileReferenceManager(true);
                          setShowActionsMenu(false);
                          setShowCreateSubmenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 text-gray-700 hover:text-gray-900"
                      >
                        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-2 rounded-lg">
                          <FileJson className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">File References</div>
                          <div className="text-xs text-gray-500">Manage file reference templates</div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setShowItemMasterManager(true);
                          setShowActionsMenu(false);
                          setShowCreateSubmenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 text-gray-700 hover:text-gray-900"
                      >
                        <div className="bg-gradient-to-r from-orange-600 to-red-600 p-2 rounded-lg">
                          <Package className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">WO Items Master</div>
                          <div className="text-xs text-gray-500">Manage work order items</div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setShowSpecMasterManager(true);
                          setShowActionsMenu(false);
                          setShowCreateSubmenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 text-gray-700 hover:text-gray-900"
                      >
                        <div className="bg-gradient-to-r from-green-600 to-teal-600 p-2 rounded-lg">
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
          </div>
        </div>

        <StatusCards 
          onStatusFilter={setStatusFilter}
          activeFilter={statusFilter}
        />

        <SearchPanel 
          filters={searchFilters}
          onFiltersChange={setSearchFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <div className="mb-2 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="bg-white bg-opacity-70 px-3 py-1 rounded-full">Showing {filteredTickets.length} {getModuleTerminologyLower(selectedModule?.id, filteredTickets.length !== 1 ? 'plural' : 'singular')}</span>
          </div>
        </div>

        <TicketGrid 
          tickets={filteredTickets}
          onTicketClick={handleTicketClick}
          expandedTickets={expandedTickets}
          onToggleExpand={handleToggleExpand}
          onModifyTicket={handleModifyTicket}
          viewMode={viewMode}
        />
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

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    if (import.meta.env.DEV) {
      import('./lib/diagnostics').then(({ runDiagnostics, checkDatabaseConnection }) => {
        runDiagnostics();
        checkDatabaseConnection().then(result => {
          console.log('Database connection check:', result);
        });
      });
    }
  }, []);

  if (showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  return (
    <AuthProvider>
      <TicketProvider>
        <AppContent />
      </TicketProvider>
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, isModuleSelected } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  if (!isModuleSelected) {
    return <ModuleSelection />;
  }
  return <Dashboard />;
};

export default App;