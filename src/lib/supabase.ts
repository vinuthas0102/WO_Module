import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { getEnvironmentMode } from './environment';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const createSupabaseClient = () => {
  try {
    if (getEnvironmentMode() !== 'database') {
      return null;
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase credentials not found, falling back to demo mode');
      return null;
    }

    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'x-application-name': 'tracksphere'
        }
      }
    });
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
};

export const supabase = createSupabaseClient();

// Check if Supabase is available
export const isSupabaseAvailable = (): boolean => {
  return supabase !== null;
};

export const setUserContext = async (userId: string | null) => {
  if (!supabase || !userId) return;

  try {
    await supabase.rpc('exec', {
      sql: `SET LOCAL app.current_user_id = '${userId}'`
    }).catch(() => {
      console.warn('Could not set user context via RPC, using alternative method');
    });
  } catch (error) {
    console.warn('Failed to set user context:', error);
  }
};

export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  if (error?.message) {
    throw new Error(error.message);
  }
  throw new Error('An unexpected database error occurred');
};