const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // Query information_schema.tables using a REST call or RPC.
  // Since we don't have RPC for this, we can try querying the GraphQL endpoint, or just fetching common tables.
  const tables = ['reservations', 'orders', 'sales', 'journeys', 'trips', 'locations', 'bus_locations', 'users', 'profiles'];
  for (const t of tables) {
    const { error } = await supabase.from(t).select('*').limit(1);
    console.log(`Table ${t}:`, error?.message || "EXISTS");
  }
}

check();
