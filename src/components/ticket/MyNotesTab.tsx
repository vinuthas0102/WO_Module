import React, { useState, useEffect } from 'react';
import { Save, Clock, FileText, Loader2 } from 'lucide-react';
import { TicketUserNote } from '../../types';
import { TicketNotesService } from '../../services/ticketNotesService';
import { useAuth } from '../../context/AuthContext';

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-gray-500">Loading your notes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
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

      {savedNote && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-3 py-2">
            <h4 className="text-sm font-medium text-gray-900">Note History</h4>
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
                {savedNote.noteContent || 'No content'}
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

      {!savedNote && !noteContent && (
        <div className="text-center py-8 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No notes yet. Start typing to create your first note.</p>
        </div>
      )}
    </div>
  );
};
