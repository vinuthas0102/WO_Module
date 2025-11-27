/*
  # Create Ticket User Notes Table

  ## Overview
  This migration creates a private note-taking feature for users at the ticket level.
  Each user can maintain their own personal notes for any ticket, visible only to them.

  ## New Tables
  1. `ticket_user_notes` - Stores user-specific notes for tickets
     - `id` (uuid, primary key) - Unique identifier for the note
     - `ticket_id` (uuid, references tickets) - The ticket this note belongs to
     - `user_id` (uuid, references users) - The user who owns this note
     - `note_content` (text) - The actual note content
     - `created_at` (timestamptz) - When the note was first created
     - `updated_at` (timestamptz) - When the note was last modified
     - Unique constraint on (ticket_id, user_id) - One note per user per ticket

  ## Security
  - Enable RLS on ticket_user_notes table
  - Add policies for anon role to allow full CRUD operations
  - Notes are private to each user through application-level filtering

  ## Indexes
  - Index on ticket_id for efficient ticket-based queries
  - Index on user_id for efficient user-based queries
  - Composite index on (ticket_id, user_id) for lookups
*/

-- Create ticket_user_notes table
CREATE TABLE IF NOT EXISTS ticket_user_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_content text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_ticket_note UNIQUE (ticket_id, user_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ticket_user_notes_ticket_id ON ticket_user_notes(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_user_notes_user_id ON ticket_user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_user_notes_ticket_user ON ticket_user_notes(ticket_id, user_id);

-- Enable Row Level Security
ALTER TABLE ticket_user_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for anon role
CREATE POLICY "Allow anon to insert notes"
  ON ticket_user_notes
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to view notes"
  ON ticket_user_notes
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to update notes"
  ON ticket_user_notes
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon to delete notes"
  ON ticket_user_notes
  FOR DELETE
  TO anon
  USING (true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_ticket_user_notes_updated_at
  BEFORE UPDATE ON ticket_user_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
