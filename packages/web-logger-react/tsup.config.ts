import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
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
});
