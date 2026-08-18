-- ============================================================
-- Migration KONGO : RLS avis + Suppression de compte
-- ============================================================

-- 1. Policies UPDATE/DELETE pour agency_reviews
DROP POLICY IF EXISTS "agency_reviews_update" ON public.agency_reviews;
CREATE POLICY "agency_reviews_update"
  ON public.agency_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "agency_reviews_delete" ON public.agency_reviews;
CREATE POLICY "agency_reviews_delete"
  ON public.agency_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Table de journalisation des suppressions de compte (traçabilité RGPD)
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL,
  email         text        NOT NULL,
  reason        text,
  requested_at  timestamptz NOT NULL DEFAULT now(),
  processed_at  timestamptz,
  status        text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processed', 'cancelled'))
);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deletion_requests_select" ON public.account_deletion_requests;
CREATE POLICY "deletion_requests_select"
  ON public.account_deletion_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "deletion_requests_insert" ON public.account_deletion_requests;
CREATE POLICY "deletion_requests_insert"
  ON public.account_deletion_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
