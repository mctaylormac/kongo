-- ============================================================
-- Migration: GPS Bus Tracking - bus_locations table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bus_locations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id       UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  driver_id    UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  agency_id    UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  latitude     DOUBLE PRECISION NOT NULL,
  longitude    DOUBLE PRECISION NOT NULL,
  speed        REAL DEFAULT 0,        -- km/h
  heading      REAL DEFAULT 0,        -- degrees 0-360
  accuracy     REAL,                  -- meters
  trip_id      UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  status       TEXT DEFAULT 'active', -- active | idle | offline
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one location record per bus (upsert pattern)
CREATE UNIQUE INDEX IF NOT EXISTS bus_locations_bus_id_unique ON public.bus_locations(bus_id);

-- Index for fast agency queries
CREATE INDEX IF NOT EXISTS bus_locations_agency_id_idx ON public.bus_locations(agency_id);

-- Enable Row Level Security
ALTER TABLE public.bus_locations ENABLE ROW LEVEL SECURITY;

-- Drivers can upsert their own bus location
DROP POLICY IF EXISTS "Drivers can upsert their bus location" ON public.bus_locations;
CREATE POLICY "Drivers can upsert their bus location"
  ON public.bus_locations
  FOR ALL
  TO authenticated
  USING (
    driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  );

-- Agency managers can read locations for their agency
DROP POLICY IF EXISTS "Agency can read own bus locations" ON public.bus_locations;
CREATE POLICY "Agency can read own bus locations"
  ON public.bus_locations
  FOR SELECT
  TO authenticated
  USING (
    agency_id IN (
      SELECT agency_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Enable Realtime for this table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'bus_locations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bus_locations;
  END IF;
END $$;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_bus_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bus_location_timestamp ON public.bus_locations;
CREATE TRIGGER bus_location_timestamp
  BEFORE UPDATE ON public.bus_locations
  FOR EACH ROW EXECUTE FUNCTION update_bus_location_timestamp();
