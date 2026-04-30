/*
  # Add violation penalties table

  1. New Table
    - `violation_penalties`
      - `id` (text, primary key)
      - `tenant_id` (text, not null, references tenants)
      - `violation_code` (text, not null)
      - `penalty_bps` (integer, not null)
      - `description` (text, nullable)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS, read for all, write for authenticated
*/

CREATE TABLE IF NOT EXISTS violation_penalties (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  violation_code text NOT NULL,
  penalty_bps integer NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE violation_penalties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read violation penalties"
  ON violation_penalties FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated can insert violation penalties"
  ON violation_penalties FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update violation penalties"
  ON violation_penalties FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated can delete violation penalties"
  ON violation_penalties FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_penalties_tenant ON violation_penalties(tenant_id);
