// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebLogger } from '../src/WebLogger';
import { logDebug, logInfo, logWarn, logError } from '../src/logger';

describe('SSR compatibility', () => {
  let originalLevel: typeof globalThis.__WEB_LOGGER_LOG_LEVEL__;

  beforeEach(() => {
    originalLevel = globalThis.__WEB_LOGGER_LOG_LEVEL__;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'table').mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.__WEB_LOGGER_LOG_LEVEL__ = originalLevel;
    vi.restoreAllMocks();
  });

  it('logs without throwing and masks patterns in node env', () => {
    const logger = new WebLogger('[SSR]');
    logger.setLogLevel('debug');

    expect(() => logger.info('user@example.com')).not.toThrow();

    const calls = vi.mocked(console.log).mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall).toBeTruthy();
    const [format, style] = lastCall;

    expect(format).toContain('%c[SSR]');
    expect(format).toContain('[EMAIL]');
    expect(style).toContain('color');
  });

  it('shares log level via globalThis', () => {
    const logger1 = new WebLogger('[SSR-1]');
    logger1.setLogLevel('error');

    const logger2 = new WebLogger('[SSR-2]');
    expect(logger2.currentLogLevel).toBe('error');
    expect(globalThis.__WEB_LOGGER_LOG_LEVEL__).toBe('error');
  });

  it('masks sensitive keys and uses metadata table output', () => {
    const logger = new WebLogger('[SSR]');
    logger.setLogLevel('debug');

    logger.info('message', {
      apiKey: 'secret-key',
      password: 'password: "abc123"',
      normal: 'ok',
    });

    const tableCall = vi.mocked(console.table).mock.calls.at(-1);
    expect(tableCall?.[0]).toMatchObject({
      apiKey: '[REDACTED]',
      password: '[REDACTED]',
      normal: 'ok',
    });
  });

  it('logDebug and other helper functions work in SSR', () => {
    // 로그 레벨 설정 (globalThis를 통해 공유됨)
    globalThis.__WEB_LOGGER_LOG_LEVEL__ = 'debug';

    expect(() => logDebug('debug message')).not.toThrow();
    expect(() => logInfo('info message')).not.toThrow();
    expect(() => logWarn('warning message')).not.toThrow();
    expect(() => logError('error message')).not.toThrow();

    // 콘솔 호출 확인
    const debugCalls = vi.mocked(console.debug).mock.calls;
    const logCalls = vi.mocked(console.log).mock.calls;
    const warnCalls = vi.mocked(console.warn).mock.calls;
    const errorCalls = vi.mocked(console.error).mock.calls;

    const totalCalls = debugCalls.length + logCalls.length + warnCalls.length + errorCalls.length;
    expect(totalCalls).toBeGreaterThan(0);
  });

  describe('globalThis and window synchronization', () => {
    it('should set log level in globalThis when in SSR environment', () => {
      const logger = new WebLogger('[SSR]');
      logger.setLogLevel('debug');

      expect(globalThis.__WEB_LOGGER_LOG_LEVEL__).toBe('debug');
    });

    it('should share log level across multiple WebLogger instances via globalThis', () => {
      const logger1 = new WebLogger('[SSR-1]');
      logger1.setLogLevel('warn');

      const logger2 = new WebLogger('[SSR-2]');
      const logger3 = new WebLogger('[SSR-3]');

      expect(logger2.currentLogLevel).toBe('warn');
      expect(logger3.currentLogLevel).toBe('warn');
      expect(globalThis.__WEB_LOGGER_LOG_LEVEL__).toBe('warn');
    });

    it('should update all instances when log level changes', () => {
      const logger1 = new WebLogger('[SSR-1]');
      const logger2 = new WebLogger('[SSR-2]');
      const logger3 = new WebLogger('[SSR-3]');

      logger1.setLogLevel('info');
      expect(logger2.currentLogLevel).toBe('info');
      expect(logger3.currentLogLevel).toBe('info');

      logger2.setLogLevel('error');
      expect(logger1.currentLogLevel).toBe('error');
      expect(logger3.currentLogLevel).toBe('error');
    });
  });

  describe('logging format consistency', () => {
    it('should use %c format for info logs in SSR', () => {
      const logger = new WebLogger('[SSR]');
      logger.setLogLevel('debug');
      logger.info('test message');

      const calls = vi.mocked(console.log).mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).toContain('%c[SSR]');
      expect(lastCall[0]).toContain('INFO');
      expect(lastCall[1]).toContain('color');
    });

    it('should use console.table for metadata objects in SSR', () => {
      const logger = new WebLogger('[SSR]');
      logger.setLogLevel('debug');
      logger.info('message', { key: 'value', number: 123 });

      const tableCalls = vi.mocked(console.table).mock.calls;
      expect(tableCalls.length).toBeGreaterThan(0);
      const lastTableCall = tableCalls[tableCalls.length - 1];
      expect(lastTableCall[0]).toMatchObject({
        key: 'value',
        number: 123,
      });
    });

    it('should handle multiple parameters correctly in SSR', () => {
      const logger = new WebLogger('[SSR]');
      logger.setLogLevel('debug');
      logger.info('message', 'arg1', { key: 'value' }, 123);

      // 여러 파라미터는 console.info 또는 console.log로 출력됨
      const allCalls = [
        ...vi.mocked(console.info).mock.calls,
        ...vi.mocked(console.log).mock.calls,
      ];
      expect(allCalls.length).toBeGreaterThan(0);
      const lastCall = allCalls[allCalls.length - 1];
      expect(lastCall).toBeTruthy();
      expect(lastCall.length).toBeGreaterThan(2); // prefix + message + args
      expect(lastCall.some((arg: unknown) => typeof arg === 'string' && arg.includes('message'))).toBe(true);
    });
  });

  describe('console method fallback handling', () => {
    it('should fallback to console.log when console.debug is undefined', () => {
      const originalDebug = console.debug;
      // @ts-expect-error: 테스트를 위해 의도적으로 undefined 설정
      console.debug = undefined;

      const logger = new WebLogger('[SSR]');
      logger.setLogLevel('debug');

      expect(() => logger.debug('debug message')).not.toThrow();

      const logCalls = vi.mocked(console.log).mock.calls;
      expect(logCalls.length).toBeGreaterThan(0);

      // 복원
      console.debug = originalDebug;
    });

    it('should fallback to console.log when console.info is undefined', () => {
      const originalInfo = console.info;
      // @ts-expect-error: 테스트를 위해 의도적으로 undefined 설정
      console.info = undefined;

      const logger = new WebLogger('[SSR]');
      logger.setLogLevel('debug');

      expect(() => logger.info('info message')).not.toThrow();

      const logCalls = vi.mocked(console.log).mock.calls;
      expect(logCalls.length).toBeGreaterThan(0);

      // 복원
      console.info = originalInfo;
    });

    it('should work correctly when both console.debug and console.info are undefined', () => {
      const originalDebug = console.debug;
      const originalInfo = console.info;
      // @ts-expect-error: 테스트를 위해 의도적으로 undefined 설정
      console.debug = undefined;
      // @ts-expect-error: 테스트를 위해 의도적으로 undefined 설정
      console.info = undefined;

      const logger = new WebLogger('[SSR]');
      logger.setLogLevel('debug');

      expect(() => logger.debug('debug message')).not.toThrow();
      expect(() => logger.info('info message')).not.toThrow();

      const logCalls = vi.mocked(console.log).mock.calls;
      expect(logCalls.length).toBeGreaterThan(0);

      // 복원
      console.debug = originalDebug;
      console.info = originalInfo;
    });
  });
});
