-- Ajout de données de démonstration pour les résultats de recherche
-- Ce script ajoute des trajets qui correspondent aux mockTrips de SearchResults.tsx

-- 1. Liaisons avec les agences et localisations (Hypothèse: elles existent déjà via seed.sql)

-- Insertion de trajets supplémentaires pour enrichir la recherche
INSERT INTO public.trips (
    agency_id, origin_location_id, destination_location_id, 
    departure_time, arrival_time, price, 
    vehicle_type, bus_type, total_seats, seats_available, 
    amenities, status
)
SELECT 
    a.id, l1.id, l2.id, 
    CURRENT_DATE + INTERVAL '1 day' + TIME '06:00:00',
    CURRENT_DATE + INTERVAL '1 day' + TIME '22:00:00',
    125000, 'bus', 'VIP', 50, 12, 
    ARRAY['wifi', 'ac', 'charging', 'meals'], 'scheduled'
FROM public.agencies a, public.locations l1, public.locations l2 
WHERE a.name = 'Express Congo' AND l1.name = 'Kinshasa' AND l2.name = 'Lubumbashi'
UNION ALL
SELECT 
    a.id, l1.id, l2.id, 
    CURRENT_DATE + INTERVAL '1 day' + TIME '08:30:00',
    CURRENT_DATE + INTERVAL '2 days' + TIME '01:30:00',
    98000, 'bus', 'Standard', 45, 8, 
    ARRAY['ac', 'charging'], 'scheduled'
FROM public.agencies a, public.locations l1, public.locations l2 
WHERE a.name = 'Express Congo' AND l1.name = 'Kinshasa' AND l2.name = 'Lubumbashi'
UNION ALL
SELECT 
    a.id, l1.id, l2.id, 
    CURRENT_DATE + INTERVAL '1 day' + TIME '14:00:00',
    CURRENT_DATE + INTERVAL '2 days' + TIME '07:00:00',
    135000, 'bus', 'Luxury', 52, 0, 
    ARRAY['wifi', 'ac', 'charging', 'meals', 'entertainment'], 'scheduled'
FROM public.agencies a, public.locations l1, public.locations l2 
WHERE a.name = 'Virunga Express' AND l1.name = 'Kinshasa' AND l2.name = 'Lubumbashi'
UNION ALL
SELECT 
    a.id, l1.id, l2.id, 
    CURRENT_DATE + INTERVAL '1 day' + TIME '07:00:00',
    CURRENT_DATE + INTERVAL '1 day' + TIME '19:30:00',
    95000, 'train', 'Express Minier', 120, 24, 
    ARRAY['ac', 'meals', 'sleeping', 'observation'], 'scheduled'
FROM public.agencies a, public.locations l1, public.locations l2 
WHERE a.name = 'Congo Rail Express' AND l1.name = 'Kinshasa' AND l2.name = 'Lubumbashi'
UNION ALL
SELECT 
    a.id, l1.id, l2.id, 
    CURRENT_DATE + INTERVAL '1 day' + TIME '06:30:00',
    CURRENT_DATE + INTERVAL '1 day' + TIME '10:45:00',
    45000, 'train', 'Express Côtier', 80, 32, 
    ARRAY['ac', 'wifi', 'charging', 'observation'], 'scheduled'
FROM public.agencies a, public.locations l1, public.locations l2 
WHERE a.name = 'Congo Rail Express' AND l1.name = 'Kinshasa' AND l2.name = 'Matadi';
