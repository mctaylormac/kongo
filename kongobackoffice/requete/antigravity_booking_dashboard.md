# Antigravity model request: booking not visible in agency dashboard

Goal
- Analyze why a booked ticket exists in DB but is not shown in AgencyDashboard for the related agency.
- Produce concrete fixes or DB changes.

Context (code references)
- Booking creation: src/components/PaymentFlow.tsx
- Agency dashboard query: src/components/admin/AgencyDashboard.tsx
- Trip creation (agency_id set from bus): src/components/admin/AdminForms.tsx
- Trip search and selection: src/components/SearchResults.tsx

Observed behavior
- Client can sign in, create account, book a ticket.
- Booking row exists in DB.
- Agency dashboard does not show the booking for that agency.

Most likely causes (ranked)
1) Join fails because the FK relationship between bookings.trip_id and trips.id is missing or named differently.
   - AgencyDashboard uses: bookings.select('*, trips!inner(agency_id), profiles(full_name)').eq('trips.agency_id', aid)
   - If FK is missing or relation name is not 'trips', the inner join returns 0 rows.

2) bookings.trip_id is null or not set for some bookings.
   - PaymentFlow inserts trip_id only if trip.id exists.
   - If the UI trip object lacks id (or uses a different field), the insert succeeds but trip_id is null.
   - Then the inner join filters the row out.

3) trips.agency_id is null or incorrect for the booked trip.
   - AddTripForm sets agency_id from selected bus.
   - If bus has null agency_id or the wrong agency, the booking will not match the agency filter.

4) RLS/policies block the join for agency users.
   - If agency users cannot SELECT from trips or bookings, the join can return empty even if rows exist.

Secondary issues (not causing invisibility but still issues)
- PaymentFlow writes booking_reference, AgencyDashboard expects booking_code for display.
- PaymentFlow sets payment_status = 'completed', AgencyDashboard revenue only counts 'paid'.

Data checks (run in Supabase SQL editor)
1) Confirm booking has trip_id
   select id, trip_id, profile_id, created_at, booking_reference from bookings order by created_at desc limit 20;

2) Confirm trip has agency_id
   select id, agency_id, status from trips where id in (
     select trip_id from bookings order by created_at desc limit 20
   );

3) Validate FK relation exists
   select
     tc.constraint_name, kcu.column_name, ccu.table_name as foreign_table, ccu.column_name as foreign_column
   from information_schema.table_constraints tc
   join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name
   join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name
   where tc.constraint_type = 'FOREIGN KEY' and tc.table_name = 'bookings';

4) Test the exact AgencyDashboard query
   select b.*
   from bookings b
   join trips t on t.id = b.trip_id
   where t.agency_id = '<agency_id>'
   order by b.created_at desc
   limit 20;

5) Check RLS (if enabled)
   - Inspect RLS policies on bookings and trips for agency users.
   - Make sure agency users can SELECT bookings for trips with their agency_id.

Code-level verification tasks
1) Verify PaymentFlow passes a real DB trip id
   - In SearchResults, mapped trip uses id: trip.id (from Supabase). Confirm this is passed to PaymentFlow as trip.id.

2) Confirm bookings table column names
   - If table uses booking_code but code inserts booking_reference, update insert or add a trigger.

Fix options (pick the minimal, correct one)
Option A: Fix the join by ensuring a proper FK name in the select
- If relationship name is not 'trips', change AgencyDashboard select to:
  select('*, trips:trip_id!inner(agency_id), profiles(full_name)')

Option B: Store agency_id directly on bookings and filter by it
- Add agency_id column on bookings and set it on insert.
- Update query to filter bookings.agency_id = aid (no join needed).

Option C: Ensure trip_id is always set at booking creation
- Enforce non-null trip_id on bookings and validate before insert.
- Add UI guard: if (!trip?.id) block payment and show error.

Option D: Fix RLS to allow agency read
- Allow SELECT from bookings where bookings.trip_id -> trips.agency_id == auth.user().agency_id

Expected outcome
- Agency dashboard shows the booking within seconds of creation.
- Realtime channel insert also triggers and updates the list.

Deliverables
- A short report of which root cause is confirmed.
- The minimal code or SQL changes to resolve it.
