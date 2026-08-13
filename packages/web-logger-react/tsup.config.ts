import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    compilerOptions: {
      // tsup DTS 번들링이 TS 6에서 baseUrl을 내부 주입한다.
      ignoreDeprecations: '6.0',
    },
  },
  splitting: false,
  sourcemap: true,
  clean: !options.watch,
  treeshake: {
    preset: 'smallest',
  },
  minify: false,
  target: 'es2020',
  outDir: 'dist',
  platform: 'browser',
  external: ['react', 'react-dom', '@cp949/web-logger'],
  bundle: true,
  tsconfig: './tsconfig.json',
}));
