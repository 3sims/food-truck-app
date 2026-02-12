-- Créer la fonction (idempotent)
CREATE OR REPLACE FUNCTION prevent_double_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'completed' AND NEW.status = 'completed' THEN
    RAISE EXCEPTION 'Order % already completed at %', OLD.id, OLD.updated_at
      USING HINT = 'Cannot mark the same order as completed multiple times';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ne recréer le trigger que s'il n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'check_double_completion'
  ) THEN
    CREATE TRIGGER check_double_completion 
      BEFORE UPDATE ON orders
      FOR EACH ROW 
      WHEN (OLD.status = 'completed' AND NEW.status = 'completed')
      EXECUTE FUNCTION prevent_double_completion();
  END IF;
END $$;