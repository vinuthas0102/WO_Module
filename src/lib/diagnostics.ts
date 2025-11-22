export const runDiagnostics = () => {
  const results = {
    environment: {
      isDev: import.meta.env.DEV,
      mode: import.meta.env.MODE,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'configured' : 'missing',
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'configured' : 'missing',
    },
    browser: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      online: navigator.onLine,
    },
    storage: {
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
    },
    timestamp: new Date().toISOString(),
  };

  console.group('Application Diagnostics');
  console.table(results.environment);
  console.table(results.browser);
  console.table(results.storage);
  console.log('Timestamp:', results.timestamp);
  console.groupEnd();

  return results;
};

export const checkDatabaseConnection = async () => {
  try {
    const { supabase } = await import('./supabase');

    if (!supabase) {
      return {
        status: 'disconnected',
        message: 'Supabase client not initialized (demo mode)',
      };
    }

    const { data, error } = await supabase
      .from('modules')
      .select('id, name')
      .limit(1);

    if (error) {
      return {
        status: 'error',
        message: error.message,
        error,
      };
    }

    return {
      status: 'connected',
      message: 'Database connection successful',
      moduleCount: data?.length || 0,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      error,
    };
  }
};

export default {
  runDiagnostics,
  checkDatabaseConnection,
};
