-- ============================================================
-- Migration: Fix driver_reports foreign key to point to profiles
-- ============================================================

-- Ensure the driver_id in driver_reports points specifically to public.profiles
-- This allows PostgREST to perform joins with the profiles table via the Public API.

ALTER TABLE IF EXISTS public.driver_reports 
  DROP CONSTRAINT IF EXISTS driver_reports_driver_id_fkey;

ALTER TABLE public.driver_reports
  ADD CONSTRAINT driver_reports_driver_id_fkey 
  FOREIGN KEY (driver_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- Data Recovery: Backfill agency_id for reports that might have been submitted without it
-- This links existing reports to the correct agency dashboard based on the driver's current agency.
UPDATE public.driver_reports dr
SET agency_id = p.agency_id
FROM public.profiles p
WHERE dr.driver_id = p.id
  AND dr.agency_id IS NULL
  AND p.agency_id IS NOT NULL;

-- Also ensure agencies can see reports (double check RLS)
-- The existing policy in 20260411_chauffeur_core.sql seems correct, but let's re-verify it's effective.
-- It filters by agency_id, which we are now correctly populating from the mobile app.
