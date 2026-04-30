/*
  # Create tenants, operators, events, policies, and recovery tables

  1. New Tables
    - `tenants`
      - `id` (text, primary key)
      - `name` (text, not null)
      - `admin` (text, not null)
      - `operator_manager` (text, not null)
      - `treasury` (text, not null)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())
      - `min_operator_stake` (numeric, default 1)
      - `unstake_cooldown` (integer, default 604800 - 7 days in seconds)

    - `operators`
      - `id` (text, primary key)
      - `tenant_id` (text, not null, references tenants)
      - `address` (text, not null)
      - `stake_amount` (numeric, default 0)
      - `is_active` (boolean, default true)
      - `joined_at` (timestamptz, default now())
      - `metadata_uri` (text, nullable)
      - `pending_unstake_at` (timestamptz, nullable)
      - `recovery_delegate` (text, nullable)

    - `blockchain_events`
      - `id` (text, primary key)
      - `tx_hash` (text, not null)
      - `type` (text, not null)
      - `actor` (text, not null)
      - `description` (text, not null)
      - `timestamp` (timestamptz, default now())
      - `block_number` (integer, not null)
      - `gas_used` (integer, default 0)
      - `tenant_id` (text, nullable)
      - `data` (jsonb, default '{}')

    - `co_sign_policies`
      - `id` (text, primary key)
      - `tenant_id` (text, not null, references tenants)
      - `doc_type` (text, not null)
      - `enabled` (boolean, default true)
      - `min_signers` (integer, default 2)
      - `required_roles` (text[], default '{}')
      - `whitelisted_operators` (text[], default '{}')

    - `recovery_aliases`
      - `id` (text, primary key)
      - `tenant_id` (text, not null, references tenants)
      - `from_address` (text, not null)
      - `to_address` (text, not null)
      - `recovered_at` (timestamptz, default now())
      - `recovered_by` (text, not null)

  2. Security
    - Enable RLS on all tables
    - All tables: anyone can read, authenticated users can insert/update
*/

CREATE TABLE IF NOT EXISTS tenants (
  id text PRIMARY KEY,
  name text NOT NULL,
  admin text NOT NULL,
  operator_manager text NOT NULL,
  treasury text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  min_operator_stake numeric DEFAULT 1,
  unstake_cooldown integer DEFAULT 604800
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tenants"
  ON tenants FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated can insert tenants"
  ON tenants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update tenants"
  ON tenants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS operators (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  address text NOT NULL,
  stake_amount numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  joined_at timestamptz DEFAULT now(),
  metadata_uri text,
  pending_unstake_at timestamptz,
  recovery_delegate text
);

ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read operators"
  ON operators FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated can insert operators"
  ON operators FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update operators"
  ON operators FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS blockchain_events (
  id text PRIMARY KEY,
  tx_hash text NOT NULL,
  type text NOT NULL,
  actor text NOT NULL,
  description text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  block_number integer NOT NULL,
  gas_used integer DEFAULT 0,
  tenant_id text,
  data jsonb DEFAULT '{}'
);

ALTER TABLE blockchain_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read events"
  ON blockchain_events FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated can insert events"
  ON blockchain_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS co_sign_policies (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  enabled boolean DEFAULT true,
  min_signers integer DEFAULT 2,
  required_roles text[] DEFAULT '{}',
  whitelisted_operators text[] DEFAULT '{}'
);

ALTER TABLE co_sign_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read policies"
  ON co_sign_policies FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated can insert policies"
  ON co_sign_policies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update policies"
  ON co_sign_policies FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS recovery_aliases (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  from_address text NOT NULL,
  to_address text NOT NULL,
  recovered_at timestamptz DEFAULT now(),
  recovered_by text NOT NULL
);

ALTER TABLE recovery_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read recovery aliases"
  ON recovery_aliases FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated can insert recovery aliases"
  ON recovery_aliases FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_operators_tenant ON operators(tenant_id);
CREATE INDEX IF NOT EXISTS idx_operators_address ON operators(address);
CREATE INDEX IF NOT EXISTS idx_events_tenant ON blockchain_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_actor ON blockchain_events(actor);
CREATE INDEX IF NOT EXISTS idx_events_type ON blockchain_events(type);
CREATE INDEX IF NOT EXISTS idx_policies_tenant ON co_sign_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recovery_tenant ON recovery_aliases(tenant_id);
