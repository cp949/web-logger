import { vi } from 'vitest';
import {
  WebLogger,
  resetSensitiveKeys,
  resetSensitivePatterns,
  setSensitivePatternWarnings,
} from '../src/WebLogger';

/**
 * 테스트용 localStorage 모킹
 */
export function createLocalStorageMock() {
  const storage: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach((key) => delete storage[key]);
    }),
  };
}

/**
 * 테스트용 console 스파이 생성
 */
export function createConsoleSpy() {
  return {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    table: vi.spyOn(console, 'table').mockImplementation(() => {}),
  };
}

/**
 * 테스트 환경 초기화
 */
export function setupTestEnvironment() {
  // window.__WEB_LOGGER_LOG_LEVEL__ 초기화
  if (typeof window !== 'undefined') {
    delete window.__WEB_LOGGER_LOG_LEVEL__;
  }

  // localStorage 모킹
  const localStorageMock = createLocalStorageMock();
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });

  localStorageMock.clear();

  return { localStorageMock };
}

/**
 * 테스트 환경 정리
 */
export function cleanupTestEnvironment(originalEnv?: string) {
  // window.__WEB_LOGGER_LOG_LEVEL__ 초기화
  if (typeof window !== 'undefined') {
    delete window.__WEB_LOGGER_LOG_LEVEL__;
  }

  // localStorage 초기화
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }

  // 민감 키/패턴 초기화
  resetSensitiveKeys();
  resetSensitivePatterns();
  setSensitivePatternWarnings(false);

  // 환경 변수 복원
  if (originalEnv !== undefined) {
    process.env.NODE_ENV = originalEnv;
  }

  // 모든 모킹 복원
  vi.restoreAllMocks();
}

/**
 * 로그 출력에서 메시지 추출
 */
export function extractMessageFromLog(mockCalls: any[]): string | null {
  if (!mockCalls || mockCalls.length === 0) return null;

  const firstCall = mockCalls[0];
  if (!firstCall || firstCall.length === 0) return null;

  // 첫 번째 인자가 %c로 시작하는 경우 (스타일 적용)
  const firstArg = firstCall[0];
  if (typeof firstArg === 'string' && firstArg.includes('%c')) {
    // %c[TEST] [HH:MM:SS] LEVEL message 형식에서 message 추출
    const match = firstArg.match(/\[TEST\]\s+\[[^\]]+\]\s+\w+\s+(.*)/);
    return match ? match[1] : firstArg;
  }

  return firstArg;
}

/**
 * 테스트용 WebLogger 인스턴스 생성
 */
export function createTestLogger(options?: { enableMasking?: boolean; prefix?: string }) {
  return new WebLogger({
    prefix: options?.prefix || '[TEST]',
    enableMasking: options?.enableMasking ?? true,
  });
}
