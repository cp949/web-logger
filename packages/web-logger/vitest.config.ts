import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    pool: 'vmThreads',
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/WebLogger.types.test.ts' // Type-only test file
    ],
    // environmentMatchGlobs는 Vitest에 존재하지만 타입 정의가 아직 업데이트되지 않음
    // @ts-expect-error - Vitest 4.0에서 지원하지만 타입 정의 누락
    environmentMatchGlobs: [
      ['**/ssr.test.ts', 'node'],
      ['**/ssr.*.test.ts', 'node'],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '*.config.ts',
        '*.config.js',
        'tests/**/*.test.ts',
        'tests/**/*.spec.ts'
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
