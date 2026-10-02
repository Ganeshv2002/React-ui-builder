import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', 'server/**'],
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
    globals: true,
    css: false,
  },
});
