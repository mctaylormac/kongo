-- ============================================================
-- Migration: Ajouter colonnes country et country_code à la table agencies
-- ============================================================

ALTER TABLE public.agencies 
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'République Démocratique du Congo',
  ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'RDC';

-- Mettre à jour les agences existantes qui n'ont pas de pays spécifié
UPDATE public.agencies 
SET country = 'République Démocratique du Congo', country_code = 'RDC' 
WHERE country IS NULL OR country_code IS NULL;
