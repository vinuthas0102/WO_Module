import React from 'react';
import { FileText, Clock, Play, CheckCircle, XCircle } from 'lucide-react';
import { TicketStatus } from '../../types';
import { useTickets } from '../../context/TicketContext';

interface StatusCardsProps {
  onStatusFilter: (status: TicketStatus | null) => void;
  activeFilter: TicketStatus | null;
}

const StatusCards: React.FC<StatusCardsProps> = ({ onStatusFilter, activeFilter }) => {
  const { tickets } = useTickets();

  const statusConfig = [
    { 
      status: 'DRAFT' as TicketStatus, 
      label: 'Draft', 
      icon: FileText,
      color: 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 border-gray-300',
      hoverColor: 'hover:from-gray-200 hover:to-gray-300 hover:shadow-lg'
    },
    { 
      status: 'CREATED' as TicketStatus, 
      label: 'Created', 
      icon: Clock,
      color: 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-800 border-blue-300',
      hoverColor: 'hover:from-blue-200 hover:to-blue-300 hover:shadow-lg'
    },
    { 
      status: 'APPROVED' as TicketStatus, 
      label: 'Approved', 
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-800 border-purple-300',
      hoverColor: 'hover:from-purple-200 hover:to-purple-300 hover:shadow-lg'
    },
    { 
      status: 'ACTIVE' as TicketStatus, 
      label: 'Active', 
      icon: Play,
      color: 'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-800 border-orange-300',
      hoverColor: 'hover:from-orange-200 hover:to-orange-300 hover:shadow-lg'
    },
    { 
      status: 'COMPLETED' as TicketStatus, 
      label: 'Completed', 
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-green-100 to-green-200 text-green-800 border-green-300',
      hoverColor: 'hover:from-green-200 hover:to-green-300 hover:shadow-lg'
    },
    { 
      status: 'CLOSED' as TicketStatus, 
      label: 'Closed', 
      icon: XCircle,
      color: 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 border-gray-300',
      hoverColor: 'hover:from-gray-200 hover:to-gray-300 hover:shadow-lg'
    },
    { 
      status: 'CANCELLED' as TicketStatus, 
      label: 'Cancelled', 
      icon: XCircle,
      color: 'bg-gradient-to-br from-red-100 to-red-200 text-red-800 border-red-300',
      hoverColor: 'hover:from-red-200 hover:to-red-300 hover:shadow-lg'
    }
  ];

  const getStatusCount = (status: TicketStatus) => {
    return tickets.filter(ticket => ticket.status === status).length;
  };

  return (
    <div className="grid grid-cols-4 md:grid-cols-7 gap-1 mb-2">
      {statusConfig.map((config) => {
        const count = getStatusCount(config.status);
        const isActive = activeFilter === config.status;
        const IconComponent = config.icon;
        
        return (
          <div
            key={config.status}
            onClick={() => onStatusFilter(isActive ? null : config.status)}
            className={`
              cursor-pointer border rounded-md p-1 transition-all duration-200 transform hover:scale-105
              ${config.color} ${config.hoverColor}
              ${isActive ? 'ring-1 ring-blue-400 ring-opacity-50 shadow-md scale-105' : 'shadow-sm hover:shadow-md'}
              min-h-[40px] flex items-center justify-center space-x-1
            `}
          >
            <div className="flex items-center space-x-1">
              <IconComponent className="w-3 h-3 opacity-70" />
              <div className="text-sm font-bold">{count}</div>
              <div className="text-xs font-medium truncate">{config.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatusCards;