import { defineConfig } from 'tsup';

// 환경 변수에서 빌드 타임 상수 추출
const NODE_ENV = process.env.NODE_ENV || 'production';
const INITIAL_LOG_LEVEL = process.env.WEB_LOGGER_LOG_LEVEL || '';
const isDev = NODE_ENV === 'development';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true, // 디버깅을 위한 소스맵 생성
  clean: true,
  treeshake: {
    preset: 'smallest', // 가장 공격적인 Tree Shaking
  },
  minify: false, // 사용자가 직접 minify할 수 있도록
  target: 'es2020',
  outDir: 'dist',
  platform: 'browser',
  // 브라우저 환경 최적화
  external: [],
  noExternal: [],
  // 번들 사이즈 최적화
  bundle: true,
  // 타입 생성 옵션
  tsconfig: './tsconfig.json',
  // 빌드 타임 상수 주입 (Tree Shaking을 위한 데드 코드 제거)
  define: {
    __DEV__: JSON.stringify(isDev),
    __NODE_ENV__: JSON.stringify(NODE_ENV),
    __INITIAL_LOG_LEVEL__: JSON.stringify(INITIAL_LOG_LEVEL),
    // process.env 접근을 빌드 타임 상수로 대체
    'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
    'process.env.WEB_LOGGER_LOG_LEVEL': JSON.stringify(INITIAL_LOG_LEVEL),
  },
  // 최적화 옵션
  esbuildOptions(options) {
    options.legalComments = 'none'; // 라이선스 주석만 유지
  },
});
