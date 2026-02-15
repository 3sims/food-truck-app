-- 1. Ajouter la colonne pickup_code
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS pickup_code text;

-- 2. Modifier currency pour avoir une valeur par défaut
ALTER TABLE orders 
ALTER COLUMN currency SET DEFAULT 'eur';

-- 3. Désactiver temporairement RLS pour test
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- 4. Créer un index sur pickup_code pour performance
CREATE INDEX IF NOT EXISTS idx_orders_pickup_code ON orders(pickup_code);