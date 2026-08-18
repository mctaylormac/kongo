-- [Agent Supabase] - Action: Création/Mise à jour des comptes de test (Méthode UPSERT robuste)

DO $$
DECLARE
    agency_uuid uuid := 'b82f0660-3631-4d62-8298-5b91a5639a69'; -- KonGO Premium
    admin_id uuid := '27810daa-56d2-4fac-9a22-ccc7ca9e9bee';
    manager_id uuid := '5ef72789-ff5c-4893-b1c7-7f1e4a814923';
    chauffeur_id uuid := 'e71f0610-53ae-4b83-ae96-d789492cdfd0';
BEGIN

    -- 1. Mise à jour ou Insertion Superuser
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (admin_id, 'admin@kongo.cd', 'Admin KonGO', 'superuser')
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email, 
        full_name = EXCLUDED.full_name, 
        role = EXCLUDED.role;

    -- 2. Mise à jour ou Insertion Agence
    INSERT INTO public.profiles (id, email, full_name, role, agency_id)
    VALUES (manager_id, 'contact@kongo-premium.cd', 'Manager KonGO Premium', 'agency', agency_uuid)
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email, 
        full_name = EXCLUDED.full_name, 
        role = EXCLUDED.role,
        agency_id = EXCLUDED.agency_id;

    -- 3. Mise à jour ou Insertion Profil Chauffeur
    INSERT INTO public.profiles (id, email, full_name, role, agency_id)
    VALUES (chauffeur_id, 'jmamba@kongo.cd', 'Jean Mamba', 'driver', agency_uuid)
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email, 
        full_name = EXCLUDED.full_name, 
        role = EXCLUDED.role,
        agency_id = EXCLUDED.agency_id;

    -- 4. Mise à jour ou Insertion Table Drivers
    -- Attention: On s'assure que la contrainte d'unicité sur `user_id` est utilisée
    -- ou on supprime puis on recrée si la contrainte pkey n'est pas sur user_id.
    -- Par sécurité, on supprime puis on insère :
    DELETE FROM public.drivers WHERE user_id = chauffeur_id;
    INSERT INTO public.drivers (user_id, agency_id, full_name, phone, status)
    VALUES (chauffeur_id, agency_uuid, 'Jean Mamba', '+243 810 000 000', 'active');

    RAISE NOTICE 'Comptes de test mis à jour avec succès via UPSERT (ON CONFLICT).';
END $$;
