-- ============================================================
-- Migration: Vue popular_routes — Trajets les plus réservés
-- ============================================================
-- Calcule les 5 paires (départ, destination) ayant le plus
-- de réservations (confirmed/completed/pending).
-- Lisible par tous (anon + authenticated).
-- ============================================================

CREATE OR REPLACE VIEW public.popular_routes AS
SELECT
  loc_origin.name        AS origin_name,
  loc_dest.name          AS destination_name,
  COUNT(b.id)            AS booking_count,
  MIN(t.price)           AS min_price,
  t.duration             AS duration
FROM public.bookings b
JOIN public.trips t
  ON t.id = b.trip_id
JOIN public.locations loc_origin
  ON loc_origin.id = t.origin_location_id
JOIN public.locations loc_dest
  ON loc_dest.id = t.destination_location_id
WHERE b.status IN ('confirmed', 'completed', 'pending')
GROUP BY loc_origin.name, loc_dest.name, t.duration
ORDER BY booking_count DESC
LIMIT 5;

-- Accorder la lecture à l'app mobile (anon + authenticated)
GRANT SELECT ON public.popular_routes TO anon, authenticated;
