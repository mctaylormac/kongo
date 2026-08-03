// [Agent Supabase] - Action: Supabase client config for Kongo Chauffeur mobile app
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://yzsujxyltodcoynkqxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6c3VqeHlsdG9kY295bmtxeHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MTMyMDgsImV4cCI6MjA4NDQ4OTIwOH0.iyX6w0JudoC7vmrcM8HN7S5pQTOy9q8-AkcQWVISD1M';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
