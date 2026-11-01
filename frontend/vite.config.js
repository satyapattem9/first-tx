import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Allow importing ../shared/lessons.json from outside the frontend folder.
  server: { port: 5173, fs: { allow: ['..'] } },
  define: { global: 'globalThis' },
});
