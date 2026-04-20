import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', '.next', 'dist'],
    passWithNoTests: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
