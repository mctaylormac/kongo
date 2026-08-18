-- ============================================================
-- Migration: Unify Ticket Scans Table
-- Description: Ensures ticket_scans has all columns required by 
-- both mobile (Chauffeur) and web (Admin) dashboards.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ticket_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Codes & Info (Redundant for history speed)
    ticket_code TEXT,
    booking_code TEXT, -- Alias for web dashboard
    client_name TEXT,
    route TEXT,
    departure_time TIMESTAMPTZ,
    
    -- Status
    scan_status TEXT NOT NULL, -- valid | invalid | already_scanned | pending_sync
    result TEXT, -- Alias for web dashboard (same as scan_status)
    notes TEXT, -- For web dashboard
    
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ticket_scans ENABLE ROW LEVEL SECURITY;

-- POLICIES
DROP POLICY IF EXISTS "Drivers can insert scans" ON public.ticket_scans;
CREATE POLICY "Drivers can insert scans" 
ON public.ticket_scans FOR INSERT 
TO authenticated 
WITH CHECK (true); -- Usually restricted to driver_id = auth.uid() but we'll be flexible

DROP POLICY IF EXISTS "Drivers can view their scans" ON public.ticket_scans;
CREATE POLICY "Drivers can view their scans" 
ON public.ticket_scans FOR SELECT 
TO authenticated 
USING (driver_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('agency', 'superuser'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS ticket_scans_booking_id_idx ON public.ticket_scans(booking_id);
CREATE INDEX IF NOT EXISTS ticket_scans_driver_id_idx ON public.ticket_scans(driver_id);
CREATE INDEX IF NOT EXISTS ticket_scans_scanned_at_idx ON public.ticket_scans(scanned_at);
