-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- USERS / PROFILES (extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  phone_number text,
  city text,
  date_of_birth date,
  avatar_url text,
  role text default 'client',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- AGENCIES (Transport Operators)
create table public.agencies (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  logo_url text,
  contact_email text,
  contact_phone text,
  address text,
  rating numeric(3,2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BUSES (Fleet Management)
create table public.buses (
  id uuid default uuid_generate_v4() primary key,
  agency_id uuid references public.agencies(id) on delete cascade not null,
  name text not null,
  type text not null, -- e.g., 'Luxury Coach', 'Mini-bus'
  plate_number text unique not null,
  capacity integer not null,
  status text default 'active' check (status in ('active', 'maintenance', 'retired')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- LOCATIONS (Cities/Stops)
create table public.locations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  region text,
  country text default 'RDC',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- TRIPS (Routes & Schedules)
create table public.trips (
  id uuid default uuid_generate_v4() primary key,
  agency_id uuid references public.agencies(id) not null,
  origin_location_id uuid references public.locations(id) not null,
  destination_location_id uuid references public.locations(id) not null,
  departure_time timestamp with time zone not null,
  arrival_time timestamp with time zone not null,
  price numeric(10,2) not null,
  currency text default 'CDF',
  vehicle_type text check (vehicle_type in ('bus', 'train')),
  bus_type text, -- e.g., 'Luxury Coach'
  train_class text, -- e.g., 'economy', 'business'
  amenities text[], -- Array of strings e.g. ['WiFi', 'AC']
  total_seats integer not null,
  seats_available integer not null,
  status text default 'scheduled' check (status in ('scheduled', 'delayed', 'cancelled', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BOOKINGS
create table public.bookings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id), -- Nullable for guest checkouts if needed, but usually linked to auth
  trip_id uuid references public.trips(id) not null,
  passenger_count integer default 1,
  total_price numeric(10,2) not null,
  currency text default 'CDF',
  status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  booking_code text unique not null, -- e.g., KG123456
  contact_email text,
  contact_phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BOOKING SEATS (Many-to-Many link for specific seats)
create table public.booking_seats (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references public.bookings(id) on delete cascade not null,
  seat_number text not null,
  seat_type text default 'standard',
  price numeric(10,2) not null
);

-- FAVORITES
create table public.favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  origin_location_id uuid references public.locations(id) not null,
  destination_location_id uuid references public.locations(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, origin_location_id, destination_location_id)
);

-- RLS POLICIES (Basic Setup)

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.favorites enable row level security;

-- Profiles: Users can view and update their own profile
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Bookings: Users can view their own bookings
create policy "Users can view own bookings" on public.bookings for select using (auth.uid() = user_id);
create policy "Users can insert own bookings" on public.bookings for insert with check (auth.uid() = user_id);

-- Favorites: Users can manage their own favorites
create policy "Users can manage own favorites" on public.favorites for all using (auth.uid() = user_id);

alter table public.trips enable row level security;
create policy "Trips are viewable by everyone" on public.trips for select using (true);
create policy "Admins can manage trips" on public.trips for all using (true); -- Simplified for now, should check role

alter table public.buses enable row level security;
create policy "Buses are viewable by everyone" on public.buses for select using (true);
create policy "Admins can manage buses" on public.buses for all using (true);

alter table public.agencies enable row level security;
create policy "Agencies are viewable by everyone" on public.agencies for select using (true);
create policy "Admins can manage agencies" on public.agencies for all using (true);

alter table public.locations enable row level security;
create policy "Locations are viewable by everyone" on public.locations for select using (true);
create policy "Admins can manage locations" on public.locations for all using (true);

-- TRIGGER for New User Profile
-- Automatically create a profile entry when a new user signs up via Supabase Auth
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, phone_number, city, date_of_birth, avatar_url)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'city',
    (new.raw_user_meta_data->>'date_of_birth')::date,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
