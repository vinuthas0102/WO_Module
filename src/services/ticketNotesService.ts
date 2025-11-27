import { supabase } from '../lib/supabase';
import { TicketUserNote } from '../types';

export class TicketNotesService {
  static async getUserNoteForTicket(
    ticketId: string,
    userId: string
  ): Promise<TicketUserNote | null> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data, error } = await supabase
        .from('ticket_user_notes')
        .select('*')
        .eq('ticket_id', ticketId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      return this.mapNoteFromDb(data);
    } catch (error) {
      console.error('Error fetching user note:', error);
      throw error;
    }
  }

  static async saveUserNote(
    ticketId: string,
    userId: string,
    noteContent: string
  ): Promise<TicketUserNote> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data, error } = await supabase
        .from('ticket_user_notes')
        .upsert(
          {
            ticket_id: ticketId,
            user_id: userId,
            note_content: noteContent,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'ticket_id,user_id'
          }
        )
        .select()
        .single();

      if (error) throw error;

      return this.mapNoteFromDb(data);
    } catch (error) {
      console.error('Error saving user note:', error);
      throw error;
    }
  }

  static async deleteUserNote(
    ticketId: string,
    userId: string
  ): Promise<void> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { error } = await supabase
        .from('ticket_user_notes')
        .delete()
        .eq('ticket_id', ticketId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting user note:', error);
      throw error;
    }
  }

  private static mapNoteFromDb(data: any): TicketUserNote {
    return {
      id: data.id,
      ticketId: data.ticket_id,
      userId: data.user_id,
      noteContent: data.note_content || '',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}
