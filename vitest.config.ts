import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  root: import.meta.dirname,
  // Unit tests must never read from or write to the production Supabase project.
  define: {
    'import.meta.env.VITE_ENABLE_DEMO_MODE': JSON.stringify('true'),
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'supabase/functions/_shared/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/utils/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
        branches: 70,
      },
    },
  },
});
