-- Migration 004: Géolocalisation food trucks
-- Date: 2026-02-15

-- Activer PostGIS si pas déjà fait
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;

-- Table des food trucks
CREATE TABLE IF NOT EXISTS food_trucks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  postal_code text,
  active boolean NOT NULL DEFAULT true,
  opening_time time,
  closing_time time,
  description text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_coordinates CHECK (
    latitude >= -90 AND latitude <= 90 AND
    longitude >= -180 AND longitude <= 180
  )
);

-- Index géospatial
CREATE INDEX idx_food_trucks_location ON food_trucks USING GIST (
  ll_to_earth(latitude, longitude)
);

CREATE INDEX idx_food_trucks_active ON food_trucks(active);

-- Trigger updated_at
CREATE TRIGGER set_food_trucks_updated_at
  BEFORE UPDATE ON food_trucks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE food_trucks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active food trucks"
  ON food_trucks FOR SELECT
  USING (active = true);

CREATE POLICY "Service role can manage food trucks"
  ON food_trucks FOR ALL
  USING (true);

-- Fonction pour trouver le food truck le plus proche
CREATE OR REPLACE FUNCTION find_nearest_truck(
  user_lat decimal,
  user_lon decimal,
  max_distance_km decimal DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  name text,
  address text,
  latitude decimal,
  longitude decimal,
  distance_km decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ft.id,
    ft.name,
    ft.address,
    ft.latitude,
    ft.longitude,
    ROUND(
      (earth_distance(
        ll_to_earth(user_lat, user_lon),
        ll_to_earth(ft.latitude, ft.longitude)
      ) / 1000)::numeric, 
      2
    ) as distance_km
  FROM food_trucks ft
  WHERE ft.active = true
    AND earth_distance(
      ll_to_earth(user_lat, user_lon),
      ll_to_earth(ft.latitude, ft.longitude)
    ) <= max_distance_km * 1000
  ORDER BY distance_km ASC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Insérer un food truck de test (Place de la Bastille)
INSERT INTO food_trucks (name, latitude, longitude, address, city, postal_code, active) VALUES
('La Cocotte Roulante - Bastille', 48.853140, 2.369220, 'Place de la Bastille', 'Paris', '75011', true);

COMMENT ON TABLE food_trucks IS 'Localisation des food trucks actifs';
COMMENT ON FUNCTION find_nearest_truck IS 'Trouve les 5 food trucks les plus proches avec distance';