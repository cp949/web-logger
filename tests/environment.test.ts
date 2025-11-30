// @vitest-environment node

import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { isBrowser, isServer, isDevelopment } from '../src/utils/environment';

describe('environment utilities', () => {
  let originalWindow: any;
  let originalProcess: any;
  let originalDev: any;
  let originalNodeEnv: any;

  beforeEach(() => {
    // 원본 값들을 저장
    originalWindow = globalThis.window;
    originalProcess = globalThis.process;

    // __DEV__와 __NODE_ENV__ 백업 (빌드 상수)
    originalDev = (globalThis as any).__DEV__;
    originalNodeEnv = (globalThis as any).__NODE_ENV__;
  });

  afterEach(() => {
    // 원본 값들 복원
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    } else {
      delete (globalThis as any).window;
    }

    if (originalProcess !== undefined) {
      globalThis.process = originalProcess;
    } else {
      delete (globalThis as any).process;
    }

    if (originalDev !== undefined) {
      (globalThis as any).__DEV__ = originalDev;
    } else {
      delete (globalThis as any).__DEV__;
    }

    if (originalNodeEnv !== undefined) {
      (globalThis as any).__NODE_ENV__ = originalNodeEnv;
    } else {
      delete (globalThis as any).__NODE_ENV__;
    }
  });

  describe('isBrowser', () => {
    it('should return false in node environment', () => {
      // Node.js 환경에서는 window가 undefined
      expect(isBrowser()).toBe(false);
    });

    it('should return true when window and document are defined', () => {
      // window와 document를 모킹
      (globalThis as any).window = {
        document: {}
      };

      expect(isBrowser()).toBe(true);
    });

    it('should return false when window.document is undefined', () => {
      // window는 있지만 document가 없는 경우
      (globalThis as any).window = {};

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
      (globalThis as any).window = {
        document: {}
      };

      expect(isServer()).toBe(false);
    });
  });

  describe('isDevelopment', () => {
    it('should use __DEV__ constant when available', () => {
      // __DEV__가 true로 설정된 경우
      (globalThis as any).__DEV__ = true;
      expect(isDevelopment()).toBe(true);

      // __DEV__가 false로 설정된 경우
      (globalThis as any).__DEV__ = false;
      expect(isDevelopment()).toBe(false);
    });

    it('should use __NODE_ENV__ when __DEV__ is undefined', () => {
      delete (globalThis as any).__DEV__;

      // development
      (globalThis as any).__NODE_ENV__ = 'development';
      expect(isDevelopment()).toBe(true);

      // production
      (globalThis as any).__NODE_ENV__ = 'production';
      expect(isDevelopment()).toBe(false);

      // test
      (globalThis as any).__NODE_ENV__ = 'test';
      expect(isDevelopment()).toBe(false);
    });

    it('should fallback to NODE_ENV environment variable', () => {
      delete (globalThis as any).__DEV__;
      delete (globalThis as any).__NODE_ENV__;

      // process.env.NODE_ENV 설정
      (globalThis as any).process = {
        env: {
          NODE_ENV: 'development',
        },
      };
      expect(isDevelopment()).toBe(true);

      (globalThis as any).process.env.NODE_ENV = 'production';
      expect(isDevelopment()).toBe(false);
    });

    it('should return false when no environment indicators are available', () => {
      delete (globalThis as any).__DEV__;
      delete (globalThis as any).__NODE_ENV__;
      delete (globalThis as any).process;

      expect(isDevelopment()).toBe(false);
    });

    it('should handle process being undefined', () => {
      delete (globalThis as any).__DEV__;
      delete (globalThis as any).__NODE_ENV__;
      (globalThis as any).process = undefined;

      expect(isDevelopment()).toBe(false);
    });

    it('should handle process.env being undefined', () => {
      delete (globalThis as any).__DEV__;
      delete (globalThis as any).__NODE_ENV__;
      (globalThis as any).process = {};

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
      (globalThis as any).window = {
        document: {}
      };

      expect(isBrowser()).toBe(true);
      expect(isServer()).toBe(false);
    });

    it('should handle partial browser-like environments', () => {
      // Some server environments might have window but not document
      (globalThis as any).window = {
        location: { href: 'http://example.com' },
      };

      expect(isBrowser()).toBe(false);
      expect(isServer()).toBe(true);
    });
  });

  describe('Build-time constants priority', () => {
    it('should prioritize __DEV__ over __NODE_ENV__', () => {
      (globalThis as any).__DEV__ = true;
      (globalThis as any).__NODE_ENV__ = 'production';

      // __DEV__가 우선순위를 가져야 함
      expect(isDevelopment()).toBe(true);
    });

    it('should prioritize __NODE_ENV__ over process.env', () => {
      delete (globalThis as any).__DEV__;
      (globalThis as any).__NODE_ENV__ = 'development';
      (globalThis as any).process = {
        env: {
          NODE_ENV: 'production',
        },
      };

      // __NODE_ENV__가 우선순위를 가져야 함
      expect(isDevelopment()).toBe(true);
    });
  });
});