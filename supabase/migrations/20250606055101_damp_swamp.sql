/*
  # Add Mailboxes Support for Brevo Integration

  1. New Tables
    - `mailboxes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `address` (text, unique)
      - `webhook_id` (text)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on `mailboxes` table
    - Add policy for authenticated users to read their own mailboxes
    - Add policy for authenticated users to create mailboxes
*/

-- Create mailboxes table
CREATE TABLE IF NOT EXISTS mailboxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  address text UNIQUE NOT NULL,
  webhook_id text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  CONSTRAINT valid_email CHECK (address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Enable RLS
ALTER TABLE mailboxes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own mailboxes"
  ON mailboxes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create mailboxes"
  ON mailboxes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add indexes
CREATE INDEX mailboxes_user_id_idx ON mailboxes(user_id);
CREATE INDEX mailboxes_address_idx ON mailboxes(address);