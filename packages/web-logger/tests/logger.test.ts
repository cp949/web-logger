import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebLogger } from '../src/WebLogger';
import { convertToConsoleLogger, createPrefixedLogger, getLogLevel, setLogLevel } from '../src/logger';

describe('convertToConsoleLogger', () => {
  let logger: WebLogger;
  let consoleSpy: any;

  beforeEach(() => {
    // localStorage 모킹
    const storage: Record<string, string> = {};
    const localStorageMock = {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
      }),
      clear: vi.fn(() => {
        Object.keys(storage).forEach(key => delete storage[key]);
      }),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    // window.__WEB_LOGGER_LOG_LEVEL__ 초기화
    if (typeof window !== 'undefined') {
      // @ts-expect-error: 테스트를 위해 의도적으로 속성 삭제
      delete window.__WEB_LOGGER_LOG_LEVEL__;
    }

    localStorageMock.clear();

    // 새로운 로거 인스턴스 생성
    logger = new WebLogger('[TEST]');
    logger.setLogLevel('debug');

    // console 메서드들을 모킹
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      table: vi.spyOn(console, 'table').mockImplementation(() => {}),
      group: vi.spyOn(console, 'group').mockImplementation(() => {}),
      groupEnd: vi.spyOn(console, 'groupEnd').mockImplementation(() => {}),
      time: vi.spyOn(console, 'time').mockImplementation(() => {}),
      timeEnd: vi.spyOn(console, 'timeEnd').mockImplementation(() => {}),
    };

    // 일부 메서드는 선택적으로 모킹
    if (console.profile) vi.spyOn(console, 'profile').mockImplementation(() => {});
    if (console.profileEnd) vi.spyOn(console, 'profileEnd').mockImplementation(() => {});
    if (console.timeStamp) vi.spyOn(console, 'timeStamp').mockImplementation(() => {});
  });

  afterEach(() => {
    if (logger) {
      logger.setLogLevel('debug');
    }
    if (typeof window !== 'undefined') {
      // @ts-expect-error: 테스트를 위해 의도적으로 속성 삭제
      delete window.__WEB_LOGGER_LOG_LEVEL__;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    vi.restoreAllMocks();
  });

  it('console-compatible 객체를 반환해야 함', () => {
    const consoleCompatible = convertToConsoleLogger(logger);
    
    expect(consoleCompatible).toBeDefined();
    expect(typeof consoleCompatible.debug).toBe('function');
    expect(typeof consoleCompatible.info).toBe('function');
    expect(typeof consoleCompatible.warn).toBe('function');
    expect(typeof consoleCompatible.error).toBe('function');
    expect(typeof consoleCompatible.log).toBe('function');
  });

  it('debug 메서드가 console.debug와 동일한 시그니처로 동작해야 함', () => {
    const consoleCompatible = convertToConsoleLogger(logger);
    
    // 인자 없음
    consoleCompatible.debug?.();
    // WebLogger는 debug/info일 때 console.log를 사용할 수 있으므로 둘 다 확인
    expect(consoleSpy.debug.mock.calls.length + consoleSpy.log.mock.calls.length).toBeGreaterThan(0);
    
    // 단일 인자
    consoleSpy.debug.mockClear();
    consoleSpy.log.mockClear();
    consoleCompatible.debug?.('message');
    expect(consoleSpy.debug.mock.calls.length + consoleSpy.log.mock.calls.length).toBeGreaterThan(0);
    
    // 여러 인자
    consoleSpy.debug.mockClear();
    consoleSpy.log.mockClear();
    consoleCompatible.debug?.('message', { data: 1 }, 'extra');
    expect(consoleSpy.debug.mock.calls.length + consoleSpy.log.mock.calls.length).toBeGreaterThan(0);
  });

  it('info 메서드가 console.info와 동일한 시그니처로 동작해야 함', () => {
    const consoleCompatible = convertToConsoleLogger(logger);
    
    consoleSpy.info.mockClear();
    consoleSpy.log.mockClear();
    consoleCompatible.info?.('info message', { key: 'value' });
    // WebLogger는 info일 때 console.log를 사용할 수 있으므로 둘 다 확인
    expect(consoleSpy.info.mock.calls.length + consoleSpy.log.mock.calls.length).toBeGreaterThan(0);
  });

  it('warn 메서드가 console.warn과 동일한 시그니처로 동작해야 함', () => {
    const consoleCompatible = convertToConsoleLogger(logger);
    
    consoleCompatible.warn?.('warning message', { error: true });
    expect(consoleSpy.warn).toHaveBeenCalled();
  });

  it('error 메서드가 console.error와 동일한 시그니처로 동작해야 함', () => {
    const consoleCompatible = convertToConsoleLogger(logger);
    
    consoleCompatible.error?.('error message', new Error('test'));
    expect(consoleSpy.error).toHaveBeenCalled();
  });

  it('log 메서드가 console.log와 동일한 시그니처로 동작해야 함', () => {
    const consoleCompatible = convertToConsoleLogger(logger);
    
    consoleCompatible.log?.('log message', 123, true);
    expect(consoleSpy.log).toHaveBeenCalled();
  });

  it('group 메서드가 동작해야 함', () => {
    const consoleCompatible = convertToConsoleLogger(logger);
    
    consoleCompatible.group?.('Group Title');
    expect(consoleSpy.group).toHaveBeenCalled();
    
    consoleCompatible.groupEnd?.();
    expect(consoleSpy.groupEnd).toHaveBeenCalled();
  });

  it('group 메서드가 메타데이터를 받을 수 있어야 함', () => {
    const consoleCompatible = convertToConsoleLogger(logger);
    
    consoleCompatible.group?.('Group Title', { key: 'value' });
    expect(consoleSpy.group).toHaveBeenCalled();
  });

  it('time과 timeEnd 메서드가 동작해야 함', () => {
    const consoleCompatible = convertToConsoleLogger(logger);
    
    consoleCompatible.time?.('label');
    expect(consoleSpy.time).toHaveBeenCalled();
    
    consoleCompatible.timeEnd?.('label');
    expect(consoleSpy.timeEnd).toHaveBeenCalled();
  });

  it('여러 인자를 받을 수 있어야 함', () => {
    const consoleCompatible = convertToConsoleLogger(logger);
    
    const obj1 = { a: 1 };
    const obj2 = { b: 2 };
    const obj3 = { c: 3 };
    
    consoleCompatible.debug?.('message', obj1, obj2, obj3);
    expect(consoleSpy.debug).toHaveBeenCalled();
  });

  it('인자 없이 호출할 수 있어야 함', () => {
    const consoleCompatible = convertToConsoleLogger(logger);
    
    consoleSpy.debug.mockClear();
    consoleSpy.info.mockClear();
    consoleSpy.log.mockClear();
    
    consoleCompatible.debug?.();
    consoleCompatible.info?.();
    consoleCompatible.warn?.();
    consoleCompatible.error?.();
    consoleCompatible.log?.();
    
    // debug/info는 console.log를 사용할 수 있으므로 둘 다 확인
    expect(consoleSpy.debug.mock.calls.length + consoleSpy.log.mock.calls.length).toBeGreaterThan(0);
    expect(consoleSpy.info.mock.calls.length + consoleSpy.log.mock.calls.length).toBeGreaterThan(0);
    expect(consoleSpy.warn).toHaveBeenCalled();
    expect(consoleSpy.error).toHaveBeenCalled();
    expect(consoleSpy.log).toHaveBeenCalled();
  });

  it('로그 레벨 제어가 적용되어야 함', () => {
    const consoleCompatible = convertToConsoleLogger(logger);
    
    logger.setLogLevel('error');
    
    consoleCompatible.debug?.('debug message');
    consoleCompatible.info?.('info message');
    consoleCompatible.warn?.('warn message');
    consoleCompatible.error?.('error message');
    
    // debug, info, warn은 호출되지 않아야 함
    expect(consoleSpy.debug).not.toHaveBeenCalled();
    expect(consoleSpy.info).not.toHaveBeenCalled();
    expect(consoleSpy.warn).not.toHaveBeenCalled();
    // error는 항상 호출되어야 함
    expect(consoleSpy.error).toHaveBeenCalled();
  });

  describe('getLogLevel', () => {
    it('should return current log level', () => {
      logger.setLogLevel('warn');
      expect(getLogLevel()).toBe('warn');
      
      logger.setLogLevel('debug');
      expect(getLogLevel()).toBe('debug');
    });
  });

  describe('setLogLevel from logger module', () => {
    it('should set log level via setLogLevel function', () => {
      setLogLevel('error');
      expect(getLogLevel()).toBe('error');
      
      setLogLevel('info');
      expect(getLogLevel()).toBe('info');
    });
  });

  describe('convertToConsoleLogger - additional methods', () => {
    it('should call console.profile when available', () => {
      const consoleCompatible = convertToConsoleLogger(logger);
      
      if (console.profile) {
        consoleCompatible.profile!('TestProfile');
        expect(vi.mocked(console.profile)).toHaveBeenCalledWith('TestProfile');
      }
    });

    it('should call console.profileEnd when available', () => {
      const consoleCompatible = convertToConsoleLogger(logger);
      
      if (console.profileEnd) {
        consoleCompatible.profileEnd!('TestProfile');
        expect(vi.mocked(console.profileEnd)).toHaveBeenCalledWith('TestProfile');
      }
    });

    it('should call console.timeStamp when available', () => {
      const consoleCompatible = convertToConsoleLogger(logger);
      
      if (console.timeStamp) {
        consoleCompatible.timeStamp!('TestLabel');
        expect(vi.mocked(console.timeStamp)).toHaveBeenCalledWith('TestLabel');
      }
    });
  });

  describe('createPrefixedLogger', () => {
    it('should create logger with provided prefix', () => {
      const prefixedLogger = createPrefixedLogger('[UserList]');

      prefixedLogger.info('hello users');

      expect(consoleSpy.log).toHaveBeenCalled();
      const [firstArg] = consoleSpy.log.mock.calls[0];
      expect(String(firstArg)).toContain('[UserList]');
    });

    it('should respect shared log level settings', () => {
      setLogLevel('error');
      const prefixedLogger = createPrefixedLogger('[UserList]');

      prefixedLogger.info('hello users');

      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();

      prefixedLogger.error('still logs');
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });
});
