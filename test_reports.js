const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yzsujxyltodcoynkqxsv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6c3VqeHlsdG9kY295bmtxeHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTMyMDgsImV4cCI6MjA4NDQ4OTIwOH0.iyX6w0JudoC7vmrcM8HN7S5pQTOy9q8-AkcQWVISD1M'
);

async function test() {
  // Login as agency
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'meji@gmail.com',
    password: 'n12345678' 
  });
  
  if (authErr) {
    console.log("Login failed", authErr.message);
    return;
  }
  
  console.log("Logged in!");
  
  const { data, error } = await supabase
    .from('driver_reports')
    .select('*, profiles(full_name, phone_number)')
    .eq('agency_id', '35cfba1c-2ef5-4ff0-89f3-e10c924637b3')
    .order('created_at', { ascending: false });
    
  console.log('Join Data:', JSON.stringify(data, null, 2));
  console.log('Join Error:', error);
}

test();
