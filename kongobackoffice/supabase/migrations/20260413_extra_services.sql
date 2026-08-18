-- Create Extra Services table
CREATE TABLE IF NOT EXISTS public.extra_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    icon TEXT, -- URL or emoji/icon name
    category TEXT NOT NULL DEFAULT 'service', -- 'baggage', 'insurance', 'meal', 'wifi', 'other'
    sub_category TEXT, -- 'cabine' or 'soute' for baggage
    min_weight NUMERIC DEFAULT 0,
    max_weight NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Enable RLS
ALTER TABLE public.extra_services ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read active extras
CREATE POLICY "Allow public read for active extras" 
ON public.extra_services FOR SELECT 
TO public 
USING (is_active = true);

-- Agencies can manage their own extras
CREATE POLICY "Agencies can manage their own extras" 
ON public.extra_services FOR ALL 
TO authenticated 
USING (
  agency_id IN (
    SELECT agency_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Insert some default data for 'meji' (assuming we find the agency id)
-- Note: This is a placeholder. Real data will be added via dashboard.
