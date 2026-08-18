// Script de migration - KonGO Supabase
// Crée les tables driver_reports et bus_positions
const https = require('https');

const PROJECT_REF = 'yzsujxyltodcoynkqxsv';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';

const SQL = `
-- ============================================================
-- TABLE: driver_reports
-- ============================================================
CREATE TABLE IF NOT EXISTS public.driver_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id     UUID NOT NULL,
  category      TEXT NOT NULL,
  severity      TEXT NOT NULL DEFAULT 'medium' 
                CHECK (severity IN ('low','medium','high','critical')),
  location      TEXT,
  description   TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' 
                CHECK (status IN ('pending','in_review','resolved','dismissed')),
  resolved_by   UUID,
  resolved_at   TIMESTAMPTZ,
  agency_id     UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS driver_own_reports ON public.driver_reports;
CREATE POLICY driver_own_reports ON public.driver_reports 
  FOR ALL TO authenticated 
  USING (driver_id = auth.uid()) 
  WITH CHECK (driver_id = auth.uid());

DROP POLICY IF EXISTS agency_view_reports ON public.driver_reports;
CREATE POLICY agency_view_reports ON public.driver_reports 
  FOR SELECT TO authenticated 
  USING (
    agency_id IN (
      SELECT agency_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_driver_reports_driver    ON public.driver_reports(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_reports_status    ON public.driver_reports(status);
CREATE INDEX IF NOT EXISTS idx_driver_reports_agency    ON public.driver_reports(agency_id);
CREATE INDEX IF NOT EXISTS idx_driver_reports_created   ON public.driver_reports(created_at DESC);

-- ============================================================
-- TABLE: bus_positions (GPS tracking every 5 min)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bus_positions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id     UUID NOT NULL,
  bus_id        UUID,
  trip_id       UUID,
  agency_id     UUID,
  latitude      DOUBLE PRECISION NOT NULL,
  longitude     DOUBLE PRECISION NOT NULL,
  speed         REAL,
  heading       REAL,
  accuracy      REAL,
  is_tracking   BOOLEAN NOT NULL DEFAULT true,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bus_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS driver_own_positions ON public.bus_positions;
CREATE POLICY driver_own_positions ON public.bus_positions 
  FOR ALL TO authenticated 
  USING (driver_id = auth.uid()) 
  WITH CHECK (driver_id = auth.uid());

DROP POLICY IF EXISTS agency_view_positions ON public.bus_positions;
CREATE POLICY agency_view_positions ON public.bus_positions 
  FOR SELECT TO authenticated 
  USING (
    agency_id IN (
      SELECT agency_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_bus_positions_driver   ON public.bus_positions(driver_id);
CREATE INDEX IF NOT EXISTS idx_bus_positions_trip     ON public.bus_positions(trip_id);
CREATE INDEX IF NOT EXISTS idx_bus_positions_recorded ON public.bus_positions(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_bus_positions_agency   ON public.bus_positions(agency_id);
`;

const body = JSON.stringify({ query: SQL });

const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Migration réussie !');
      console.log(data);
    } else {
      console.error('❌ Erreur HTTP', res.statusCode);
      console.error(data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erreur réseau:', e.message);
});

req.write(body);
req.end();
