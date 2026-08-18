-- ============================================================
-- Migration KONGO : Notation & Avis des Agences (Accès Authentifié)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agency_reviews (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id    uuid        NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name  text        NOT NULL,
  rating       numeric(2,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  comment      text        NOT NULL,
  route        text        NOT NULL DEFAULT 'Kinshasa → Lubumbashi',
  trip_type    text        NOT NULL DEFAULT 'VIP',
  verified     boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Index performance
CREATE INDEX IF NOT EXISTS agency_reviews_agency_id_idx 
  ON public.agency_reviews (agency_id, created_at DESC);

-- RLS
ALTER TABLE public.agency_reviews ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les avis
DROP POLICY IF EXISTS "agency_reviews_select" ON public.agency_reviews;
CREATE POLICY "agency_reviews_select"
  ON public.agency_reviews FOR SELECT
  USING (true);

-- SEULS les utilisateurs connectés (authentifiés) peuvent publier un avis
DROP POLICY IF EXISTS "agency_reviews_insert" ON public.agency_reviews;
CREATE POLICY "agency_reviews_insert"
  ON public.agency_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- Insérer des données de test si la table est vide
DO $$
DECLARE
  ag_id uuid;
BEGIN
  SELECT id INTO ag_id FROM public.agencies LIMIT 1;
  IF ag_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.agency_reviews WHERE agency_id = ag_id) THEN
      INSERT INTO public.agency_reviews (agency_id, author_name, rating, comment, route, trip_type, verified)
      VALUES
        (ag_id, 'Marie Kalala', 5.0, 'Service absolument exceptionnel ! Ponctualité irréprochable, confort optimal et personnel très professionnel. Les bus sont modernes avec Wi-Fi gratuit et climatisation parfaite. Voyage Kinshasa-Lubumbashi sans le moindre souci.', 'Kinshasa → Lubumbashi', 'VIP', true),
        (ag_id, 'Jean Kabasubabu', 4.0, 'Très satisfait de mon voyage. Personnel accueillant et serviable. Seul petit bémol : départ avec 20 minutes de retard, mais arrivée à l''heure prévue grâce à la conduite professionnelle.', 'Goma → Kinshasa', 'Standard', true),
        (ag_id, 'Claudine Tshisekedi', 5.0, 'Transport premium comme promis ! Sièges inclinables, collations incluses, et même un système de divertissement à bord. Le GPS tracking permet aux familles de suivre le voyage en temps réel.', 'Lubumbashi → Bukavu', 'Premium', true);
    END IF;
  END IF;
END $$;
