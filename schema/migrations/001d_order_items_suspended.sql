-- Migration 001d: Order items suspended flag (Week 1)
-- Date: 2026-02-12
-- Owner: Rôle B

-- Add flag to mark items as "suspended meal" (paid by someone else)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;

-- Index for queries filtering suspended items
CREATE INDEX IF NOT EXISTS idx_order_items_suspended ON order_items(is_suspended) WHERE is_suspended = true;

COMMENT ON COLUMN order_items.is_suspended IS 'True si ce repas est un repas suspendu (offert par un tiers)';
