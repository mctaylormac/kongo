-- SEED DATA FOR KONGO PLATFORM

-- Insert Locations
INSERT INTO public.locations (name, region) VALUES
('Kinshasa', 'Kinshasa'),
('Lubumbashi', 'Haut-Katanga'),
('Goma', 'Nord-Kivu'),
('Bukavu', 'Sud-Kivu'),
('Matadi', 'Kongo Central'),
('Boma', 'Kongo Central'),
('Muanda', 'Kongo Central'),
('Kisangani', 'Tshopo'),
('Kananga', 'Kasaï-Central'),
('Mbuji-Mayi', 'Kasaï-Oriental'),
('Kikwit', 'Kwilu'),
('Kolwezi', 'Lualaba'),
('Tshikapa', 'Kasaï');

-- Insert Agencies
INSERT INTO public.agencies (name, contact_email, contact_phone, address, rating) VALUES
('KonGO Premium', 'contact@kongo-premium.cd', '+243111222333', 'Avenue de la Gombe, Kinshasa', 4.9),
('Express Congo', 'info@express-congo.cd', '+243888777666', 'Grand Boulevard, Lubumbashi', 4.7),
('Virunga Express', 'support@virunga-express.cd', '+243999000111', 'Rue Mobutu, Goma', 4.8),
('Atlantic Express', 'bookings@atlantic-express.cd', '+243555444333', 'Route du Port, Matadi', 4.6),
('Congo Rail Express', 'info@congorail.cd', '+243222333444', 'Gare Centrale, Kinshasa', 4.5);

-- Insert Buses
INSERT INTO public.buses (agency_id, name, type, plate_number, capacity, status)
SELECT id, 'KonGO Luxury-01', 'Luxury Coach', 'KIN-2045-AB', 40, 'active' FROM public.agencies WHERE name = 'KonGO Premium'
UNION ALL
SELECT id, 'KonGO Express-05', 'Mini-bus', 'LUB-9921-AC', 28, 'active' FROM public.agencies WHERE name = 'KonGO Premium'
UNION ALL
SELECT id, 'Virunga Voyager-A', 'Coach', 'GOM-1102-BC', 45, 'active' FROM public.agencies WHERE name = 'Virunga Express'
UNION ALL
SELECT id, 'Atlantic Coastal-01', 'Luxury Coach', 'MAT-8832-AD', 40, 'active' FROM public.agencies WHERE name = 'Atlantic Express'
UNION ALL
SELECT id, 'Express Kasaï-G0', 'Coach', 'KIN-1122-XY', 50, 'maintenance' FROM public.agencies WHERE name = 'Express Congo';

-- Insert Trips
INSERT INTO public.trips (agency_id, origin_location_id, destination_location_id, departure_time, arrival_time, price, vehicle_type, bus_type, total_seats, seats_available, amenities)
SELECT 
    a.id, 
    l1.id, 
    l2.id, 
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day' + INTERVAL '16 hours',
    125000, 
    'bus', 
    'Luxury Coach', 
    40, 
    28, 
    ARRAY['WiFi', 'Climatisation', 'Repas', 'Toilettes']
FROM public.agencies a, public.locations l1, public.locations l2 
WHERE a.name = 'KonGO Premium' AND l1.name = 'Kinshasa' AND l2.name = 'Lubumbashi'
UNION ALL
SELECT 
    a.id, 
    l1.id, 
    l2.id, 
    NOW() + INTERVAL '2 days',
    NOW() + INTERVAL '2 days' + INTERVAL '8 hours',
    45000, 
    'bus', 
    'Standard', 
    28, 
    12, 
    ARRAY['Climatisation', 'Prises USB']
FROM public.agencies a, public.locations l1, public.locations l2 
WHERE a.name = 'Virunga Express' AND l1.name = 'Goma' AND l2.name = 'Bukavu'
UNION ALL
SELECT 
    a.id, 
    l1.id, 
    l2.id, 
    NOW() + INTERVAL '12 hours',
    NOW() + INTERVAL '16 hours',
    25000, 
    'bus', 
    'Coach', 
    50, 
    0, 
    ARRAY['WiFi', 'Climatisation']
FROM public.agencies a, public.locations l1, public.locations l2 
WHERE a.name = 'Express Congo' AND l1.name = 'Kinshasa' AND l2.name = 'Matadi';
