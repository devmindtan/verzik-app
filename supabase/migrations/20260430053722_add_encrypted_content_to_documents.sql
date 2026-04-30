/*
  # Add encrypted and content columns to documents

  1. Modified Table
    - `documents`
      - `encrypted` (boolean, default false) - Whether the document content is encrypted
      - `content` (text, default '') - The document content (plain or encrypted)

  2. Security
    - No RLS changes needed, existing policies cover these columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'encrypted'
  ) THEN
    ALTER TABLE documents ADD COLUMN encrypted boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'content'
  ) THEN
    ALTER TABLE documents ADD COLUMN content text DEFAULT '';
  END IF;
END $$;
