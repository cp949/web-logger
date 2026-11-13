import { defineConfig } from 'tsdown';

// 환경 변수에서 빌드 타임 상수 추출
const NODE_ENV = process.env.NODE_ENV || 'production';
const INITIAL_LOG_LEVEL = process.env.WEB_LOGGER_LOG_LEVEL || '';
const isDev = NODE_ENV === 'development';

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // package.json의 exports(index.js / index.cjs)와 파일명을 맞춘다
  fixedExtension: false,
  dts: true,
  sourcemap: true, // 디버깅을 위한 소스맵 생성
  clean: !options.watch,
  minify: false, // 사용자가 직접 minify할 수 있도록
  target: 'es2020',
  outDir: 'dist',
  platform: 'browser',
  tsconfig: './tsconfig.json',
  // 번들 JS에서 주석 제거 (tsup 산출물과 동일하게 유지, .d.ts의 JSDoc은 유지됨)
  outputOptions: { comments: false },
  // 빌드 타임 상수 주입 (Tree Shaking을 위한 데드 코드 제거)
  define: {
    __DEV__: JSON.stringify(isDev),
    __NODE_ENV__: JSON.stringify(NODE_ENV),
    __INITIAL_LOG_LEVEL__: JSON.stringify(INITIAL_LOG_LEVEL),
    // process.env 접근을 빌드 타임 상수로 대체
    'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
    'process.env.WEB_LOGGER_LOG_LEVEL': JSON.stringify(INITIAL_LOG_LEVEL),
  },
}));
