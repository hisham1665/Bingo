import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ztzbbtohtkayrvlcygwi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0emJidG9odGtheXJ2bGN5Z3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzI0MTQsImV4cCI6MjA3NzUwODQxNH0.2EUB0NqAt27ukDxHjFgDxbPpKGM6hI7k3tK7wZsCgfo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
