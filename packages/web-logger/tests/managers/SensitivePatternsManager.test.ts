import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  WebLogger,
  addSensitivePatterns,
  getSensitivePatterns,
  resetSensitivePatterns,
  setSensitivePatternWarnings,
  setSensitivePatterns,
} from '../../src/WebLogger';
import {
  cleanupTestEnvironment,
  createConsoleSpy,
  extractMessageFromLog,
  setupTestEnvironment,
} from '../test-helpers';

describe('SensitivePatternsManager', () => {
  let consoleSpy: ReturnType<typeof createConsoleSpy>;
  let logger: WebLogger;

  beforeEach(() => {
    setupTestEnvironment();
    consoleSpy = createConsoleSpy();
    logger = new WebLogger({ prefix: '[Test]', enableMasking: true });
    logger.setLogLevel('debug');
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('setSensitivePatterns', () => {
    it('기본 패턴을 교체할 수 있어야 함', () => {
      setSensitivePatterns({ ticket: /TICKET-\d+/g });

      logger.debug('Ticket:', 'TICKET-123');
      const logCalls = consoleSpy.log.mock.calls.length
        ? consoleSpy.log.mock.calls
        : consoleSpy.debug.mock.calls;
      expect(logCalls.length).toBeGreaterThan(0);
      const flattened = logCalls
        .flat()
        .filter((arg: unknown) => typeof arg === 'string') as string[];
      expect(flattened.some((arg) => arg.includes('[TICKET]'))).toBe(true);
      expect(flattened.some((arg) => arg.includes('TICKET-123'))).toBe(false);
    });

    it('기본 패턴을 제거하면 경고를 표시해야 함', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      setSensitivePatterns({ ticket: /TICKET-\d+/g });
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it('경고 표시를 비활성화할 수 있어야 함', () => {
      setSensitivePatternWarnings(true);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      setSensitivePatterns({ ticket: /TICKET-\d+/g });
      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

  describe('addSensitivePatterns', () => {
    it('기본 패턴을 유지하면서 추가해야 함', () => {
      addSensitivePatterns({ ticket: /TICKET-\d+/g });

      logger.debug('Ticket:', 'TICKET-999');
      const ticketCalls = consoleSpy.log.mock.calls.length
        ? consoleSpy.log.mock.calls
        : consoleSpy.debug.mock.calls;
      const flattened = ticketCalls
        .flat()
        .filter((arg: unknown) => typeof arg === 'string') as string[];
      expect(flattened.some((arg) => arg.includes('[TICKET]'))).toBe(true);

      vi.clearAllMocks();
      logger.debug('Email user@example.com');
      const emailMessage = extractMessageFromLog(
        consoleSpy.log.mock.calls.length ? consoleSpy.log.mock.calls : consoleSpy.debug.mock.calls,
      );
      expect(emailMessage).toContain('[EMAIL]');
    });
  });

  describe('getSensitivePatterns', () => {
    it('현재 패턴 목록을 반환해야 함', () => {
      const patterns = getSensitivePatterns();
      expect(typeof patterns).toBe('object');
      expect(patterns.email).toBeInstanceOf(RegExp);
    });
  });

  describe('resetSensitivePatterns', () => {
    it('기본 패턴으로 초기화해야 함', () => {
      setSensitivePatterns({ ticket: /TICKET-\d+/g });
      expect(getSensitivePatterns().ticket).toBeDefined();

      resetSensitivePatterns();
      expect(getSensitivePatterns().ticket).toBeUndefined();
      expect(getSensitivePatterns().email).toBeDefined();
    });
  });
});
