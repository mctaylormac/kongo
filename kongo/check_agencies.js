const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://yzsujxyltodcoynkqxsv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6c3VqeHlsdG9kY295bmtxeHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTMyMDgsImV4cCI6MjA4NDQ4OTIwOH0.iyX6w0JudoC7vmrcM8HN7S5pQTOy9q8-AkcQWVISD1M";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('agencies').select('*').limit(5);
  console.log('agencies:', data);
  if (error) console.error(error);
}

check();
