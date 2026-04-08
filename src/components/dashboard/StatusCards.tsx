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
      glassColor: 'bg-gray-500/20 border-gray-400/30 text-gray-800',
      hoverGlass: 'hover:bg-gray-500/30 hover:border-gray-400/50'
    },
    {
      status: 'CREATED' as TicketStatus,
      label: 'Created',
      icon: Clock,
      glassColor: 'bg-blue-500/20 border-blue-400/30 text-blue-800',
      hoverGlass: 'hover:bg-blue-500/30 hover:border-blue-400/50'
    },
    {
      status: 'APPROVED' as TicketStatus,
      label: 'Approved',
      icon: CheckCircle,
      glassColor: 'bg-teal-500/20 border-teal-400/30 text-teal-800',
      hoverGlass: 'hover:bg-teal-500/30 hover:border-teal-400/50'
    },
    {
      status: 'ACTIVE' as TicketStatus,
      label: 'Active',
      icon: Play,
      glassColor: 'bg-orange-500/20 border-orange-400/30 text-orange-800',
      hoverGlass: 'hover:bg-orange-500/30 hover:border-orange-400/50'
    },
    {
      status: 'COMPLETED' as TicketStatus,
      label: 'Completed',
      icon: CheckCircle,
      glassColor: 'bg-green-500/20 border-green-400/30 text-green-800',
      hoverGlass: 'hover:bg-green-500/30 hover:border-green-400/50'
    },
    {
      status: 'CLOSED' as TicketStatus,
      label: 'Closed',
      icon: XCircle,
      glassColor: 'bg-slate-500/20 border-slate-400/30 text-slate-800',
      hoverGlass: 'hover:bg-slate-500/30 hover:border-slate-400/50'
    },
    {
      status: 'CANCELLED' as TicketStatus,
      label: 'Cancelled',
      icon: XCircle,
      glassColor: 'bg-red-500/20 border-red-400/30 text-red-800',
      hoverGlass: 'hover:bg-red-500/30 hover:border-red-400/50'
    }
  ];

  const getStatusCount = (status: TicketStatus) => {
    return tickets.filter(ticket => ticket.status === status).length;
  };

  const activeStatusLabel = activeFilter
    ? statusConfig.find(c => c.status === activeFilter)?.label
    : null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-5 mb-4 border border-gray-200">
      {activeStatusLabel && (
        <div className="mb-3 text-sm font-medium text-gray-700 flex items-center space-x-2">
          <span className="text-gray-500">Showing:</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
            {activeStatusLabel}
          </span>
        </div>
      )}

      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory scroll-smooth">
          {statusConfig.map((config) => {
            const count = getStatusCount(config.status);
            const isActive = activeFilter === config.status;
            const IconComponent = config.icon;

            return (
              <div
                key={config.status}
                onClick={() => onStatusFilter(isActive ? null : config.status)}
                className={`
                  cursor-pointer border rounded-xl p-4 transition-all duration-300 transform
                  backdrop-blur-md snap-center flex-shrink-0
                  ${config.glassColor} ${config.hoverGlass}
                  ${isActive
                    ? 'ring-2 ring-blue-500 ring-opacity-60 shadow-xl scale-110 z-10'
                    : 'shadow-md hover:shadow-lg hover:scale-105'}
                  min-w-[140px] flex flex-col items-center justify-center space-y-2
                `}
                style={{
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                }}
              >
                <IconComponent className={`w-6 h-6 ${isActive ? 'opacity-90' : 'opacity-70'}`} />
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm font-semibold text-center">{config.label}</div>
              </div>
            );
          })}
        </div>

        <div className="absolute top-0 right-0 h-full w-16 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-white to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

export default StatusCards;