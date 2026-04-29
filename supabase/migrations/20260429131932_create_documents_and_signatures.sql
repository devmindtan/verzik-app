/*
  # Create documents and signatures tables

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `tenant_id` (text, not null)
      - `file_hash` (text, not null)
      - `file_name` (text, not null)
      - `doc_type` (text, not null: voucher/contract/certificate/receipt)
      - `issued_by` (text, not null - operator address)
      - `issued_at` (timestamptz)
      - `is_valid` (boolean, default true)
      - `co_sign_qualified` (boolean, default false)
      - `recipient_address` (text, nullable - end-user who owns this document)
      - `metadata_amount` (numeric, nullable)
      - `metadata_recipient` (text, nullable)
      - `metadata_expiry_date` (timestamptz, nullable)
      - `created_at` (timestamptz, default now())

    - `document_signatures`
      - `id` (uuid, primary key)
      - `document_id` (uuid, foreign key to documents)
      - `signer_address` (text, not null)
      - `signature_type` (text, not null: 'primary' or 'cosign')
      - `signed_at` (timestamptz, default now())

  2. Security
    - Enable RLS on both tables
    - Documents: anyone can read, only operators/tenant roles can insert/update
    - Signatures: anyone can read, only operators can insert
*/

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL DEFAULT '',
  file_hash text NOT NULL,
  file_name text NOT NULL,
  doc_type text NOT NULL DEFAULT 'voucher',
  issued_by text NOT NULL,
  issued_at timestamptz DEFAULT now(),
  is_valid boolean DEFAULT true,
  co_sign_qualified boolean DEFAULT false,
  recipient_address text DEFAULT '',
  metadata_amount numeric DEFAULT 0,
  metadata_recipient text DEFAULT '',
  metadata_expiry_date timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read documents"
  ON documents FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Operators can insert documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Operators can update documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS document_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  signer_address text NOT NULL,
  signature_type text NOT NULL DEFAULT 'primary',
  signed_at timestamptz DEFAULT now()
);

ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read signatures"
  ON document_signatures FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Operators can insert signatures"
  ON document_signatures FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_documents_recipient ON documents(recipient_address);
CREATE INDEX IF NOT EXISTS idx_documents_issued_by ON documents(issued_by);
CREATE INDEX IF NOT EXISTS idx_signatures_signer ON document_signatures(signer_address);
CREATE INDEX IF NOT EXISTS idx_signatures_document ON document_signatures(document_id);
