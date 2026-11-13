import { defineConfig } from 'tsdown';

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // package.json의 exports(index.js / index.cjs)와 파일명을 맞춘다
  fixedExtension: false,
  dts: true,
  sourcemap: true,
  clean: !options.watch,
  minify: false,
  target: 'es2020',
  outDir: 'dist',
  platform: 'browser',
  deps: { neverBundle: ['react', 'react-dom', '@cp949/web-logger'] },
  tsconfig: './tsconfig.json',
  // 번들 JS에서 주석 제거 (tsup 산출물과 동일하게 유지, .d.ts의 JSDoc은 유지됨)
  outputOptions: { comments: false },
}));
