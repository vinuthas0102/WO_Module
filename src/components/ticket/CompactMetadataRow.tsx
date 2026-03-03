import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, Users, Calendar, TrendingUp } from 'lucide-react';

interface MetadataSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  defaultExpanded?: boolean;
  alwaysVisible?: boolean;
}

interface CompactMetadataRowProps {
  sections: MetadataSection[];
  className?: string;
}

export const CompactMetadataRow: React.FC<CompactMetadataRowProps> = ({ sections, className = '' }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.filter(s => s.defaultExpanded).map(s => s.id))
  );

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const visibleSections = sections.filter(s => s.alwaysVisible);
  const collapsibleSections = sections.filter(s => !s.alwaysVisible);

  return (
    <div className={`space-y-2 ${className}`}>
      {visibleSections.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
          {visibleSections.map((section) => (
            <div key={section.id} className="flex items-center space-x-2">
              <span className="text-gray-500">{section.icon}</span>
              <div className="text-xs">{section.content}</div>
            </div>
          ))}
        </div>
      )}

      {collapsibleSections.length > 0 && (
        <div className="space-y-1">
          {collapsibleSections.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            return (
              <div key={section.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-gray-500" />
                    )}
                    <span className="text-gray-500">{section.icon}</span>
                    <span className="text-xs font-medium text-gray-700">{section.label}</span>
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-3 py-2 bg-white border-t border-gray-200 animate-accordion-down">
                    {section.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const CompactTimelineRow: React.FC<{
  startDate?: string | null;
  dueDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdByName?: string;
}> = ({ startDate, dueDate, createdAt, updatedAt, createdByName }) => {
  const formatCompactDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
      {startDate && (
        <span className="flex items-center space-x-1">
          <Calendar className="w-3 h-3" />
          <span className="font-medium">Start:</span>
          <span>{formatCompactDate(startDate)}</span>
        </span>
      )}
      {dueDate && (
        <span className="flex items-center space-x-1">
          <Calendar className="w-3 h-3" />
          <span className="font-medium">Due:</span>
          <span>{formatCompactDate(dueDate)}</span>
        </span>
      )}
      {createdAt && (
        <span className="flex items-center space-x-1 text-gray-500">
          <Clock className="w-3 h-3" />
          <span>Created {formatDateTime(createdAt)}</span>
          {createdByName && <span>by {createdByName}</span>}
        </span>
      )}
      {updatedAt && (
        <span className="flex items-center space-x-1 text-gray-500">
          <Clock className="w-3 h-3" />
          <span>Updated {formatDateTime(updatedAt)}</span>
        </span>
      )}
    </div>
  );
};

export const CompactProgressBar: React.FC<{
  progress: number;
  isAutoCalculated?: boolean;
  className?: string;
}> = ({ progress, isAutoCalculated, className = '' }) => {
  const progressValue = progress || 0;
  const colorClass = progressValue === 0 ? 'bg-gray-400' :
                     progressValue < 50 ? 'bg-yellow-500' :
                     progressValue < 100 ? 'bg-blue-500' : 'bg-green-500';

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {isAutoCalculated && (
        <span className="text-blue-600" title="Auto-calculated from spec allocations">
          <TrendingUp className="w-3 h-3" />
        </span>
      )}
      <div className="w-20 bg-gray-200 rounded-full h-1.5">
        <div
          className={`${colorClass} h-1.5 rounded-full transition-all duration-300`}
          style={{ width: `${progressValue}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-10 text-right">
        {progressValue}%
      </span>
    </div>
  );
};
