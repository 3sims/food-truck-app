-- Migration 003: Système donateur/bénéficiaire
-- Date: 2026-02-15

-- Table pour les dons de repas
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  donor_email text NOT NULL,
  donor_phone text,
  beneficiary_email text,
  beneficiary_phone text,
  pickup_code text UNIQUE NOT NULL,
  qr_code_url text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'redeemed', 'expired')),
  claimed_at timestamptz,
  redeemed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour performances
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_pickup_code ON donations(pickup_code);
CREATE INDEX idx_donations_order_id ON donations(order_id);
CREATE INDEX idx_donations_expires_at ON donations(expires_at);

-- Trigger pour updated_at
CREATE TRIGGER set_donations_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Les donateurs peuvent voir leurs dons
CREATE POLICY "Donors can view their own donations"
  ON donations FOR SELECT
  USING (donor_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Les bénéficiaires peuvent voir les dons disponibles
CREATE POLICY "Anyone can view available donations"
  ON donations FOR SELECT
  USING (status = 'available' AND expires_at > now());

-- Le système peut insérer
CREATE POLICY "Service role can insert donations"
  ON donations FOR INSERT
  WITH CHECK (true);

-- Le système peut mettre à jour
CREATE POLICY "Service role can update donations"
  ON donations FOR UPDATE
  USING (true);

COMMENT ON TABLE donations IS 'Gestion des repas suspendus avec système donateur/bénéficiaire';