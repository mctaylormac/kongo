-- ============================================================
-- Migration: Function to cascade delete agency and all related data
-- ============================================================

-- rendre agency_id optionnel sur drivers et profiles si nécessaire
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'drivers' AND column_name = 'agency_id') THEN
    ALTER TABLE public.drivers ALTER COLUMN agency_id DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'agency_id') THEN
    ALTER TABLE public.profiles ALTER COLUMN agency_id DROP NOT NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.delete_agency_cascade(p_agency_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trip_ids UUID[];
  v_booking_ids UUID[];
BEGIN
  -- 1. Récupérer tous les trip_ids de cette agence
  SELECT ARRAY_AGG(id) INTO v_trip_ids FROM public.trips WHERE agency_id = p_agency_id;

  IF v_trip_ids IS NOT NULL AND array_length(v_trip_ids, 1) > 0 THEN
    -- 2. Récupérer tous les booking_ids de ces voyages
    SELECT ARRAY_AGG(id) INTO v_booking_ids FROM public.bookings WHERE trip_id = ANY(v_trip_ids);

    IF v_booking_ids IS NOT NULL AND array_length(v_booking_ids, 1) > 0 THEN
      DELETE FROM public.ticket_scans WHERE booking_id = ANY(v_booking_ids);
      DELETE FROM public.booking_passengers WHERE booking_id = ANY(v_booking_ids);
      DELETE FROM public.payments WHERE booking_id = ANY(v_booking_ids);
      DELETE FROM public.bookings WHERE trip_id = ANY(v_trip_ids);
    END IF;

    DELETE FROM public.trip_reviews WHERE trip_id = ANY(v_trip_ids);
    DELETE FROM public.incidents WHERE trip_id = ANY(v_trip_ids);
    DELETE FROM public.driver_assignments WHERE trip_id = ANY(v_trip_ids);
    DELETE FROM public.trips WHERE agency_id = p_agency_id;
  END IF;

  -- 3. Supprimer les chauffeurs et rapports liés à l'agence
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'driver_reports') THEN
    DELETE FROM public.driver_reports WHERE agency_id = p_agency_id;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'drivers') THEN
    DELETE FROM public.drivers WHERE agency_id = p_agency_id;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff') THEN
    DELETE FROM public.staff WHERE agency_id = p_agency_id;
  END IF;

  -- 4. Supprimer les dépendances directes de l'agence
  DELETE FROM public.buses WHERE agency_id = p_agency_id;
  DELETE FROM public.agency_reviews WHERE agency_id = p_agency_id;
  DELETE FROM public.extra_services WHERE agency_id = p_agency_id;
  DELETE FROM public.notifications WHERE agency_id = p_agency_id;

  -- 5. Détacher les utilisateurs/profiles associés à cette agence
  UPDATE public.profiles SET agency_id = NULL WHERE agency_id = p_agency_id;

  -- 6. Supprimer l'agence
  DELETE FROM public.agencies WHERE id = p_agency_id;
END;
$$;
