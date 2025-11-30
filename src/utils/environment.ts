export const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
};

export const isServer = (): boolean => {
  return !isBrowser();
};

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
