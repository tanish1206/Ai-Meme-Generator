import { createClient } from '@supabase/supabase-js';

// Reads config from Vite env. Define these in a .env file as:
// VITE_SUPABASE_URL=... 
// VITE_SUPABASE_ANON_KEY=...
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export interface MemeRow {
  id: string;
  image_url: string;
  top_text: string;
  bottom_text: string;
  author_id: string | null;
  created_at: string;
  reactions_count?: number;
}



