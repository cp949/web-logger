/**
 * 브라우저 환경 여부 확인
 * 
 * `window`와 `window.document`가 모두 존재하는지 확인합니다.
 * 
 * @returns 브라우저 환경이면 `true`, 서버 환경이면 `false`
 * 
 * @example
 * ```typescript
 * if (isBrowser()) {
 *   // 브라우저 전용 코드
 * }
 * ```
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
};

/**
 * 서버 환경 여부 확인
 * 
 * 브라우저 환경이 아닌 경우 `true`를 반환합니다.
 * 
 * @returns 서버 환경이면 `true`, 브라우저 환경이면 `false`
 * 
 * @example
 * ```typescript
 * if (isServer()) {
 *   // 서버 전용 코드
 * }
 * ```
 */
export const isServer = (): boolean => {
  return !isBrowser();
};

/**
 * 개발 환경 여부 확인
 * 
 * 다음 우선순위로 확인합니다:
 * 1. 빌드 타임 상수 `__DEV__` (최우선)
 * 2. 빌드 타임 상수 `__NODE_ENV__` 또는 `process.env.NODE_ENV`
 * 3. 기본값: `false` (프로덕션)
 * 
 * @returns 개발 환경이면 `true`, 프로덕션 환경이면 `false`
 * 
 * @example
 * ```typescript
 * if (isDevelopment()) {
 *   // 개발 환경 전용 코드
 * }
 * ```
 */
export const isDevelopment = (): boolean => {
  // 1. 빌드 타임 상수 우선
  if (typeof __DEV__ !== 'undefined') {
    return __DEV__ === true;
  }

  // 2. Node.js 환경
  if (typeof process !== 'undefined' && process.env) {
    const nodeEnv = typeof __NODE_ENV__ !== 'undefined' ? __NODE_ENV__ : process.env['NODE_ENV'];
    return nodeEnv === 'development';
  }

  // 3. 기본값: 프로덕션
  return false;
};
