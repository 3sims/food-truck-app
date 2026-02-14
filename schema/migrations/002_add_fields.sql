-- Migration 002: Settings table
-- Date: 2026-02-12
-- Owner: Rôle B
--
-- Note: stock_quantity (menu_items) déjà ajouté dans 001c_menu_enhancements.sql
-- Note: is_suspended (order_items) déjà ajouté dans 001d_order_items_suspended.sql
-- Note: decrement_stock() déjà définie dans 001f_stock_functions.sql

-- Créer la table settings
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  location TEXT NOT NULL DEFAULT 'Place de la Bastille, Paris',
  slots JSONB NOT NULL DEFAULT '["11:30", "12:00", "12:30", "13:00", "18:30", "19:00", "19:30", "20:00"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT settings_one_row CHECK (id = 1)
);

-- Insérer les paramètres par défaut
INSERT INTO settings (id, location, slots)
VALUES (1, 'Place de la Bastille, Paris', '["11:30", "12:00", "12:30", "13:00", "18:30", "19:00", "19:30", "20:00"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Trigger pour updated_at sur settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_settings_updated_at'
  ) THEN
    CREATE TRIGGER set_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
