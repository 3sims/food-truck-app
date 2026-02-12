-- Migration 001f: Stock management functions (Week 1)
-- Date: 2026-02-12
-- Owner: Rôle B

-- Function to atomically decrement stock
CREATE OR REPLACE FUNCTION decrement_stock(item_id uuid, quantity integer)
RETURNS void AS $$
BEGIN
  UPDATE menu_items
  SET stock_quantity = stock_quantity - quantity
  WHERE id = item_id AND stock_quantity >= quantity;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for item %', item_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION decrement_stock IS 'Décrémente le stock de façon atomique (évite race conditions)';
