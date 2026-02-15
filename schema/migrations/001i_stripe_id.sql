-- Ajouter colonne pour stocker le session_id Stripe
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS stripe_session_id text;

-- Créer un index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session 
ON orders(stripe_session_id);