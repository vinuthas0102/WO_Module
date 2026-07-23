import React, { useRef, useState, useEffect } from 'react';
import { FileText, Clock, Play, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { TicketStatus } from '../../types';
import { useTickets } from '../../context/TicketContext';

interface StatusCardsProps {
  onStatusFilter: (status: TicketStatus | null) => void;
  activeFilter: TicketStatus | null;
}

const StatusCards: React.FC<StatusCardsProps> = ({ onStatusFilter, activeFilter }) => {
  const { tickets } = useTickets();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const statusConfig = [
    {
      status: 'DRAFT' as TicketStatus,
      label: 'Draft',
      icon: FileText,
      glassColor: 'bg-gray-500/20 border-gray-400/30 text-gray-800',
      hoverGlass: 'hover:bg-gray-500/30 hover:border-gray-400/50',
      selectedColor: 'bg-gray-600 border-gray-700 text-white shadow-gray-400/50'
    },
    {
      status: 'CREATED' as TicketStatus,
      label: 'Created',
      icon: Clock,
      glassColor: 'bg-blue-500/20 border-blue-400/30 text-blue-800',
      hoverGlass: 'hover:bg-blue-500/30 hover:border-blue-400/50',
      selectedColor: 'bg-blue-600 border-blue-700 text-white shadow-blue-400/50'
    },
    {
      status: 'APPROVED' as TicketStatus,
      label: 'Approved',
      icon: CheckCircle,
      glassColor: 'bg-teal-500/20 border-teal-400/30 text-teal-800',
      hoverGlass: 'hover:bg-teal-500/30 hover:border-teal-400/50',
      selectedColor: 'bg-teal-600 border-teal-700 text-white shadow-teal-400/50'
    },
    {
      status: 'ACTIVE' as TicketStatus,
      label: 'Active',
      icon: Play,
      glassColor: 'bg-orange-500/20 border-orange-400/30 text-orange-800',
      hoverGlass: 'hover:bg-orange-500/30 hover:border-orange-400/50',
      selectedColor: 'bg-orange-600 border-orange-700 text-white shadow-orange-400/50'
    },
    {
      status: 'COMPLETED' as TicketStatus,
      label: 'Completed',
      icon: CheckCircle,
      glassColor: 'bg-green-500/20 border-green-400/30 text-green-800',
      hoverGlass: 'hover:bg-green-500/30 hover:border-green-400/50',
      selectedColor: 'bg-green-600 border-green-700 text-white shadow-green-400/50'
    },
    {
      status: 'CLOSED' as TicketStatus,
      label: 'Closed',
      icon: XCircle,
      glassColor: 'bg-slate-500/20 border-slate-400/30 text-slate-800',
      hoverGlass: 'hover:bg-slate-500/30 hover:border-slate-400/50',
      selectedColor: 'bg-slate-600 border-slate-700 text-white shadow-slate-400/50'
    },
    {
      status: 'CANCELLED' as TicketStatus,
      label: 'Cancelled',
      icon: XCircle,
      glassColor: 'bg-red-500/20 border-red-400/30 text-red-800',
      hoverGlass: 'hover:bg-red-500/30 hover:border-red-400/50',
      selectedColor: 'bg-red-600 border-red-700 text-white shadow-red-400/50'
    }
  ];

  const getStatusCount = (status: TicketStatus) => {
    return tickets.filter(ticket => ticket.status === status).length;
  };

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      window.addEventListener('resize', updateScrollButtons);
      return () => {
        container.removeEventListener('scroll', updateScrollButtons);
        window.removeEventListener('resize', updateScrollButtons);
      };
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 240; // Card width (200px) plus gap (40px)
      const newScrollLeft = direction === 'left'
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-5 mb-2 border border-gray-200">
      <div className="relative flex items-center">
        {/* Left Navigation Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-300 hover:bg-gray-50 hover:shadow-xl transition-all duration-200 hover:scale-110"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
        )}

        {/* Cards Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-hidden scroll-smooth w-full px-12"
        >
          {statusConfig.map((config) => {
            const count = getStatusCount(config.status);
            const isActive = activeFilter === config.status;
            const IconComponent = config.icon;

            return (
              <div
                key={config.status}
                onClick={() => onStatusFilter(isActive ? null : config.status)}
                className={`
                  cursor-pointer border-2 rounded-xl p-3.5 transition-all duration-300 transform
                  flex-shrink-0
                  ${isActive ? config.selectedColor : config.glassColor}
                  ${!isActive && config.hoverGlass}
                  ${isActive
                    ? 'shadow-2xl scale-105 z-10 backdrop-blur-none'
                    : 'shadow-md hover:shadow-lg hover:scale-105 backdrop-blur-md'}
                  w-[200px] min-h-[4rem] flex flex-row items-center justify-start gap-3
                `}
                style={!isActive ? {
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                } : undefined}
              >
                <IconComponent className={`w-5 h-5 flex-shrink-0 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                <div className={`text-lg font-bold flex-shrink-0 ${isActive ? 'text-white' : ''}`}>{count}</div>
                <div className={`text-xs font-semibold whitespace-nowrap ${isActive ? 'text-white' : ''}`}>{config.label}</div>
              </div>
            );
          })}
        </div>

        {/* Right Navigation Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-300 hover:bg-gray-50 hover:shadow-xl transition-all duration-200 hover:scale-110"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        )}
      </div>
    </div>
  );
};

export default StatusCards;