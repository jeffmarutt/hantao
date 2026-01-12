
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    server: {
      host: true
    },
    define: {
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
    }
  };
});
