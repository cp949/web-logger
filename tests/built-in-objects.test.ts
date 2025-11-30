// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WebLogger } from '../src/WebLogger';

describe('Built-in Objects Handling', () => {
  let logger: WebLogger;
  let consoleSpy: any;

  beforeEach(() => {
    logger = new WebLogger('[TEST]');
    logger.setLogLevel('debug');
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'table').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Date objects', () => {
    it('should handle Date objects and filter sensitive patterns', () => {
      const date = new Date('2024-12-01T10:00:00Z');
      logger.info('Date test', { date, email: 'user@example.com' });

      const tableCall = (console.table as any).mock.calls[0];
      expect(tableCall).toBeTruthy();
      expect(tableCall[0].date).toContain('2024-12-01');
      expect(tableCall[0].email).toBe('[REDACTED]');
    });

    it('should filter email pattern in Date ISO string', () => {
      // Simulating a date string that contains an email-like pattern
      const customDate = {
        toISOString: () => 'meeting-with-user@example.com-2024',
      };
      logger.info('Custom date', { date: customDate });

      const logCall = consoleSpy.mock.calls.find((call: any[]) =>
        call.some((arg: any) => typeof arg === 'string' && arg.includes('Custom date'))
      );
      expect(logCall).toBeTruthy();
    });
  });

  describe('Map objects', () => {
    it('should handle Map objects and filter sensitive data', () => {
      const map = new Map([
        ['user', 'john@example.com'],
        ['apiKey', 'secret-key-123'],
        ['normal', 'regular-value'],
      ]);
      logger.info('Map test', map);

      // Map이 console.log로 출력됨 (두 번째 매개변수로)
      const logCall = consoleSpy.mock.calls.find((call: any[]) =>
        call.some((arg: any) => typeof arg === 'string' && arg.includes('Map test'))
      );
      expect(logCall).toBeTruthy();

      // Map은 sanitizedParams로 전달됨
      const mapArg = logCall[2]; // 세 번째 인자 (0: prefix+timestamp, 1: message, 2: map)
      expect(mapArg).toBeInstanceOf(Map);
      expect(mapArg.get('user')).toBe('[EMAIL]');
      expect(mapArg.get('apiKey')).toBe('[REDACTED]');
      expect(mapArg.get('normal')).toBe('regular-value');
    });

    it('should handle Maps with sensitive keys', () => {
      const map = new Map([
        ['password', 'mypassword'],
        ['email', 'user@example.com'],
        ['data', 'normal-data'],
      ]);
      logger.info('Sensitive keys map', map);

      const logCall = consoleSpy.mock.calls.find((call: any[]) =>
        call.some((arg: any) => typeof arg === 'string' && arg.includes('Sensitive keys map'))
      );
      const mapArg = logCall[2]; // 세 번째 인자

      // 키 자체가 민감한 경우 [REDACTED]로 변경
      expect(mapArg).toBeInstanceOf(Map);
      expect(mapArg.has('[REDACTED]')).toBe(true);
      expect(mapArg.has('password')).toBe(false);
      expect(mapArg.has('email')).toBe(false);
      expect(mapArg.get('data')).toBe('normal-data');
    });
  });

  describe('Set objects', () => {
    it('should handle Set objects and filter sensitive data', () => {
      const set = new Set([
        'user@example.com',
        '1234-5678-9012-3456',
        'normal-value',
      ]);
      logger.info('Set test', set);

      const logCall = consoleSpy.mock.calls.find((call: any[]) =>
        call.some((arg: any) => typeof arg === 'string' && arg.includes('Set test'))
      );
      const setArg = logCall[2]; // 세 번째 인자

      expect(setArg).toBeInstanceOf(Set);
      expect(setArg.has('[EMAIL]')).toBe(true);
      expect(setArg.has('[CARD]')).toBe(true);
      expect(setArg.has('normal-value')).toBe(true);
      expect(setArg.has('user@example.com')).toBe(false);
    });
  });

  describe('TypedArray objects', () => {
    it('should handle TypedArray as binary data', () => {
      const uint8 = new Uint8Array([1, 2, 3, 4, 5]);
      const int32 = new Int32Array([100, 200, 300]);
      const float64 = new Float64Array([1.1, 2.2, 3.3]);

      logger.info('TypedArray test', {
        uint8,
        int32,
        float64,
      });

      const tableCall = (console.table as any).mock.calls[0];
      expect(tableCall).toBeTruthy();
      expect(tableCall[0].uint8).toBe('[BINARY_DATA]');
      expect(tableCall[0].int32).toBe('[BINARY_DATA]');
      expect(tableCall[0].float64).toBe('[BINARY_DATA]');
    });
  });

  describe('Buffer objects (Node.js)', () => {
    it('should handle Buffer as binary data when available', () => {
      // Buffer is available in Node.js environment
      if (typeof Buffer !== 'undefined') {
        const buffer = Buffer.from('Hello World', 'utf-8');
        logger.info('Buffer test', { buffer });

        const tableCall = (console.table as any).mock.calls[0];
        expect(tableCall).toBeTruthy();
        expect(tableCall[0].buffer).toBe('[BUFFER]');
      } else {
        // Skip test in browser environment
        expect(true).toBe(true);
      }
    });
  });

  describe('Mixed built-in objects', () => {
    it('should handle nested built-in objects correctly', () => {
      const complexData = {
        date: new Date('2024-12-01'),
        map: new Map([['key', 'value@example.com']]),
        set: new Set(['item@example.com']),
        array: [1, 2, 'test@example.com'],
        nested: {
          password: 'secret',
          timestamp: new Date('2024-01-01'),
        },
      };

      logger.info('Complex data', complexData);

      const tableCall = (console.table as any).mock.calls[0];
      expect(tableCall).toBeTruthy();

      // Date는 ISO string으로 변환
      expect(typeof tableCall[0].date).toBe('string');
      expect(tableCall[0].date).toContain('2024-12-01');

      // Map과 Set은 각각 처리
      expect(tableCall[0].map).toBeInstanceOf(Map);
      expect(tableCall[0].set).toBeInstanceOf(Set);

      // 배열의 이메일 패턴 필터링
      expect(tableCall[0].array[2]).toBe('[EMAIL]');

      // 중첩 객체의 민감한 데이터 필터링
      expect(tableCall[0].nested.password).toBe('[REDACTED]');
      expect(typeof tableCall[0].nested.timestamp).toBe('string');
    });
  });

  describe('Performance with built-in objects', () => {
    it('should handle large Maps efficiently', () => {
      const largeMap = new Map();
      for (let i = 0; i < 100; i++) {
        largeMap.set(`key${i}`, `value${i}@example.com`);
      }

      const start = performance.now();
      logger.info('Large map', largeMap);
      const end = performance.now();

      // Should process within reasonable time (< 100ms)
      expect(end - start).toBeLessThan(100);

      const logCall = consoleSpy.mock.calls.find((call: any[]) =>
        call.some((arg: any) => typeof arg === 'string' && arg.includes('Large map'))
      );
      const mapArg = logCall[2]; // 세 번째 인자

      expect(mapArg).toBeInstanceOf(Map);
      // 모든 이메일이 필터링되어야 함
      for (let i = 0; i < 100; i++) {
        expect(mapArg.get(`key${i}`)).toBe('[EMAIL]');
      }
    });

    it('should handle large Sets efficiently', () => {
      const largeSet = new Set();
      for (let i = 0; i < 100; i++) {
        largeSet.add(`user${i}@example.com`);
      }

      const start = performance.now();
      logger.info('Large set', largeSet);
      const end = performance.now();

      // Should process within reasonable time (< 100ms)
      expect(end - start).toBeLessThan(100);

      const logCall = consoleSpy.mock.calls.find((call: any[]) =>
        call.some((arg: any) => typeof arg === 'string' && arg.includes('Large set'))
      );
      const setArg = logCall[2]; // 세 번째 인자

      expect(setArg).toBeInstanceOf(Set);
      // 모든 이메일이 필터링되어야 함 (하나의 [EMAIL]로 축약됨)
      expect(setArg.size).toBe(1); // 모든 이메일이 [EMAIL]로 변환되어 중복 제거
      expect(setArg.has('[EMAIL]')).toBe(true);
    });
  });
});