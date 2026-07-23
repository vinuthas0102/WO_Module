// Environment detection and configuration
export const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return !!(url && key && url !== 'your_supabase_project_url' && key !== 'your_supabase_anon_key');
};

export const getEnvironmentMode = (): 'database' | 'demo' | 'offline' => {
  // Check for explicit app mode first
  const appMode = import.meta.env.VITE_APP_MODE;
  if (appMode === 'demo' || appMode === 'database' || appMode === 'offline') {
    return appMode as 'database' | 'demo' | 'offline';
  }
  
  // Fall back to auto-detection
  return isSupabaseConfigured() ? 'database' : 'demo';
};

export const getAuthMode = (): 'database' | 'mock' => {
  // Check for explicit auth mode
  const authMode = import.meta.env.VITE_AUTH_MODE;
  if (authMode === 'mock' || authMode === 'database') {
    return authMode as 'database' | 'mock';
  }

  // Offline mode uses database auth (queries the mock Supabase client)
  if (getEnvironmentMode() === 'offline') return 'database';

  // Default to same as environment mode
  return getEnvironmentMode() === 'database' ? 'database' : 'mock';
};

export const getEnvironmentConfig = () => {
  const mode = getEnvironmentMode();
  const authMode = getAuthMode();
  return {
    mode,
    authMode,
    isDatabaseMode: mode === 'database',
    isDemoMode: mode === 'demo',
    isOfflineMode: mode === 'offline',
    isMockAuth: authMode === 'mock',
    isDatabaseAuth: authMode === 'database',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY
  };
};
