-- ============================================================
-- Migration KONGO : Table Notifications (Diffusion Agence & Admin)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text        NOT NULL,
  content         text        NOT NULL,
  agency_name     text        NOT NULL DEFAULT 'KonGO Platform',
  agency_id       uuid        REFERENCES public.agencies(id) ON DELETE SET NULL,
  target_audience text        NOT NULL DEFAULT 'all', -- 'all', 'subscribers', 'passengers'
  author_role     text        NOT NULL DEFAULT 'chef', -- 'chef', 'agency', 'superuser'
  published_at    timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Index pour accélérer la récupération ordonnée par date
CREATE INDEX IF NOT EXISTS idx_notifications_published_at ON public.notifications (published_at DESC);

-- Activer RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Politiques d'accès : Lecture publique pour l'application mobile et le backoffice
CREATE POLICY "Lecture notifications publiques" ON public.notifications
  FOR SELECT USING (true);

-- Insertion autorisée pour utilisateurs authentifiés
CREATE POLICY "Insertion notifications authentifiees" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Suppression autorisée
CREATE POLICY "Suppression notifications authentifiees" ON public.notifications
  FOR DELETE USING (true);
