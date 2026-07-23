import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    'import.meta.env.VITE_APP_MODE': JSON.stringify('offline'),
    'import.meta.env.VITE_AUTH_MODE': JSON.stringify('database'),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(''),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(''),
    'import.meta.env.VITE_ENABLE_LOGGING': JSON.stringify('false'),
  },
  resolve: {
    alias: {
      '@supabase/supabase-js': 'src/lib/mockSupabaseEmpty.ts',
    },
  },
  build: {
    outDir: 'dist-offline',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
});
