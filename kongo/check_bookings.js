const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      trips (
        *,
        agencies (name, logo_url),
        origin:locations!origin_location_id (name),
        destination:locations!destination_location_id (name)
      )
    `)
    .limit(3);

  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log("Bookings structure:", JSON.stringify(data, null, 2));
}

check();
