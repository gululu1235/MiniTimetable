
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/MiniTimetable/', // Critical for GitHub Pages subdirectory deployment
  build: {
    outDir: 'dist',
  },
});
