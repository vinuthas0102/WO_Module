import React, { useState, useMemo, useEffect } from 'react';
import { X, Copy, Search, Filter, ChevronRight, List, Table as TableIcon, Grid, Paperclip, CheckSquare, Square, FileText, Download } from 'lucide-react';
import { Ticket, TicketStatus, FileAttachment } from '../../types';
import { useTickets } from '../../context/TicketContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { FileService } from '../../services/fileService';

interface CopyTicketModalProps {
  onClose: () => void;
  onSelectTicket: (ticket: Ticket, selectedAttachmentIds: string[]) => void;
}

type ViewType = 'table' | 'list' | 'card';

interface TicketAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  storagePath: string;
  uploadedAt: Date;
  uploadedBy: string;
}

const CopyTicketModal: React.FC<CopyTicketModalProps> = ({ onClose, onSelectTicket }) => {
  const { tickets } = useTickets();
  const { user, selectedModule } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [viewType, setViewType] = useState<ViewType>('table');
  const [sortColumn, setSortColumn] = useState<keyof Ticket>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [ticketAttachments, setTicketAttachments] = useState<TicketAttachment[]>([]);
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<Set<string>>(new Set());
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [showAttachmentSelection, setShowAttachmentSelection] = useState(false);

  const eligibleTickets = useMemo(() => {
    let filtered = tickets.filter(t => t.moduleId === selectedModule?.id);

    if (user?.role === 'EMPLOYEE') {
      filtered = filtered.filter(t => t.createdBy === user.id);
    } else if (user?.role === 'DO') {
      filtered = filtered.filter(t => t.department === user.department);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.ticketNumber.toLowerCase().includes(term) ||
          t.title.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (aVal instanceof Date && bVal instanceof Date) {
        return sortDirection === 'asc'
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime();
      }

      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [tickets, selectedModule, user, searchTerm, statusFilter, sortColumn, sortDirection]);

  useEffect(() => {
    if (selectedTicket) {
      fetchTicketAttachments(selectedTicket.id);
    } else {
      setTicketAttachments([]);
      setSelectedAttachmentIds(new Set());
      setShowAttachmentSelection(false);
    }
  }, [selectedTicket]);

  const fetchTicketAttachments = async (ticketId: string) => {
    setLoadingAttachments(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('ticket_id', ticketId)
        .is('step_id', null)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      const attachments: TicketAttachment[] = (data || []).map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        size: doc.size,
        storagePath: doc.storage_path,
        uploadedAt: new Date(doc.uploaded_at),
        uploadedBy: doc.uploaded_by,
      }));

      setTicketAttachments(attachments);

      if (attachments.length > 0) {
        const allIds = new Set(attachments.map(a => a.id));
        setSelectedAttachmentIds(allIds);
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
      setTicketAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowAttachmentSelection(false);
  };

  const handleContinueToAttachments = () => {
    if (ticketAttachments.length > 0) {
      setShowAttachmentSelection(true);
    } else {
      handleFinalCopy();
    }
  };

  const handleFinalCopy = () => {
    if (selectedTicket) {
      onSelectTicket(selectedTicket, Array.from(selectedAttachmentIds));
      onClose();
    }
  };

  const toggleAttachment = (attachmentId: string) => {
    const newSelected = new Set(selectedAttachmentIds);
    if (newSelected.has(attachmentId)) {
      newSelected.delete(attachmentId);
    } else {
      newSelected.add(attachmentId);
    }
    setSelectedAttachmentIds(newSelected);
  };

  const toggleAllAttachments = () => {
    if (selectedAttachmentIds.size === ticketAttachments.length) {
      setSelectedAttachmentIds(new Set());
    } else {
      setSelectedAttachmentIds(new Set(ticketAttachments.map(a => a.id)));
    }
  };

  const handleSort = (column: keyof Ticket) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    const colors: Record<TicketStatus, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      CREATED: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      ACTIVE: 'bg-orange-100 text-orange-800',
      COMPLETED: 'bg-green-700 text-white',
      CLOSED: 'bg-gray-100 text-gray-600',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-blue-50 text-blue-700',
      MEDIUM: 'bg-yellow-50 text-yellow-700',
      HIGH: 'bg-orange-50 text-orange-700',
      CRITICAL: 'bg-red-50 text-red-700',
    };
    return colors[priority] || 'bg-gray-50 text-gray-700';
  };

  const totalSelectedSize = useMemo(() => {
    return ticketAttachments
      .filter(a => selectedAttachmentIds.has(a.id))
      .reduce((sum, a) => sum + a.size, 0);
  }, [ticketAttachments, selectedAttachmentIds]);

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left p-3 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('ticketNumber')}>
              Ticket # {sortColumn === 'ticketNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="text-left p-3 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('title')}>
              Title {sortColumn === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="text-left p-3 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
              Status {sortColumn === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="text-left p-3 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('priority')}>
              Priority {sortColumn === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="text-left p-3 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('category')}>
              Category {sortColumn === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="text-left p-3 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('createdAt')}>
              Created {sortColumn === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
          </tr>
        </thead>
        <tbody>
          {eligibleTickets.map(ticket => (
            <tr
              key={ticket.id}
              onClick={() => handleTicketSelect(ticket)}
              className={`border-b border-gray-100 cursor-pointer transition-colors ${
                selectedTicket?.id === ticket.id
                  ? 'bg-blue-50 border-blue-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              <td className="p-3">
                <div className="flex items-center space-x-2">
                  {selectedTicket?.id === ticket.id && (
                    <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span className="font-mono text-xs font-semibold text-blue-600">{ticket.ticketNumber}</span>
                </div>
              </td>
              <td className="p-3 text-sm text-gray-900 max-w-xs truncate">{ticket.title}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
              </td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </td>
              <td className="p-3 text-sm text-gray-700">{ticket.category}</td>
              <td className="p-3 text-xs text-gray-600">{new Date(ticket.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderListView = () => (
    <div className="grid grid-cols-1 gap-4">
      {eligibleTickets.map(ticket => (
        <div
          key={ticket.id}
          onClick={() => handleTicketSelect(ticket)}
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedTicket?.id === ticket.id
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="font-mono text-sm font-bold text-blue-600">
                  {ticket.ticketNumber}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{ticket.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{ticket.description}</p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  <span className="font-medium text-gray-700">Category:</span>
                  <span className="ml-1">{ticket.category}</span>
                </span>
                <span className="flex items-center">
                  <span className="font-medium text-gray-700">Department:</span>
                  <span className="ml-1">{ticket.department}</span>
                </span>
                <span className="flex items-center">
                  <span className="font-medium text-gray-700">Created:</span>
                  <span className="ml-1">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </span>
              </div>
            </div>
            {selectedTicket?.id === ticket.id && (
              <div className="ml-4 flex-shrink-0">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {eligibleTickets.map(ticket => (
        <div
          key={ticket.id}
          onClick={() => handleTicketSelect(ticket)}
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedTicket?.id === ticket.id
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <span className="font-mono text-xs font-bold text-blue-600">
              {ticket.ticketNumber}
            </span>
            {selectedTicket?.id === ticket.id && (
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                <ChevronRight className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">{ticket.title}</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
              {ticket.status}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority}
            </span>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Category:</span>
              <span className="font-medium text-gray-700">{ticket.category}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="font-medium text-gray-700">{new Date(ticket.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAttachmentSelection = () => (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Attachments to Copy</h3>
          <p className="text-sm text-gray-600">
            Choose which files from the original ticket you want to copy to the new ticket.
          </p>
        </div>

        {loadingAttachments ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading attachments...</p>
          </div>
        ) : ticketAttachments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No attachments found</p>
            <p className="text-gray-400 text-sm mt-2">This ticket doesn't have any attachments to copy</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <button
                  onClick={toggleAllAttachments}
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selectedAttachmentIds.size === ticketAttachments.length ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  <span>
                    {selectedAttachmentIds.size === ticketAttachments.length ? 'Deselect All' : 'Select All'}
                  </span>
                </button>
                <span className="text-sm text-gray-600">
                  {selectedAttachmentIds.size} of {ticketAttachments.length} selected
                </span>
              </div>
              <span className="text-sm text-gray-600">
                Total: {FileService.formatFileSize(totalSelectedSize)}
              </span>
            </div>

            <div className="space-y-3">
              {ticketAttachments.map(attachment => {
                const isSelected = selectedAttachmentIds.has(attachment.id);
                return (
                  <div
                    key={attachment.id}
                    onClick={() => toggleAttachment(attachment.id)}
                    className={`flex items-center space-x-4 p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-shrink-0 text-2xl">
                      {FileService.getFileIcon(attachment.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                      <p className="text-xs text-gray-500">
                        {FileService.formatFileSize(attachment.size)} • Uploaded {attachment.uploadedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (showAttachmentSelection) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center space-x-2">
                  <Paperclip className="w-6 h-6" />
                  <span>Copy Attachments</span>
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  From: {selectedTicket?.ticketNumber} - {selectedTicket?.title}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-indigo-700 rounded p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {renderAttachmentSelection()}

          <div className="flex-shrink-0 bg-gray-50 p-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setShowAttachmentSelection(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            >
              Back to Ticket Selection
            </button>
            <button
              onClick={handleFinalCopy}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Copy className="w-4 h-4" />
              <span>
                Copy Ticket {selectedAttachmentIds.size > 0 && `& ${selectedAttachmentIds.size} File${selectedAttachmentIds.size !== 1 ? 's' : ''}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center space-x-2">
                <Copy className="w-6 h-6" />
                <span>Copy from Existing Ticket</span>
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                Select a ticket to copy its details and attachments into a new ticket
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-indigo-700 rounded p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by ticket number, title, or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as TicketStatus | '')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="CREATED">Created</option>
                <option value="APPROVED">Approved</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CLOSED">Closed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Found {eligibleTickets.length} ticket{eligibleTickets.length !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewType('table')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  viewType === 'table'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TableIcon className="w-4 h-4" />
                <span>Table</span>
              </button>
              <button
                onClick={() => setViewType('list')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  viewType === 'list'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                <span>List</span>
              </button>
              <button
                onClick={() => setViewType('card')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  viewType === 'card'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>Card</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {eligibleTickets.length === 0 ? (
            <div className="text-center py-12">
              <Copy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No tickets found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm || statusFilter
                  ? 'Try adjusting your search or filters'
                  : 'Create your first ticket to get started'}
              </p>
            </div>
          ) : (
            <>
              {viewType === 'table' && renderTableView()}
              {viewType === 'list' && renderListView()}
              {viewType === 'card' && renderCardView()}
            </>
          )}
        </div>

        {selectedTicket && (
          <div className="flex-shrink-0 bg-blue-50 border-t border-blue-200 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <p className="text-gray-700">
                  <span className="font-semibold">Selected:</span> {selectedTicket.ticketNumber} - {selectedTicket.title}
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  Fields to be copied: Title, Description, Priority, Category, Department, Property details, Attachments (selectable)
                </p>
              </div>
              <button
                onClick={handleContinueToAttachments}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Copy className="w-4 h-4" />
                <span>Continue</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex-shrink-0 bg-gray-50 p-4 border-t border-gray-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CopyTicketModal;
