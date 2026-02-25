import React, { useState, useEffect } from 'react';
import { Save, Clock, FileText, Loader2, Search } from 'lucide-react';
import { TicketUserNote } from '../../types';
import { TicketNotesService } from '../../services/ticketNotesService';
import { useAuth } from '../../context/AuthContext';
import { CollapsibleFilterPanel } from '../common/CollapsibleFilterPanel';
import { TopRightControls } from '../common/TopRightControls';

interface MyNotesTabProps {
  ticketId: string;
}

export const MyNotesTab: React.FC<MyNotesTabProps> = ({ ticketId }) => {
  const { user } = useAuth();
  const [noteContent, setNoteContent] = useState('');
  const [savedNote, setSavedNote] = useState<TicketUserNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserNote();
    }
  }, [ticketId, user]);

  const loadUserNote = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const note = await TicketNotesService.getUserNoteForTicket(ticketId, user.id);
      if (note) {
        setSavedNote(note);
        setNoteContent(note.noteContent);
        setLastSaved(note.updatedAt);
      } else {
        setSavedNote(null);
        setNoteContent('');
        setLastSaved(null);
      }
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error loading note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const note = await TicketNotesService.saveUserNote(
        ticketId,
        user.id,
        noteContent
      );
      setSavedNote(note);
      setLastSaved(note.updatedAt);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleNoteChange = (value: string) => {
    setNoteContent(value);
    setHasUnsavedChanges(value !== (savedNote?.noteContent || ''));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  const activeFilterCount = searchQuery ? 1 : 0;

  const clearAllFilters = () => {
    setSearchQuery('');
  };

  const highlightedContent = () => {
    if (!searchQuery || !savedNote?.noteContent) {
      return savedNote?.noteContent || 'No content';
    }

    const content = savedNote.noteContent;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = content.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-gray-900">{part}</mark>
      ) : (
        part
      )
    );
  };

  const matchesSearch = !searchQuery ||
    (savedNote?.noteContent && savedNote.noteContent.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-gray-500">Loading your notes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 relative">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-900">Private Notes</p>
            <p className="text-xs text-blue-700 mt-0.5">
              These notes are visible only to you. Use this space to keep track of important information about this ticket.
            </p>
          </div>
        </div>
      </div>

      {savedNote && (
        <TopRightControls className="top-3">
          <CollapsibleFilterPanel
            isOpen={isFilterPanelOpen}
            onToggle={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            onClear={clearAllFilters}
            activeFilterCount={activeFilterCount}
            position="right"
            direction="down"
            panelClassName="w-[500px]"
          >
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search within your notes..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {searchQuery && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-600 font-medium">
                    <span>{matchesSearch ? 'Match found in your note' : 'No matches found'}</span>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleFilterPanel>
        </TopRightControls>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">Edit Note</h4>
          {lastSaved && (
            <div className="flex items-center space-x-1.5 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Last saved: {formatDate(lastSaved)}</span>
            </div>
          )}
        </div>

        <div className="p-3">
          <textarea
            value={noteContent}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="Start typing your notes here..."
            className="w-full min-h-[300px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            disabled={saving}
          />

          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-gray-500">
              {noteContent.length} characters
              {hasUnsavedChanges && (
                <span className="ml-2 text-orange-600 font-medium">
                  (Unsaved changes)
                </span>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Note</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {savedNote && matchesSearch && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-3 py-2">
            <h4 className="text-sm font-medium text-gray-900">Saved Version</h4>
          </div>

          <div className="p-3 space-y-2">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">Current Version</span>
                <span className="text-xs text-gray-500">
                  Updated {formatDate(savedNote.updatedAt)}
                </span>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {highlightedContent()}
              </div>
            </div>

            {savedNote.createdAt.getTime() !== savedNote.updatedAt.getTime() && (
              <div className="text-xs text-gray-500 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>First created: {formatDate(savedNote.createdAt)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {savedNote && !matchesSearch && searchQuery && (
        <div className="text-center py-8 text-gray-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No matches found for "{searchQuery}"</p>
        </div>
      )}

      {!savedNote && !noteContent && (
        <div className="text-center py-8 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No notes yet. Start typing to create your first note.</p>
        </div>
      )}
    </div>
  );
};
