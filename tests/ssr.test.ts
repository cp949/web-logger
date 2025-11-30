// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebLogger } from '../src/WebLogger';
import { logDebug, logInfo, logWarn, logError } from '../src/logger';

describe('SSR compatibility', () => {
  let originalLevel: unknown;

  beforeEach(() => {
    originalLevel = (globalThis as any).__WEB_LOGGER_LOG_LEVEL__;
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'table').mockImplementation(() => {});
  });

  afterEach(() => {
    (globalThis as any).__WEB_LOGGER_LOG_LEVEL__ = originalLevel;
    vi.restoreAllMocks();
  });

  it('logs without throwing and masks patterns in node env', () => {
    const logger = new WebLogger('[SSR]');
    logger.setLogLevel('debug');

    expect(() => logger.info('user@example.com')).not.toThrow();

    const calls = (console.log as any).mock.calls;
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
    expect((globalThis as any).__WEB_LOGGER_LOG_LEVEL__).toBe('error');
  });

  it('masks sensitive keys and uses metadata table output', () => {
    const logger = new WebLogger('[SSR]');
    logger.setLogLevel('debug');

    logger.info('message', {
      apiKey: 'secret-key',
      password: 'password: "abc123"',
      normal: 'ok',
    });

    const tableCall = (console.table as any).mock.calls.at(-1);
    expect(tableCall?.[0]).toMatchObject({
      apiKey: '[REDACTED]',
      password: '[REDACTED]',
      normal: 'ok',
    });
  });

  it('logDebug and other helper functions work in SSR', () => {
    // 로그 레벨 설정 (globalThis를 통해 공유됨)
    (globalThis as any).__WEB_LOGGER_LOG_LEVEL__ = 'debug';

    expect(() => logDebug('debug message')).not.toThrow();
    expect(() => logInfo('info message')).not.toThrow();
    expect(() => logWarn('warning message')).not.toThrow();
    expect(() => logError('error message')).not.toThrow();

    // 콘솔 호출 확인
    const debugCalls = (console.debug as any).mock.calls;
    const logCalls = (console.log as any).mock.calls;
    const warnCalls = (console.warn as any).mock.calls;
    const errorCalls = (console.error as any).mock.calls;

    const totalCalls = debugCalls.length + logCalls.length + warnCalls.length + errorCalls.length;
    expect(totalCalls).toBeGreaterThan(0);
  });
});
