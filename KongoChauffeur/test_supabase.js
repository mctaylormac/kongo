const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://yzsujxyltodcoynkqxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6c3VqeHlsdG9kY295bmtxeHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTMyMDgsImV4cCI6MjA4NDQ4OTIwOH0.iyX6w0JudoC7vmrcM8HN7S5pQTOy9q8-AkcQWVISD1M';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testQuery() {
  const { data, error } = await supabase.from('ticket_scans').select('*').limit(1);
  console.log("Error:", error);
  if (data && data.length > 0) {
    console.log("First row keys:", Object.keys(data[0]));
    console.log("First row data:", JSON.stringify(data[0], null, 2));
  } else {
    console.log("No data found in ticket_scans");
  }
}

testQuery();
