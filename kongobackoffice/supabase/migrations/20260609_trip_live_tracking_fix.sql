-- ============================================================
-- Migration: Trip live tracking fixes
-- Description:
-- - Allow mobile driver app to move trips to in_progress/departed.
-- - Allow passengers with a valid booking to read their trip bus location.
-- - Ensure trips updates are published through Supabase Realtime.
-- ============================================================

ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_status_check;
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_statuts_check;

ALTER TABLE public.trips
  ADD CONSTRAINT trips_status_check
  CHECK (
    status IN (
      'scheduled',
      'in_progress',
      'departed',
      'delayed',
      'full',
      'cancelled',
      'completed'
    )
  );

DROP POLICY IF EXISTS "Passengers can read own trip bus location" ON public.bus_locations;
CREATE POLICY "Passengers can read own trip bus location"
  ON public.bus_locations
  FOR SELECT
  TO authenticated
  USING (
    trip_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.trip_id = public.bus_locations.trip_id
        AND b.user_id = auth.uid()
        AND b.status IN ('confirmed', 'completed')
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'trips'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
  END IF;
END $$;
