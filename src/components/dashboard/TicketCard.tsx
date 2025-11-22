import React, { useMemo } from 'react';
import { Calendar, User, AlertTriangle, Clock, CheckCircle, XCircle, FileText, Users, Edit, Check, X, RotateCcw, Eye, Play, IndianRupee } from 'lucide-react';
import { Ticket, User as UserType, ActionIconDefinition } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { getHierarchyLevel } from '../../lib/hierarchyColors';
import IconDisplayWrapper from '../iconDisplay/IconDisplayWrapper';

interface TicketCardProps {
  ticket: Ticket;
  createdByUser?: UserType;
  assignedToUser?: UserType;
  onClick: () => void;
  onExpand?: (ticket: Ticket) => void;
  onModify?: (ticket: Ticket) => void;
  onApprove?: (ticket: Ticket) => void;
  onClose?: (ticket: Ticket) => void;
  onCancel?: (ticket: Ticket) => void;
  onReopen?: (ticket: Ticket) => void;
  onReinstate?: (ticket: Ticket) => void;
  onMarkInProgress?: (ticket: Ticket) => void;
  onSendToFinance?: (ticket: Ticket) => void;
  onView?: (ticket: Ticket) => void;
  isExpanded?: boolean;
  viewMode?: 'grid' | 'list' | 'compact';
}

const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  createdByUser,
  assignedToUser,
  onClick,
  onExpand,
  onModify,
  onApprove,
  onClose,
  onCancel,
  onReopen,
  onReinstate,
  onMarkInProgress,
  onSendToFinance,
  onView,
  isExpanded = false,
  viewMode = 'grid'
}) => {
  const { user, displayPreferences } = useAuth();
  const { changeTicketStatus } = useTickets();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <FileText className="w-4 h-4" />;
      case 'CREATED': return <Clock className="w-4 h-4" />;
      case 'ACTIVE': return <Users className="w-4 h-4" />;
      case 'SENT_TO_FINANCE': return <IndianRupee className="w-4 h-4" />;
      case 'APPROVED_BY_FINANCE': return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED_BY_FINANCE': return <XCircle className="w-4 h-4" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'CREATED': return 'bg-sky-100 text-sky-700 border-sky-300';
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'ACTIVE': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'SENT_TO_FINANCE': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'APPROVED_BY_FINANCE': return 'bg-green-100 text-green-700 border-green-300';
      case 'REJECTED_BY_FINANCE': return 'bg-red-100 text-red-700 border-red-300';
      case 'COMPLETED': return 'bg-green-700 text-white border-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'CANCELLED': return 'bg-rose-100 text-rose-700 border-rose-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-rose-700 bg-rose-50 border-rose-400';
      case 'HIGH': return 'text-orange-700 bg-orange-50 border-orange-400';
      case 'MEDIUM': return 'text-yellow-700 bg-yellow-50 border-yellow-400';
      case 'LOW': return 'text-emerald-700 bg-emerald-50 border-emerald-400';
      default: return 'text-slate-700 bg-slate-50 border-slate-400';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
      case 'HIGH':
        return <AlertTriangle className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  const getTicketAccentColor = (status: string, priority: string) => {
    if (priority === 'CRITICAL') {
      return {
        gradient: 'from-rose-300 to-pink-300',
        bg: 'bg-rose-50',
        shadow: 'shadow-rose-200/50'
      };
    }
    if (priority === 'HIGH') {
      return {
        gradient: 'from-orange-300 to-amber-300',
        bg: 'bg-orange-50',
        shadow: 'shadow-orange-200/50'
      };
    }

    const statusColors = {
      'DRAFT': { gradient: 'from-slate-300 to-gray-300', bg: 'bg-slate-50', shadow: 'shadow-slate-200/50' },
      'CREATED': { gradient: 'from-sky-300 to-blue-300', bg: 'bg-sky-50', shadow: 'shadow-sky-200/50' },
      'APPROVED': { gradient: 'from-emerald-300 to-teal-300', bg: 'bg-emerald-50', shadow: 'shadow-emerald-200/50' },
      'ACTIVE': { gradient: 'from-amber-300 to-yellow-300', bg: 'bg-amber-50', shadow: 'shadow-amber-200/50' },
      'SENT_TO_FINANCE': { gradient: 'from-yellow-300 to-amber-300', bg: 'bg-yellow-50', shadow: 'shadow-yellow-200/50' },
      'APPROVED_BY_FINANCE': { gradient: 'from-green-300 to-emerald-300', bg: 'bg-green-50', shadow: 'shadow-green-200/50' },
      'REJECTED_BY_FINANCE': { gradient: 'from-red-300 to-rose-300', bg: 'bg-red-50', shadow: 'shadow-red-200/50' },
      'COMPLETED': { gradient: 'from-green-600 to-green-700', bg: 'bg-green-100', shadow: 'shadow-green-300/50' },
      'CLOSED': { gradient: 'from-gray-300 to-slate-300', bg: 'bg-gray-50', shadow: 'shadow-gray-200/50' },
      'CANCELLED': { gradient: 'from-rose-300 to-pink-300', bg: 'bg-rose-50', shadow: 'shadow-rose-200/50' }
    };

    return statusColors[status] || statusColors['DRAFT'];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const isOverdue = ticket.dueDate && new Date() > ticket.dueDate && ticket.status !== 'COMPLETED' && ticket.status !== 'CANCELLED';
  const completedWorkflows = ticket.workflow.filter(step => step.status === 'COMPLETED').length;
  const totalWorkflows = ticket.workflow.length;

  const myAssignedTasks = user?.role === 'DO'
    ? ticket.workflow.filter(step => step.assignedTo === user.id).length
    : 0;
  const hasMyAssignedTasks = myAssignedTasks > 0;

  const canModify = () => {
    if (!user) return false;
    if (user.role === 'EMPLOYEE') {
      return ticket.status === 'DRAFT' && ticket.createdBy === user.id;
    }
    if (user.role === 'EO') return ['DRAFT', 'CREATED'].includes(ticket.status);
    if (user.role === 'DO') {
      return ['DRAFT', 'CREATED'].includes(ticket.status) && ticket.department === user.department;
    }
    return false;
  };

  const canApprove = () => {
    if (!user) return false;
    if (user.role === 'EO') return ticket.status === 'CREATED';
    if (user.role === 'DO') {
      return ticket.status === 'CREATED' && ticket.department === user.department;
    }
    return false;
  };

  const canCloseOrCancel = () => {
    if (!user) return false;
    if (user.role === 'EO') return ticket.status === 'ACTIVE';
    if (user.role === 'DO') {
      return ticket.status === 'ACTIVE' && ticket.department === user.department;
    }
    return false;
  };

  const canReopen = () => {
    if (!user) return false;
    if (user.role === 'EO') return ticket.status === 'CLOSED';
    if (user.role === 'DO') {
      return ticket.status === 'CLOSED' && ticket.department === user.department;
    }
    return false;
  };

  const canReinstate = () => {
    if (!user) return false;
    if (user.role === 'EO') return ticket.status === 'CANCELLED';
    if (user.role === 'DO') {
      return ticket.status === 'CANCELLED' && ticket.department === user.department;
    }
    return false;
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

  const ticketActions: ActionIconDefinition[] = useMemo(() => {
    const actions: ActionIconDefinition[] = [];

    if (canModify()) {
      actions.push({
        id: 'modify',
        icon: Edit,
        label: 'Modify',
        action: () => {
          onModify?.(ticket);
        },
        category: 'edit',
        color: 'text-blue-600'
      });
    }

    if (canMarkInProgress()) {
      actions.push({
        id: 'markInProgress',
        icon: Play,
        label: 'Mark In Progress',
        action: () => {
          onMarkInProgress?.(ticket);
        },
        category: 'status',
        color: 'text-orange-600'
      });
    }

    if (canApprove()) {
      actions.push({
        id: 'approve',
        icon: Check,
        label: 'Approve',
        action: () => {
          onApprove?.(ticket);
        },
        category: 'status',
        color: 'text-green-600'
      });
    }

    if (canCloseOrCancel()) {
      actions.push({
        id: 'close',
        icon: CheckCircle,
        label: 'Close',
        action: () => {
          onClose?.(ticket);
        },
        category: 'status',
        color: 'text-gray-600'
      });
      actions.push({
        id: 'cancel',
        icon: X,
        label: 'Cancel',
        action: () => {
          onCancel?.(ticket);
        },
        category: 'status',
        color: 'text-red-600'
      });
    }

    if (canReopen()) {
      actions.push({
        id: 'reopen',
        icon: RotateCcw,
        label: 'Reopen',
        action: () => {
          onReopen?.(ticket);
        },
        category: 'status',
        color: 'text-blue-600'
      });
    }

    if (canReinstate()) {
      actions.push({
        id: 'reinstate',
        icon: RotateCcw,
        label: 'Reinstate',
        action: () => {
          onReinstate?.(ticket);
        },
        category: 'status',
        color: 'text-orange-600'
      });
    }

    if (canSendToFinance()) {
      actions.push({
        id: 'sendToFinance',
        icon: IndianRupee,
        label: 'Send to Finance',
        action: () => {
          onSendToFinance?.(ticket);
        },
        category: 'status',
        color: 'text-green-600',
        tooltip: 'Submit to Finance Department for cost approval'
      });
    }

    actions.push({
      id: 'view',
      icon: Eye,
      label: 'View Details',
      action: () => {
        onView?.(ticket);
      },
      category: 'view',
      color: 'text-slate-600'
    });

    return actions;
  }, [ticket, user, canModify, canApprove, canCloseOrCancel, canReopen, canReinstate, canMarkInProgress]);

  const accentColor = getTicketAccentColor(ticket.status, ticket.priority);

  return (
    <>
      <div
        className={`relative bg-white rounded-lg overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl cursor-pointer ${accentColor.shadow} ${
          isOverdue ? 'ring-2 ring-rose-500' : ''
        }`}
        onClick={onClick}
      >
        {/* Left Notch */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-12 bg-gray-100 rounded-r-full z-0" />

        {/* Colored Accent Bar on Left */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${accentColor.gradient}`} />

        {/* Right Stub Separator with Dashed Line */}
        <div className="absolute right-20 top-0 bottom-0 w-px border-l-2 border-dashed border-gray-300" />

        {/* Main Content Area */}
        <div className="relative pl-6 pr-24 py-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md border ${getStatusColor(ticket.status)}`}>
                  {getStatusIcon(ticket.status)}
                  <span>{ticket.status}</span>
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border ${getPriorityColor(ticket.priority)}`}>
                  {getPriorityIcon(ticket.priority)}
                  <span>{ticket.priority}</span>
                </span>
                {isOverdue && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md bg-rose-500 text-white shadow-lg">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>OVERDUE</span>
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-2 leading-snug">
                {ticket.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                {ticket.description}
              </p>
            </div>
          </div>

          {/* Progress Bar - Hidden for employees */}
          {user && user.role !== 'EMPLOYEE' && totalWorkflows > 0 && (
            <div className="mb-4">
              <div className="flex justify-between items-center text-xs text-gray-600 mb-1.5">
                <span className="font-medium">Workflow Progress</span>
                <span className="font-semibold">
                  {completedWorkflows}/{totalWorkflows}
                  {user?.role === 'DO' && hasMyAssignedTasks && (
                    <span className="ml-1 text-blue-600">({myAssignedTasks} assigned)</span>
                  )}
                </span>
              </div>
              <div className="relative w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 bg-gradient-to-r ${accentColor.gradient}`}
                  style={{ width: totalWorkflows > 0 ? `${(completedWorkflows / totalWorkflows) * 100}%` : '0%' }}
                />
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span className="font-medium truncate max-w-24" title={createdByUser?.name}>
                  {createdByUser?.name?.split(' ')[0] || 'Unknown'}
                </span>
              </div>
              {assignedToUser && (
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span className="font-medium truncate max-w-24" title={assignedToUser.name}>
                    {assignedToUser.name.split(' ')[0]}
                  </span>
                </div>
              )}
            </div>
            <div className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-rose-600' : ''}`}>
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {ticket.dueDate ?
                  formatDate(ticket.dueDate) :
                  formatDate(ticket.createdAt)
                }
              </span>
            </div>
          </div>

        </div>

        {/* Right Stub Area */}
        <div className="absolute right-0 top-0 bottom-0 w-20 flex flex-col items-center justify-between py-5 bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Ticket Number */}
          <div className="flex-1 flex items-center justify-center">
            <div className="transform -rotate-90 whitespace-nowrap">
              <span className="text-[10px] font-bold text-gray-600 tracking-wider uppercase">
                {ticket.ticketNumber}
              </span>
            </div>
          </div>

          {/* Action Icons */}
          <div onClick={(e) => e.stopPropagation()}>
            <IconDisplayWrapper
              actions={ticketActions}
              preferences={displayPreferences ?? undefined}
              loading={!displayPreferences && !!user}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default TicketCard;
