const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking companies...");
  const { data: companies, error: errC } = await supabase.from('companies').select('*').limit(1);
  console.log("companies error:", errC?.message || "none");
  
  console.log("Checking tickets...");
  const { data: tickets, error: errT } = await supabase.from('tickets').select('*').limit(1);
  console.log("tickets error:", errT?.message || "none");

  console.log("Checking bookings...");
  const { data: bookings, error: errB } = await supabase.from('bookings').select('*').limit(1);
  console.log("bookings error:", errB?.message || "none");

  console.log("Checking agencies...");
  const { data: agencies, error: errA } = await supabase.from('agencies').select('*').limit(1);
  console.log("agencies error:", errA?.message || "none");
}

check();
