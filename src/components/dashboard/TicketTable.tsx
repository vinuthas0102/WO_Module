import React, { useMemo } from 'react';
import { Calendar, User, AlertTriangle, Users, Edit, Check, X, RotateCcw, Eye, Play, IndianRupee, CheckCircle } from 'lucide-react';
import { Ticket, User as UserType, ActionIconDefinition, Module } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import IconDisplayWrapper from '../iconDisplay/IconDisplayWrapper';

interface TicketTableProps {
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
  onModifyTicket?: (ticket: Ticket) => void;
  onApprove?: (ticket: Ticket) => void;
  onClose?: (ticket: Ticket) => void;
  onCancel?: (ticket: Ticket) => void;
  onReopen?: (ticket: Ticket) => void;
  onReinstate?: (ticket: Ticket) => void;
  onMarkInProgress?: (ticket: Ticket) => void;
  onSendToFinance?: (ticket: Ticket) => void;
  onView?: (ticket: Ticket) => void;
  selectedModule?: Module;
}

const TicketTable: React.FC<TicketTableProps> = ({
  tickets,
  onTicketClick,
  onModifyTicket,
  onApprove,
  onClose,
  onCancel,
  onReopen,
  onReinstate,
  onMarkInProgress,
  onSendToFinance,
  onView,
  selectedModule
}) => {
  const { user, displayPreferences } = useAuth();
  const { users } = useTickets();

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'DRAFT': 'bg-gray-100 text-gray-800 border-gray-300',
      'CREATED': 'bg-blue-100 text-blue-800 border-blue-300',
      'APPROVED': 'bg-green-100 text-green-800 border-green-300',
      'ACTIVE': 'bg-orange-100 text-orange-800 border-orange-300',
      'SENT_TO_FINANCE': 'bg-purple-100 text-purple-800 border-purple-300',
      'APPROVED_BY_FINANCE': 'bg-teal-100 text-teal-800 border-teal-300',
      'REJECTED_BY_FINANCE': 'bg-rose-100 text-rose-800 border-rose-300',
      'COMPLETED': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'CLOSED': 'bg-gray-100 text-gray-800 border-gray-300',
      'CANCELLED': 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'CRITICAL': 'bg-red-100 text-red-800 border-red-300',
      'HIGH': 'bg-orange-100 text-orange-800 border-orange-300',
      'MEDIUM': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'LOW': 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const isOverdue = (ticket: Ticket) => {
    if (!ticket.dueDate || ticket.status === 'COMPLETED' || ticket.status === 'CLOSED' || ticket.status === 'CANCELLED') return false;
    return new Date(ticket.dueDate) < new Date();
  };

  const getTicketActions = (ticket: Ticket): ActionIconDefinition[] => {
    const actions: ActionIconDefinition[] = [];

    const canModify = () => {
      if (!user) return false;
      if (user.role === 'EO') return true;
      if (user.role === 'DO') {
        return ticket.department === user.department && ['CREATED', 'ACTIVE'].includes(ticket.status);
      }
      return false;
    };

    const canApprove = () => {
      if (!user) return false;
      return user.role === 'EO' && ticket.status === 'CREATED';
    };

    const canCloseOrCancel = () => {
      if (!user) return false;
      if (user.role === 'EO') {
        return ['APPROVED', 'ACTIVE', 'COMPLETED'].includes(ticket.status);
      }
      return false;
    };

    const canReopen = () => {
      if (!user) return false;
      return user.role === 'EO' && ticket.status === 'CLOSED';
    };

    const canReinstate = () => {
      if (!user) return false;
      return user.role === 'EO' && ticket.status === 'CANCELLED';
    };

    const canMarkInProgress = () => {
      if (!user) return false;
      if (user.role === 'EO') return ticket.status === 'CREATED';
      if (user.role === 'DO') {
        return ticket.status === 'CREATED' && ticket.department === user.department;
      }
      return false;
    };

    const canSendToFinance = () => {
      if (!user) return false;
      if (user.role !== 'EO' && user.role !== 'DO') return false;
      if (ticket.status !== 'ACTIVE' && ticket.status !== 'REJECTED_BY_FINANCE') return false;
      if (ticket.requiresFinanceApproval === false) return false;
      const completedCount = ticket.workflow.filter(step => step.status === 'COMPLETED').length;
      const allTasksCompleted = ticket.workflow.length === 0 || completedCount === ticket.workflow.length;
      return allTasksCompleted;
    };

    if (canModify()) {
      actions.push({
        id: 'modify',
        icon: Edit,
        label: 'Modify',
        action: () => onModifyTicket?.(ticket),
        category: 'edit',
        color: 'text-blue-600'
      });
    }

    if (canMarkInProgress()) {
      actions.push({
        id: 'markInProgress',
        icon: Play,
        label: 'Mark In Progress',
        action: () => onMarkInProgress?.(ticket),
        category: 'status',
        color: 'text-orange-600'
      });
    }

    if (canApprove()) {
      actions.push({
        id: 'approve',
        icon: Check,
        label: 'Approve',
        action: () => onApprove?.(ticket),
        category: 'status',
        color: 'text-green-600'
      });
    }

    if (canCloseOrCancel()) {
      actions.push({
        id: 'close',
        icon: CheckCircle,
        label: 'Close',
        action: () => onClose?.(ticket),
        category: 'status',
        color: 'text-gray-600'
      });
      actions.push({
        id: 'cancel',
        icon: X,
        label: 'Cancel',
        action: () => onCancel?.(ticket),
        category: 'status',
        color: 'text-red-600'
      });
    }

    if (canReopen()) {
      actions.push({
        id: 'reopen',
        icon: RotateCcw,
        label: 'Reopen',
        action: () => onReopen?.(ticket),
        category: 'status',
        color: 'text-blue-600'
      });
    }

    if (canReinstate()) {
      actions.push({
        id: 'reinstate',
        icon: RotateCcw,
        label: 'Reinstate',
        action: () => onReinstate?.(ticket),
        category: 'status',
        color: 'text-orange-600'
      });
    }

    if (canSendToFinance()) {
      actions.push({
        id: 'sendToFinance',
        icon: IndianRupee,
        label: 'Send to Finance',
        action: () => onSendToFinance?.(ticket),
        category: 'status',
        color: 'text-green-600',
        tooltip: 'Submit to Finance Department for cost approval'
      });
    }

    actions.push({
      id: 'view',
      icon: Eye,
      label: 'View Details',
      action: () => onView?.(ticket),
      category: 'view',
      color: 'text-slate-600'
    });

    return actions;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                Ticket #
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[250px]">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                Assigned To
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                Created By
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                Due Date
              </th>
              {user && user.role !== 'EMPLOYEE' && (
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap min-w-[150px]">
                  Progress
                </th>
              )}
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tickets.map((ticket, index) => {
              const createdByUser = users.find(u => u.id === ticket.createdBy);
              const assignedToUser = ticket.assignedTo ? users.find(u => u.id === ticket.assignedTo) : undefined;
              const totalWorkflows = ticket.workflow.length;
              const completedWorkflows = ticket.workflow.filter(step => step.status === 'COMPLETED').length;
              const progressPercent = totalWorkflows > 0 ? (completedWorkflows / totalWorkflows) * 100 : 0;
              const overdue = isOverdue(ticket);
              const actions = getTicketActions(ticket);

              return (
                <tr
                  key={ticket.id}
                  className={`transition-colors duration-150 hover:bg-blue-50 cursor-pointer ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } ${overdue ? 'bg-rose-50 hover:bg-rose-100' : ''}`}
                  onClick={() => onTicketClick(ticket)}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs font-semibold text-gray-900">{ticket.ticketNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-gray-900 line-clamp-1" title={ticket.title}>
                        {ticket.title}
                      </span>
                      <span className="text-xs text-gray-600 line-clamp-1" title={ticket.description}>
                        {ticket.description}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md border ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md border ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs text-gray-700">
                      <Users className="w-3.5 h-3.5 text-gray-500" />
                      <span className="font-medium truncate max-w-[120px]" title={assignedToUser?.name}>
                        {assignedToUser?.name?.split(' ')[0] || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs text-gray-700">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      <span className="font-medium truncate max-w-[120px]" title={createdByUser?.name}>
                        {createdByUser?.name?.split(' ')[0] || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className={`flex items-center gap-1.5 text-xs ${overdue ? 'text-rose-600 font-bold' : 'text-gray-700'}`}>
                      {overdue && <AlertTriangle className="w-3.5 h-3.5" />}
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="font-medium">
                        {formatDate(ticket.dueDate || ticket.createdAt)}
                      </span>
                    </div>
                  </td>
                  {user && user.role !== 'EMPLOYEE' && (
                    <td className="px-4 py-3">
                      {totalWorkflows > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                            {completedWorkflows}/{totalWorkflows}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center">
                      <IconDisplayWrapper
                        actions={actions}
                        preferences={displayPreferences ?? undefined}
                        loading={!displayPreferences && !!user}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {tickets.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No tickets found</p>
        </div>
      )}
    </div>
  );
};

export default TicketTable;
