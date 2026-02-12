-- Migration 001c: Menu enhancements (Week 1 complements)
-- Date: 2026-02-12
-- Owner: Rôle B

-- Add missing columns for menu details
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS ingredients text;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS allergens text;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 100 CHECK (stock_quantity >= 0);

-- Index for stock queries
CREATE INDEX IF NOT EXISTS idx_menu_items_stock ON menu_items(stock_quantity) 
  WHERE available = true AND stock_quantity > 0;

-- Add UNIQUE constraint on name (to allow ON CONFLICT)
ALTER TABLE menu_items ADD CONSTRAINT menu_items_name_unique UNIQUE (name);

-- Seed data for demo
INSERT INTO menu_items (name, description, price, currency, category, available, image_url, ingredients, allergens, stock_quantity)
VALUES 
  ('Burger Solidaire', 'Steak haché, salade, tomate, fromage, pain artisanal', 850, 'eur', 'plat', true, 
   'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', 
   'Pain de blé, bœuf français, laitue, tomate, cheddar, sauce maison', 
   'Gluten, Lactose', 50),
  
  ('Salade Caesar', 'Poulet grillé, croûtons, parmesan, sauce Caesar', 750, 'eur', 'plat', true,
   'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
   'Laitue romaine, poulet fermier, parmesan AOP, croûtons, anchois, œuf',
   'Gluten, Lactose, Poisson, Œuf', 30),
  
  ('Wrap Végétarien', 'Légumes grillés, houmous, galette complète', 700, 'eur', 'plat', true,
   'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400',
   'Galette complète, courgette, aubergine, poivron, houmous, pousses épinard',
   'Gluten, Sésame', 40),
  
  ('Tarte aux pommes', 'Faite maison, pâte pur beurre', 400, 'eur', 'dessert', true,
   'https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=400',
   'Pommes golden, pâte feuilletée, beurre, sucre de canne',
   'Gluten, Lactose', 20),
  
  ('Brownie chocolat', 'Intense, fondant, pépites de chocolat', 350, 'eur', 'dessert', true,
   'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=400',
   'Chocolat noir 70%, beurre, œufs, farine, sucre, pépites de chocolat',
   'Gluten, Lactose, Œuf', 25),
  
  ('Eau minérale 50cl', 'Eau de source', 150, 'eur', 'boisson', true, null,
   'Eau de source naturelle',
   'Aucun', 100),
  
  ('Café équitable', 'Espresso ou allongé', 200, 'eur', 'boisson', true, null,
   'Café arabica équitable',
   'Aucun', 80)
ON CONFLICT (name) DO NOTHING;

COMMENT ON COLUMN menu_items.ingredients IS 'Liste des ingrédients principaux';
COMMENT ON COLUMN menu_items.allergens IS 'Allergènes majeurs (séparés par virgule)';
COMMENT ON COLUMN menu_items.stock_quantity IS 'Quantité disponible (décrémentée à la commande)';