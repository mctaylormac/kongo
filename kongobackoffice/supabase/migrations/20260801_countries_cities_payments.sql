-- ============================================================
-- Migration KONGO : Pays, Villes & Moyens de Paiement (Complet)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Table countries (Pays)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.countries (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  code         text        NOT NULL UNIQUE, -- ex: 'RDC', 'CG'
  phone_code   text        NOT NULL DEFAULT '', -- ex: '+243', '+242'
  currency     text        NOT NULL DEFAULT '', -- ex: 'CDF', 'XAF', 'USD'
  flag_emoji   text        NOT NULL DEFAULT '🌐',
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. Table cities (Villes)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cities (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id   uuid        NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT cities_country_name_unique UNIQUE (country_id, name)
);

-- ------------------------------------------------------------
-- 3. Table payment_methods (Moyens de paiement)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id   uuid        NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  city_id      uuid        REFERENCES public.cities(id) ON DELETE SET NULL, -- NULL = tout le pays
  name         text        NOT NULL, -- ex: 'M-Pesa Vodacom', 'Orange Money'
  code         text        NOT NULL, -- ex: 'mpesa', 'orange_money', 'visa_card'
  provider     text        NOT NULL DEFAULT '', -- ex: 'Vodacom', 'Orange', 'Airtel', 'Rawbank'
  icon_name    text        NOT NULL DEFAULT 'Wallet',
  instructions text        DEFAULT '',
  fees_percentage numeric   NOT NULL DEFAULT 0.0, -- ex: 1.5 pour 1.5%
  processing_time text     DEFAULT 'Instantane',
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Ajouter les colonnes fees_percentage et processing_time au cas où la table existait déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_methods' AND column_name = 'fees_percentage'
  ) THEN
    ALTER TABLE public.payment_methods ADD COLUMN fees_percentage numeric NOT NULL DEFAULT 0.0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_methods' AND column_name = 'processing_time'
  ) THEN
    ALTER TABLE public.payment_methods ADD COLUMN processing_time text DEFAULT 'Instantane';
  END IF;
END $$;

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS cities_country_id_idx ON public.cities(country_id);
CREATE INDEX IF NOT EXISTS payment_methods_country_id_idx ON public.payment_methods(country_id);
CREATE INDEX IF NOT EXISTS payment_methods_city_id_idx ON public.payment_methods(city_id);

-- ------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Policy SELECT : tout le monde peut lire (utilisateurs authentifiés + anonymes pour l'app mobile & site)
DROP POLICY IF EXISTS "Allow read access to countries" ON public.countries;
CREATE POLICY "Allow read access to countries" ON public.countries FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read access to cities" ON public.cities;
CREATE POLICY "Allow read access to cities" ON public.cities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow read access to payment_methods" ON public.payment_methods;
CREATE POLICY "Allow read access to payment_methods" ON public.payment_methods FOR SELECT USING (true);

-- Policy ALL (INSERT, UPDATE, DELETE) : Superuser uniquement
DROP POLICY IF EXISTS "Allow superuser write to countries" ON public.countries;
CREATE POLICY "Allow superuser write to countries" ON public.countries FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superuser'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superuser'));

DROP POLICY IF EXISTS "Allow superuser write to cities" ON public.cities;
CREATE POLICY "Allow superuser write to cities" ON public.cities FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superuser'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superuser'));

DROP POLICY IF EXISTS "Allow superuser write to payment_methods" ON public.payment_methods;
CREATE POLICY "Allow superuser write to payment_methods" ON public.payment_methods FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superuser'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superuser'));

-- ------------------------------------------------------------
-- 5. REALTIME PUBLICATION
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'countries') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.countries;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'cities') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cities;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'payment_methods') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_methods;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 6. SEED DATA : TOUTES LES VILLES ET PAIEMENTS DU SITE
-- ------------------------------------------------------------

-- Insérer RDC
INSERT INTO public.countries (name, code, phone_code, currency, flag_emoji, is_active)
VALUES ('République Démocratique du Congo', 'RDC', '+243', 'CDF', '🇨🇩', true)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, phone_code = EXCLUDED.phone_code, currency = EXCLUDED.currency, flag_emoji = EXCLUDED.flag_emoji;

-- Insérer Congo Brazzaville
INSERT INTO public.countries (name, code, phone_code, currency, flag_emoji, is_active)
VALUES ('République du Congo (Brazzaville)', 'CG', '+242', 'XAF', '🇨🇬', true)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, phone_code = EXCLUDED.phone_code, currency = EXCLUDED.currency, flag_emoji = EXCLUDED.flag_emoji;

-- Récupérer IDs et insérer villes et paiements du site
DO $$
DECLARE
  v_rdc_id uuid;
  v_cg_id uuid;
BEGIN
  SELECT id INTO v_rdc_id FROM public.countries WHERE code = 'RDC';
  SELECT id INTO v_cg_id FROM public.countries WHERE code = 'CG';

  -- Villes RDC (Kinshasa, Lubumbashi, Goma, Bukavu, Kananga, Mbuji-Mayi, Kisangani, Kolwezi, Matadi)
  IF v_rdc_id IS NOT NULL THEN
    INSERT INTO public.cities (country_id, name, is_active) VALUES
      (v_rdc_id, 'Kinshasa', true),
      (v_rdc_id, 'Lubumbashi', true),
      (v_rdc_id, 'Goma', true),
      (v_rdc_id, 'Bukavu', true),
      (v_rdc_id, 'Kananga', true),
      (v_rdc_id, 'Mbuji-Mayi', true),
      (v_rdc_id, 'Kisangani', true),
      (v_rdc_id, 'Kolwezi', true),
      (v_rdc_id, 'Matadi', true)
    ON CONFLICT (country_id, name) DO NOTHING;

    -- Paiements RDC
    INSERT INTO public.payment_methods (country_id, city_id, name, code, provider, icon_name, instructions, fees_percentage, processing_time, is_active) VALUES
      (v_rdc_id, NULL, 'M-Pesa Vodacom', 'mpesa', 'Vodacom', 'Wallet', 'Payez via Vodacom M-Pesa (*1122#)', 2.0, 'Instantane', true),
      (v_rdc_id, NULL, 'Orange Money', 'orange_money', 'Orange', 'Wallet', 'Payez via Orange Money (*144#)', 1.5, 'Instantane', true),
      (v_rdc_id, NULL, 'Airtel Money', 'airtel_money', 'Airtel', 'Wallet', 'Payez via Airtel Money (*501#)', 1.5, 'Instantane', true),
      (v_rdc_id, NULL, 'Afrimoney', 'afrimoney', 'Africell', 'Wallet', 'Payez via Afrimoney (*111#)', 1.5, 'Instantane', true),
      (v_rdc_id, NULL, 'Carte Visa', 'visa_card', 'Visa / Banque', 'CreditCard', 'Payez par Carte de crédit ou débit Visa', 3.5, '2-5 minutes', true),
      (v_rdc_id, NULL, 'Mastercard', 'mastercard', 'Mastercard', 'CreditCard', 'Payez par Carte Mastercard', 3.5, '2-5 minutes', true),
      (v_rdc_id, NULL, 'Equity Bank', 'equity_bank', 'Equity Bank', 'Building2', 'Virement depuis votre compte Equity Bank RDC', 1.0, '1-3 jours', true),
      (v_rdc_id, NULL, 'Rawbank', 'rawbank', 'Rawbank', 'Building2', 'Virement depuis votre compte Rawbank', 1.0, '1-3 jours', true),
      (v_rdc_id, NULL, 'TMB', 'tmb', 'Trust Merchant Bank', 'Building2', 'Virement depuis votre compte TMB', 1.2, '1-3 jours', true),
      (v_rdc_id, NULL, 'Paiement au Guichet (Cash)', 'cash', 'Agence', 'Banknote', 'Règlement en espèces au guichet de l''agence', 0.0, 'Instantane', true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Villes Congo-Brazza (Brazzaville, Pointe-Noire, Dolisie)
  IF v_cg_id IS NOT NULL THEN
    INSERT INTO public.cities (country_id, name, is_active) VALUES
      (v_cg_id, 'Brazzaville', true),
      (v_cg_id, 'Pointe-Noire', true),
      (v_cg_id, 'Dolisie', true)
    ON CONFLICT (country_id, name) DO NOTHING;

    -- Paiements Congo-Brazza
    INSERT INTO public.payment_methods (country_id, city_id, name, code, provider, icon_name, instructions, fees_percentage, processing_time, is_active) VALUES
      (v_cg_id, NULL, 'MTN Mobile Money', 'mtn_money', 'MTN', 'Wallet', 'Payez via MTN MoMo Congo (*105#)', 1.5, 'Instantane', true),
      (v_cg_id, NULL, 'Airtel Money Congo', 'airtel_money', 'Airtel', 'Wallet', 'Payez via Airtel Money Congo (*128#)', 1.5, 'Instantane', true),
      (v_cg_id, NULL, 'Paiement au Guichet (Cash)', 'cash', 'Agence', 'Banknote', 'Règlement en espèces à la gare routière', 0.0, 'Instantane', true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
