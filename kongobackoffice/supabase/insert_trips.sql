-- Ce script ajoute 20 trajets fictifs pour KonGO
-- Il utilise les UUIDs des agences et des villes existantes dans la base de données.

DO $$
DECLARE
    -- Agences
    kongo_premium UUID := 'b82f0660-3631-4d62-8298-5b91a5639a69';
    express_congo UUID := '4b02b3cc-5ec0-4330-8a88-ba755560bcbd';
    virunga_express UUID := 'b770bdff-13db-4d92-8677-a09865a086f2';
    atlantic_express UUID := '3041b40c-9061-4354-b89c-bd8fef13ffea';
    congo_rail UUID := 'eb9f9373-fed3-48d2-85b4-ffb8c55a4c10';

    -- Villes
    kinshasa UUID := '36719a4f-78c0-4b9c-8a32-583d5588a7b0';
    lubumbashi UUID := 'd9abbd26-92ab-4cd2-9c73-7f9d6c688e2c';
    goma UUID := '43e6548b-2187-4645-ad03-bc7fdbc41c5a';
    matadi UUID := '1acf8106-8e09-4a67-b9ea-bd568c4ecd5f';
    muanda UUID := '1baf1a18-3550-4460-b6a8-b55ac2e6870d';

    d1 TIMESTAMP WITH TIME ZONE := NOW() + interval '1 day';
    d2 TIMESTAMP WITH TIME ZONE := NOW() + interval '2 days';
    d3 TIMESTAMP WITH TIME ZONE := NOW() + interval '3 days';
    d4 TIMESTAMP WITH TIME ZONE := NOW() + interval '4 days';
BEGIN
    INSERT INTO public.trips (agency_id, origin_location_id, destination_location_id, departure_time, arrival_time, price, vehicle_type, bus_type, amenities, total_seats, seats_available, status, is_popular, duration)
    VALUES
    -- Kinshasa -> Matadi (Bus)
    (express_congo, kinshasa, matadi, d1 + interval '08:00', d1 + interval '13:00', 35000, 'bus', 'VIP', ARRAY['WiFi', 'Climatisation', 'Prises USB'], 45, 45, 'scheduled', true, '5h 00m'),
    (kongo_premium, kinshasa, matadi, d1 + interval '10:00', d1 + interval '15:30', 25000, 'bus', 'Classique', ARRAY['Climatisation'], 60, 60, 'scheduled', false, '5h 30m'),
    (express_congo, matadi, kinshasa, d2 + interval '07:30', d2 + interval '12:30', 35000, 'bus', 'VIP', ARRAY['WiFi', 'Climatisation', 'Prises USB'], 45, 40, 'scheduled', true, '5h 00m'),
    (atlantic_express, kinshasa, matadi, d3 + interval '09:00', d3 + interval '14:00', 32000, 'bus', 'VIP', ARRAY['Climatisation', 'Toilettes'], 50, 50, 'scheduled', false, '5h 00m'),

    -- Kinshasa -> Muanda (Bus)
    (atlantic_express, kinshasa, muanda, d1 + interval '06:00', d1 + interval '16:00', 65000, 'bus', 'VIP', ARRAY['WiFi', 'Climatisation', 'TV', 'Repas'], 40, 25, 'scheduled', true, '10h 00m'),
    (kongo_premium, muanda, kinshasa, d2 + interval '06:00', d2 + interval '16:00', 55000, 'bus', 'VIP', ARRAY['Climatisation', 'Repas'], 50, 48, 'scheduled', false, '10h 00m'),
    (atlantic_express, kinshasa, muanda, d4 + interval '07:00', d4 + interval '17:30', 60000, 'bus', 'Classique', ARRAY['Climatisation'], 60, 60, 'scheduled', true, '10h 30m'),

    -- Kinshasa -> Lubumbashi (Bus)
    (express_congo, kinshasa, lubumbashi, d1 + interval '05:00', d2 + interval '20:00', 120000, 'bus', 'VIP', ARRAY['WiFi', 'Climatisation', 'Prises USB', 'Toilettes'], 40, 15, 'scheduled', true, '39h 00m'),
    (kongo_premium, lubumbashi, kinshasa, d1 + interval '05:00', d2 + interval '21:00', 110000, 'bus', 'Classique', ARRAY['Climatisation', 'Repas'], 50, 45, 'scheduled', false, '40h 00m'),
    (express_congo, kinshasa, lubumbashi, d3 + interval '06:00', d4 + interval '21:00', 120000, 'bus', 'VIP', ARRAY['WiFi', 'Climatisation', 'Prises USB', 'Toilettes'], 40, 40, 'scheduled', true, '39h 00m'),

    -- Kinshasa -> Goma
    (virunga_express, kinshasa, goma, d1 + interval '04:00', d3 + interval '10:00', 150000, 'bus', 'VIP', ARRAY['WiFi', 'Climatisation', 'Toilettes'], 45, 12, 'scheduled', true, '54h 00m'),
    (virunga_express, goma, kinshasa, d2 + interval '04:00', d4 + interval '10:00', 150000, 'bus', 'VIP', ARRAY['WiFi', 'Climatisation', 'Toilettes'], 45, 40, 'scheduled', false, '54h 00m'),

    -- Lubumbashi -> Goma
    (virunga_express, lubumbashi, goma, d1 + interval '07:00', d2 + interval '18:00', 95000, 'bus', 'VIP', ARRAY['Climatisation', 'Repas'], 50, 50, 'scheduled', true, '35h 00m'),
    (virunga_express, goma, lubumbashi, d2 + interval '07:00', d3 + interval '18:00', 95000, 'bus', 'VIP', ARRAY['Climatisation', 'Repas'], 50, 30, 'scheduled', false, '35h 00m'),

    -- Des Trains (Kinshasa -> Matadi)
    (congo_rail, kinshasa, matadi, d1 + interval '08:30', d1 + interval '16:30', 15000, 'train', NULL, ARRAY['Wagon Restaurant'], 200, 180, 'scheduled', false, '8h 00m'),
    (congo_rail, matadi, kinshasa, d2 + interval '09:00', d2 + interval '17:00', 15000, 'train', NULL, ARRAY['Wagon Restaurant'], 200, 150, 'scheduled', false, '8h 00m'),

    -- Des Trains (Lubumbashi -> Kinshasa)
    (congo_rail, lubumbashi, kinshasa, d1 + interval '06:00', d4 + interval '12:00', 85000, 'train', NULL, ARRAY['Couchettes', 'Wagon Restaurant'], 150, 100, 'scheduled', true, '78h 00m'),
    (congo_rail, kinshasa, lubumbashi, d3 + interval '06:00', d3 + interval '12:00' + interval '3 days', 85000, 'train', NULL, ARRAY['Couchettes', 'Wagon Restaurant'], 150, 140, 'scheduled', true, '78h 00m'),
    
    -- Autres bus locaux
    (kongo_premium, kinshasa, matadi, d4 + interval '12:00', d4 + interval '17:00', 30000, 'bus', 'VIP', ARRAY['WiFi'], 40, 40, 'scheduled', false, '5h 00m'),
    (express_congo, matadi, kinshasa, d4 + interval '14:00', d4 + interval '19:00', 35000, 'bus', 'VIP', ARRAY['WiFi', 'Climatisation'], 45, 20, 'scheduled', true, '5h 00m');

END $$;
