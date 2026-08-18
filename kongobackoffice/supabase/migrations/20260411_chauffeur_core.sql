-- ============================================================
-- Migration: Chauffeur App Core - drivers & reports
-- ============================================================

-- 1. DRIVERS TABLE (Links system users to bus assignments)
CREATE TABLE IF NOT EXISTS public.drivers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  agency_id    UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  assigned_bus_id UUID CONSTRAINT drivers_assigned_bus_id_fkey REFERENCES public.buses(id) ON DELETE SET NULL,
  license_number TEXT,
  status       TEXT DEFAULT 'active', -- active | off_duty | suspended
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT drivers_user_id_unique UNIQUE(user_id)
);

-- 2. DRIVER REPORTS TABLE (Signalements)
CREATE TABLE IF NOT EXISTS public.driver_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id    UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  category     TEXT NOT NULL, -- breakdown | accident | passenger | etc
  severity     TEXT DEFAULT 'medium', -- low | medium | high | critical
  location     TEXT,
  description  TEXT NOT NULL,
  status       TEXT DEFAULT 'pending', -- pending | resolved | dismissed
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_reports ENABLE ROW LEVEL SECURITY;

-- DRIVERS POLICIES
DROP POLICY IF EXISTS "Drivers are viewable by everyone" ON public.drivers;
CREATE POLICY "Drivers are viewable by everyone" ON public.drivers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Drivers can view their own record" ON public.drivers;
CREATE POLICY "Drivers can view their own record" ON public.drivers 
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- REPORTS POLICIES
DROP POLICY IF EXISTS "Drivers can insert their own reports" ON public.driver_reports;
CREATE POLICY "Drivers can insert their own reports" ON public.driver_reports
  FOR INSERT TO authenticated WITH CHECK (driver_id = auth.uid());

DROP POLICY IF EXISTS "Drivers can view their own reports" ON public.driver_reports;
CREATE POLICY "Drivers can view their own reports" ON public.driver_reports
  FOR SELECT TO authenticated USING (driver_id = auth.uid());

DROP POLICY IF EXISTS "Agencies can view reports from their drivers" ON public.driver_reports;
CREATE POLICY "Agencies can view reports from their drivers" ON public.driver_reports
  FOR SELECT TO authenticated USING (
    agency_id IN (
      SELECT agency_id FROM public.profiles WHERE id = auth.uid() AND (role = 'agency' OR role = 'admin')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS driver_reports_driver_id_idx ON public.driver_reports(driver_id);
CREATE INDEX IF NOT EXISTS driver_reports_agency_id_idx ON public.driver_reports(agency_id);
CREATE INDEX IF NOT EXISTS drivers_assigned_bus_id_idx ON public.drivers(assigned_bus_id);
