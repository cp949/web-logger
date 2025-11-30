// @vitest-environment node

import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { isBrowser, isServer, isDevelopment } from '../src/utils/environment';

describe('environment utilities', () => {
  let originalWindow: typeof globalThis.window;
  let originalProcess: typeof globalThis.process;
  let originalDev: typeof globalThis.__DEV__;
  let originalNodeEnv: typeof globalThis.__NODE_ENV__;

  beforeEach(() => {
    // 원본 값들을 저장
    originalWindow = globalThis.window;
    originalProcess = globalThis.process;

    // __DEV__와 __NODE_ENV__ 백업 (빌드 상수)
    originalDev = globalThis.__DEV__;
    originalNodeEnv = globalThis.__NODE_ENV__;
  });

  afterEach(() => {
    // 원본 값들 복원
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    } else {
      // @ts-expect-error: 테스트를 위해 의도적으로 속성 삭제
      delete globalThis.window;
    }

    if (originalProcess !== undefined) {
      globalThis.process = originalProcess;
    } else {
      // @ts-expect-error: 테스트를 위해 의도적으로 속성 삭제
      delete globalThis.process;
    }

    if (originalDev !== undefined) {
      globalThis.__DEV__ = originalDev;
    } else {
      // @ts-expect-error: 테스트를 위해 의도적으로 속성 삭제
      delete globalThis.__DEV__;
    }

    if (originalNodeEnv !== undefined) {
      globalThis.__NODE_ENV__ = originalNodeEnv;
    } else {
      // @ts-expect-error: 테스트를 위해 의도적으로 속성 삭제
      delete globalThis.__NODE_ENV__;
    }
  });

  describe('isBrowser', () => {
    it('should return false in node environment', () => {
      // Node.js 환경에서는 window가 undefined
      expect(isBrowser()).toBe(false);
    });

    it('should return true when window and document are defined', () => {
      // window와 document를 모킹
      // @ts-expect-error: 테스트를 위해 의도적으로 window 속성 설정
      globalThis.window = {
        document: {}
      } as Window;

      expect(isBrowser()).toBe(true);
    });

    it('should return false when window.document is undefined', () => {
      // window는 있지만 document가 없는 경우
      // @ts-expect-error: 테스트를 위해 의도적으로 window 속성 설정
      globalThis.window = {} as Window;

      expect(isBrowser()).toBe(false);
    });
  });

  describe('isServer', () => {
    it('should return true in node environment', () => {
      // Node.js 환경에서는 window가 undefined
      expect(isServer()).toBe(true);
    });

    it('should return false when window is defined', () => {
      // window를 정의하여 브라우저 환경 시뮬레이션
      // @ts-expect-error: 테스트를 위해 의도적으로 window 속성 설정
      globalThis.window = {
        document: {}
      } as Window;

      expect(isServer()).toBe(false);
    });
  });

  describe('isDevelopment', () => {
    it('should use __DEV__ constant when available', () => {
      // __DEV__가 true로 설정된 경우
      globalThis.__DEV__ = true;
      expect(isDevelopment()).toBe(true);

      // __DEV__가 false로 설정된 경우
      globalThis.__DEV__ = false;
      expect(isDevelopment()).toBe(false);
    });

    it('should use __NODE_ENV__ when __DEV__ is undefined', () => {
      // @ts-expect-error: 테스트를 위해 의도적으로 속성 삭제
      delete globalThis.__DEV__;

      // development
      globalThis.__NODE_ENV__ = 'development';
      expect(isDevelopment()).toBe(true);

      // production
      globalThis.__NODE_ENV__ = 'production';
      expect(isDevelopment()).toBe(false);

      // test
      globalThis.__NODE_ENV__ = 'test';
      expect(isDevelopment()).toBe(false);
    });

    it('should fallback to NODE_ENV environment variable', () => {
      // @ts-expect-error: 테스트를 위해 의도적으로 속성 삭제
      delete globalThis.__DEV__;
      // @ts-expect-error: 테스트를 위해 의도적으로 속성 삭제
      delete globalThis.__NODE_ENV__;

      // process.env.NODE_ENV 설정
      // @ts-expect-error: 테스트를 위해 의도적으로 process 속성 설정
      globalThis.process = {
        env: {
          NODE_ENV: 'development',
        },
      } as NodeJS.Process;
      expect(isDevelopment()).toBe(true);

      // @ts-expect-error: 테스트를 위해 의도적으로 process.env.NODE_ENV 설정
      globalThis.process.env.NODE_ENV = 'production';
      expect(isDevelopment()).toBe(false);
    });

    it('should return false when no environment indicators are available', () => {
      // @ts-expect-error: 테스트를 위해 의도적으로 속성 삭제
      delete globalThis.__DEV__;
      // @ts-expect-error: 테스트를 위해 의도적으로 속성 삭제
      delete globalThis.__NODE_ENV__;
      // @ts-expect-error: 테스트를 위해 의도적으로 속성 삭제
      delete globalThis.process;

      expect(isDevelopment()).toBe(false);
    });

    it('should handle process being undefined', () => {
      // @ts-expect-error: 테스트를 위해 의도적으로 속성 삭제
      delete globalThis.__DEV__;
      // @ts-expect-error: 테스트를 위해 의도적으로 속성 삭제
      delete globalThis.__NODE_ENV__;
      // @ts-expect-error: 테스트를 위해 의도적으로 process를 undefined로 설정
      globalThis.process = undefined;

      expect(isDevelopment()).toBe(false);
    });

    it('should handle process.env being undefined', () => {
      // @ts-expect-error: 테스트를 위해 의도적으로 속성 삭제
      delete globalThis.__DEV__;
      // @ts-expect-error: 테스트를 위해 의도적으로 속성 삭제
      delete globalThis.__NODE_ENV__;
      // @ts-expect-error: 테스트를 위해 의도적으로 process 속성 설정
      globalThis.process = {} as NodeJS.Process;

      expect(isDevelopment()).toBe(false);
    });
  });

  describe('SSR/CSR compatibility', () => {
    it('should correctly identify server environment by default', () => {
      // Node.js환경에서 기본적으로 서버로 식별
      expect(isBrowser()).toBe(false);
      expect(isServer()).toBe(true);
    });

    it('should correctly identify browser environment when mocked', () => {
      // Window와 document를 모킹하여 브라우저 시뮬레이션
      // @ts-expect-error: 테스트를 위해 의도적으로 window 속성 설정
      globalThis.window = {
        document: {}
      } as Window;

      expect(isBrowser()).toBe(true);
      expect(isServer()).toBe(false);
    });

    it('should handle partial browser-like environments', () => {
      // Some server environments might have window but not document
      // @ts-expect-error: 테스트를 위해 의도적으로 window 속성 설정
      globalThis.window = {
        location: { href: 'http://example.com' },
      } as Window;

      expect(isBrowser()).toBe(false);
      expect(isServer()).toBe(true);
    });
  });

  describe('Build-time constants priority', () => {
    it('should prioritize __DEV__ over __NODE_ENV__', () => {
      globalThis.__DEV__ = true;
      globalThis.__NODE_ENV__ = 'production';

      // __DEV__가 우선순위를 가져야 함
      expect(isDevelopment()).toBe(true);
    });

    it('should prioritize __NODE_ENV__ over process.env', () => {
      // @ts-expect-error: 테스트를 위해 의도적으로 속성 삭제
      delete globalThis.__DEV__;
      globalThis.__NODE_ENV__ = 'development';
      // @ts-expect-error: 테스트를 위해 의도적으로 process 속성 설정
      globalThis.process = {
        env: {
          NODE_ENV: 'production',
        },
      } as NodeJS.Process;

      // __NODE_ENV__가 우선순위를 가져야 함
      expect(isDevelopment()).toBe(true);
    });
  });
});