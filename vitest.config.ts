import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '*.config.ts',
        '*.config.js',
        'src/**/*.test.ts',
        'src/**/*.spec.ts'
      ],
      thresholds: {
        statements: 58,
        branches: 48,
        functions: 66,
        lines: 60
      }
    }
  }
});