// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { WebLogger } from '../src/WebLogger';
import { convertToConsoleLogger } from '../src/logger';

describe('convertToConsoleLogger', () => {
  let webLogger: WebLogger;
  let consoleCompatible: Partial<Console>;
  let originalConsole: Console;

  beforeEach(() => {
    webLogger = new WebLogger('[TEST]');
    webLogger.setLogLevel('debug');
    consoleCompatible = convertToConsoleLogger(webLogger);

    // 원본 console 메서드들을 백업
    originalConsole = { ...console };

    // console 메서드들을 모킹
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'table').mockImplementation(() => {});
    vi.spyOn(console, 'clear').mockImplementation(() => {});
    vi.spyOn(console, 'trace').mockImplementation(() => {});
    vi.spyOn(console, 'dir').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    vi.spyOn(console, 'time').mockImplementation(() => {});
    vi.spyOn(console, 'timeEnd').mockImplementation(() => {});

    // 일부 메서드는 Node.js에서 사용 불가능할 수 있음
    if (console.dirxml) vi.spyOn(console, 'dirxml').mockImplementation(() => {});
    if (console.count) vi.spyOn(console, 'count').mockImplementation(() => {});
    if (console.countReset) vi.spyOn(console, 'countReset').mockImplementation(() => {});
    if (console.assert) vi.spyOn(console, 'assert').mockImplementation(() => {});
    if (console.profile) vi.spyOn(console, 'profile').mockImplementation(() => {});
    if (console.profileEnd) vi.spyOn(console, 'profileEnd').mockImplementation(() => {});
    if (console.timeStamp) vi.spyOn(console, 'timeStamp').mockImplementation(() => {});
    if (console.timeLog) vi.spyOn(console, 'timeLog').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic logging methods', () => {
    it('should handle debug with no arguments', () => {
      consoleCompatible.debug!();

      const logCalls = vi.mocked(console.log).mock.calls;
      expect(logCalls.length).toBeGreaterThan(0);
      const lastCall = logCalls[logCalls.length - 1];
      expect(lastCall.some(arg => typeof arg === 'string' && arg.includes('[TEST]'))).toBe(true);
    });

    it('should handle debug with single argument', () => {
      consoleCompatible.debug!('Debug message');

      const logCalls = vi.mocked(console.log).mock.calls;
      const lastCall = logCalls[logCalls.length - 1];
      expect(lastCall.some(arg => typeof arg === 'string' && arg.includes('Debug message'))).toBe(true);
    });

    it('should handle debug with multiple arguments', () => {
      const obj = { test: 'value' };
      consoleCompatible.debug!('Debug', obj, 123);

      // debug는 console.debug 또는 console.log를 사용
      const allCalls = [
        ...vi.mocked(console.debug).mock.calls,
        ...vi.mocked(console.log).mock.calls,
      ];
      expect(allCalls.length).toBeGreaterThan(0);
      const lastCall = allCalls[allCalls.length - 1];
      expect(lastCall.some(arg => typeof arg === 'string' && arg.includes('Debug'))).toBe(true);
    });

    it('should handle info with no arguments', () => {
      consoleCompatible.info!();

      const logCalls = vi.mocked(console.log).mock.calls;
      expect(logCalls.length).toBeGreaterThan(0);
      const lastCall = logCalls[logCalls.length - 1];
      expect(lastCall.some(arg => typeof arg === 'string' && arg.includes('[TEST]'))).toBe(true);
    });

    it('should handle info with arguments', () => {
      consoleCompatible.info!('Info message', { data: 'test' });

      const logCalls = vi.mocked(console.log).mock.calls;
      const lastCall = logCalls[logCalls.length - 1];
      expect(lastCall.some(arg => typeof arg === 'string' && arg.includes('Info message'))).toBe(true);
    });

    it('should handle warn with no arguments', () => {
      consoleCompatible.warn!();

      // warn은 console.warn을 사용
      const warnCalls = vi.mocked(console.warn).mock.calls;
      expect(warnCalls.length).toBeGreaterThan(0);
      const lastCall = warnCalls[warnCalls.length - 1];
      expect(lastCall.some(arg => typeof arg === 'string' && arg.includes('[TEST]'))).toBe(true);
    });

    it('should handle warn with arguments', () => {
      consoleCompatible.warn!('Warning', 'additional info');

      // warn은 console.warn을 사용
      const warnCalls = vi.mocked(console.warn).mock.calls;
      expect(warnCalls.length).toBeGreaterThan(0);
      const lastCall = warnCalls[warnCalls.length - 1];
      expect(lastCall.some(arg => typeof arg === 'string' && arg.includes('Warning'))).toBe(true);
    });

    it('should handle error with no arguments', () => {
      consoleCompatible.error!();

      // error는 console.error를 사용
      const errorCalls = vi.mocked(console.error).mock.calls;
      expect(errorCalls.length).toBeGreaterThan(0);
      const lastCall = errorCalls[errorCalls.length - 1];
      expect(lastCall.some(arg => typeof arg === 'string' && arg.includes('[TEST]'))).toBe(true);
    });

    it('should handle error with arguments', () => {
      const error = new Error('Test error');
      consoleCompatible.error!('Error occurred', error);

      // error는 console.error를 사용
      const errorCalls = vi.mocked(console.error).mock.calls;
      expect(errorCalls.length).toBeGreaterThan(0);
      const lastCall = errorCalls[errorCalls.length - 1];
      expect(lastCall.some(arg => typeof arg === 'string' && arg.includes('Error occurred'))).toBe(true);
    });

    it('should handle log method', () => {
      consoleCompatible.log!('Log message', 123, { key: 'value' });

      const logCalls = vi.mocked(console.log).mock.calls;
      const lastCall = logCalls[logCalls.length - 1];
      expect(lastCall.some(arg => typeof arg === 'string' && arg.includes('Log message'))).toBe(true);
    });
  });

  describe('Group methods', () => {
    it('should handle group with no arguments', () => {
      consoleCompatible.group!();

      // group은 console.group을 사용
      const groupCalls = vi.mocked(console.group).mock.calls;
      expect(groupCalls.length).toBeGreaterThan(0);
    });

    it('should handle group with title only', () => {
      consoleCompatible.group!('Group Title');

      // group은 console.group을 사용
      const groupCalls = vi.mocked(console.group).mock.calls;
      expect(groupCalls.length).toBeGreaterThan(0);
      const lastCall = groupCalls[groupCalls.length - 1];
      expect(lastCall.some(arg => typeof arg === 'string' && arg.includes('Group Title'))).toBe(true);
    });

    it('should handle group with title and metadata', () => {
      consoleCompatible.group!('Group', { meta: 'data' });

      // group은 console.group을 사용
      const groupCalls = vi.mocked(console.group).mock.calls;
      expect(groupCalls.length).toBeGreaterThan(0);
      const lastCall = groupCalls[groupCalls.length - 1];
      expect(lastCall.some(arg => typeof arg === 'string' && arg.includes('Group'))).toBe(true);

      // metadata는 table로 출력됨
      const tableCalls = vi.mocked(console.table).mock.calls;
      expect(tableCalls.length).toBeGreaterThan(0);
    });

    it('should handle group with non-object second parameter', () => {
      consoleCompatible.group!('Group', 'string value', 123);

      // group은 console.group을 사용
      const groupCalls = vi.mocked(console.group).mock.calls;
      expect(groupCalls.length).toBeGreaterThan(0);
      const lastCall = groupCalls[groupCalls.length - 1];
      expect(lastCall.some(arg => typeof arg === 'string' && arg.includes('Group'))).toBe(true);
    });

    it('should handle groupEnd', () => {
      consoleCompatible.group!('Test Group');
      consoleCompatible.groupEnd!();

      // groupEnd는 console.groupEnd를 사용
      const groupEndCalls = vi.mocked(console.groupEnd).mock.calls;
      expect(groupEndCalls.length).toBeGreaterThan(0);
    });

    it('should handle groupCollapsed with no arguments', () => {
      consoleCompatible.groupCollapsed!();

      // groupCollapsed는 group으로 대체되므로 console.group을 사용
      const groupCalls = vi.mocked(console.group).mock.calls;
      expect(groupCalls.length).toBeGreaterThan(0);
    });

    it('should handle groupCollapsed with arguments', () => {
      consoleCompatible.groupCollapsed!('Collapsed Group', { data: 'test' });

      // groupCollapsed는 group으로 대체되므로 console.group을 사용
      const groupCalls = vi.mocked(console.group).mock.calls;
      expect(groupCalls.length).toBeGreaterThan(0);
      const lastCall = groupCalls[groupCalls.length - 1];
      expect(lastCall.some(arg => typeof arg === 'string' && arg.includes('Collapsed Group'))).toBe(true);
    });
  });

  describe('Performance methods', () => {
    it('should handle time and timeEnd', () => {
      consoleCompatible.time!('Timer');

      // 약간의 지연 추가
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait 10ms
      }

      consoleCompatible.timeEnd!('Timer');

      // timeEnd는 console.timeEnd를 사용
      const timeEndCalls = vi.mocked(console.timeEnd).mock.calls;
      expect(timeEndCalls.length).toBeGreaterThan(0);
      const timeEndCall = timeEndCalls[timeEndCalls.length - 1];
      expect(timeEndCall[0]).toContain('Timer');
    });

    it('should handle timeLog', () => {
      if (console.timeLog) {
        consoleCompatible.timeLog!('TestLabel', 'additional data');

        expect(vi.mocked(console.timeLog).mock.calls.length).toBe(1);
        expect(vi.mocked(console.timeLog).mock.calls[0][0]).toBe('TestLabel');
        expect(vi.mocked(console.timeLog).mock.calls[0][1]).toBe('additional data');
      } else {
        // Node.js 환경에서 timeLog가 없을 수 있음
        expect(() => {
          consoleCompatible.timeLog!('TestLabel', 'additional data');
        }).not.toThrow();
      }
    });
  });

  describe('Delegated console methods', () => {
    it('should delegate table to original console', () => {
      const data = { key: 'value' };
      consoleCompatible.table!(data);

      expect(vi.mocked(console.table).mock.calls.length).toBeGreaterThan(0);
    });

    it('should delegate clear to original console', () => {
      consoleCompatible.clear!();

      expect(vi.mocked(console.clear).mock.calls.length).toBe(1);
    });

    it('should delegate trace to original console', () => {
      consoleCompatible.trace!('Trace message');

      expect(vi.mocked(console.trace).mock.calls.length).toBe(1);
      expect(vi.mocked(console.trace).mock.calls[0][0]).toBe('Trace message');
    });

    it('should delegate dir to original console', () => {
      const obj = { test: 'value' };
      consoleCompatible.dir!(obj);

      expect(vi.mocked(console.dir).mock.calls.length).toBe(1);
      expect(vi.mocked(console.dir).mock.calls[0][0]).toBe(obj);
    });

    it('should delegate dirxml to original console', () => {
      if (console.dirxml) {
        const element = { xml: 'element' };
        consoleCompatible.dirxml!(element);

        expect(vi.mocked(console.dirxml).mock.calls.length).toBe(1);
        expect(vi.mocked(console.dirxml).mock.calls[0][0]).toBe(element);
      } else {
        expect(() => consoleCompatible.dirxml!({ xml: 'element' })).not.toThrow();
      }
    });

    it('should delegate count to original console', () => {
      if (console.count) {
        consoleCompatible.count!('Counter');

        expect(vi.mocked(console.count).mock.calls.length).toBe(1);
        expect(vi.mocked(console.count).mock.calls[0][0]).toBe('Counter');
      } else {
        expect(() => consoleCompatible.count!('Counter')).not.toThrow();
      }
    });

    it('should delegate countReset to original console', () => {
      if (console.countReset) {
        consoleCompatible.countReset!('Counter');

        expect(vi.mocked(console.countReset).mock.calls.length).toBe(1);
        expect(vi.mocked(console.countReset).mock.calls[0][0]).toBe('Counter');
      } else {
        expect(() => consoleCompatible.countReset!('Counter')).not.toThrow();
      }
    });

    it('should delegate assert to original console', () => {
      if (console.assert) {
        consoleCompatible.assert!(false, 'Assertion failed');

        expect(vi.mocked(console.assert).mock.calls.length).toBe(1);
        expect(vi.mocked(console.assert).mock.calls[0][0]).toBe(false);
        expect(vi.mocked(console.assert).mock.calls[0][1]).toBe('Assertion failed');
      } else {
        expect(() => consoleCompatible.assert!(false, 'Assertion failed')).not.toThrow();
      }
    });

    it('should delegate profile to original console', () => {
      if (console.profile) {
        consoleCompatible.profile!('Profile');

        expect(vi.mocked(console.profile).mock.calls.length).toBe(1);
        expect(vi.mocked(console.profile).mock.calls[0][0]).toBe('Profile');
      } else {
        expect(() => consoleCompatible.profile!('Profile')).not.toThrow();
      }
    });

    it('should delegate profileEnd to original console', () => {
      if (console.profileEnd) {
        consoleCompatible.profileEnd!('Profile');

        expect(vi.mocked(console.profileEnd).mock.calls.length).toBe(1);
        expect(vi.mocked(console.profileEnd).mock.calls[0][0]).toBe('Profile');
      } else {
        expect(() => consoleCompatible.profileEnd!('Profile')).not.toThrow();
      }
    });

    it('should delegate timeStamp to original console', () => {
      if (console.timeStamp) {
        consoleCompatible.timeStamp!('Timestamp');

        expect(vi.mocked(console.timeStamp).mock.calls.length).toBe(1);
        expect(vi.mocked(console.timeStamp).mock.calls[0][0]).toBe('Timestamp');
      } else {
        expect(() => consoleCompatible.timeStamp!('Timestamp')).not.toThrow();
      }
    });
  });

  describe('Console method safety', () => {
    it('should handle missing console methods gracefully', () => {
      // console 메서드를 undefined로 설정하여 테스트
      const originalTimeLog = console.timeLog;
      // @ts-expect-error: 테스트를 위해 의도적으로 undefined 설정
      console.timeLog = undefined;

      expect(() => {
        consoleCompatible.timeLog!('Label');
      }).not.toThrow();

      // 복원
      console.timeLog = originalTimeLog;
    });

    it('should handle undefined console gracefully', () => {
      // Node.js 환경에서는 console이 항상 있으므로 이 테스트는 실제로 실행되지 않을 수 있음
      const globalConsole = globalThis.console;
      // @ts-expect-error: 테스트를 위해 의도적으로 undefined 설정
      globalThis.console = undefined;

      expect(() => {
        consoleCompatible.clear!();
        consoleCompatible.trace!();
      }).not.toThrow();

      // 복원
      globalThis.console = globalConsole;
    });
  });

  describe('Integration with WebLogger features', () => {
    it('should filter sensitive data through WebLogger', () => {
      consoleCompatible.debug!('Email: user@example.com');

      const logCalls = vi.mocked(console.log).mock.calls;
      const lastCall = logCalls[logCalls.length - 1];

      // 이메일이 필터링되어야 함
      const hasEmail = lastCall.some(arg =>
        typeof arg === 'string' && arg.includes('user@example.com')
      );
      const hasFiltered = lastCall.some(arg =>
        typeof arg === 'string' && arg.includes('[EMAIL]')
      );

      expect(hasEmail).toBe(false);
      expect(hasFiltered).toBe(true);
    });

    it('should respect log level settings', () => {
      webLogger.setLogLevel('warn');

      vi.mocked(console.log).mockClear();
      vi.mocked(console.debug).mockClear();
      vi.mocked(console.info).mockClear();
      vi.mocked(console.warn).mockClear();
      vi.mocked(console.error).mockClear();

      consoleCompatible.debug!('Debug message');
      consoleCompatible.info!('Info message');

      // debug와 info는 출력되지 않아야 함
      expect(vi.mocked(console.log).mock.calls.length).toBe(0);
      expect(vi.mocked(console.debug).mock.calls.length).toBe(0);
      expect(vi.mocked(console.info).mock.calls.length).toBe(0);

      consoleCompatible.warn!('Warning message');
      consoleCompatible.error!('Error message');

      // warn과 error는 출력되어야 함 (각각의 console 메서드 사용)
      expect(vi.mocked(console.warn).mock.calls.length).toBeGreaterThan(0);
      expect(vi.mocked(console.error).mock.calls.length).toBeGreaterThan(0);
    });
  });
});