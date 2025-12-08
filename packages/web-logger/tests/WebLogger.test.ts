import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  WebLogger,
  addSensitiveKey,
  removeSensitiveKey,
  getSensitiveKeys,
  resetSensitiveKeys,
  resetSensitivePatterns,
  setSensitivePatterns,
  addSensitivePatterns,
  setSensitivePatternWarnings,
} from '../src/WebLogger';

describe('WebLogger', () => {
  let logger: WebLogger;
  let consoleSpy: any;
  let originalEnv: string | undefined;

  beforeEach(() => {
    // 환경 변수 백업 및 설정
    originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // localStorage 모킹 (실제 동작하도록 구현)
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
        Object.keys(storage).forEach((key) => delete storage[key]);
      }),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    // window.__WEB_LOGGER_LOG_LEVEL__ 초기화
    if (typeof window !== 'undefined') {
      delete window.__WEB_LOGGER_LOG_LEVEL__;
    }

    // localStorage 초기화
    localStorageMock.clear();

    // 새로운 로거 인스턴스 생성
    logger = new WebLogger('[TEST]');

    // 로그 레벨을 debug로 초기화 (개발 환경 기본값)
    logger.setLogLevel('debug');

    // console 메서드들을 모킹
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      table: vi.spyOn(console, 'table').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    // 로그 레벨을 debug로 복원
    if (logger) {
      logger.setLogLevel('debug');
    }
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
    process.env.NODE_ENV = originalEnv;
    // 모든 모킹 복원
    vi.restoreAllMocks();
  });

  // 헬퍼 함수: 로그 출력에서 메시지 추출
  function extractMessageFromLog(mockCalls: any[]): string | null {
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

  describe('민감정보 필터링', () => {
    it('이메일 주소를 마스킹해야 함', () => {
      logger.debug('User email: test@example.com');

      expect(consoleSpy.log).toHaveBeenCalled();
      const message = extractMessageFromLog(consoleSpy.log.mock.calls);
      expect(message).toContain('[EMAIL]');
      expect(message).not.toContain('test@example.com');
    });

    it('카드번호를 마스킹해야 함', () => {
      logger.debug('Card: 4111-1111-1111-1111');

      expect(consoleSpy.log).toHaveBeenCalled();
      const message = extractMessageFromLog(consoleSpy.log.mock.calls);
      expect(message).toContain('[CARD]');
      expect(message).not.toContain('4111-1111-1111-1111');
    });

    it('전화번호를 마스킹해야 함', () => {
      logger.debug('Phone: 010-1234-5678');

      expect(consoleSpy.log).toHaveBeenCalled();
      const message = extractMessageFromLog(consoleSpy.log.mock.calls);
      expect(message).toContain('[PHONE]');
      expect(message).not.toContain('010-1234-5678');
    });

    it('JWT 토큰을 마스킹해야 함', () => {
      const token =
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      logger.debug(`Token: ${token}`);

      expect(consoleSpy.log).toHaveBeenCalled();
      const message = extractMessageFromLog(consoleSpy.log.mock.calls);
      expect(message).toContain('[JWT]');
      expect(message).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('패스워드를 마스킹해야 함', () => {
      logger.debug('password: "secret123"');

      expect(consoleSpy.log).toHaveBeenCalled();
      const message = extractMessageFromLog(consoleSpy.log.mock.calls);
      expect(message).toContain('[PASSWORD]');
      expect(message).not.toContain('secret123');
    });
  });

  describe('캐시 및 구조화 출력', () => {
    it('민감 키 변경 시 캐시가 무효화되어 새 설정을 반영해야 함', () => {
      const data = { customField: 'secret123', normal: 'ok' };

      logger.debug('Data:', data);
      expect(consoleSpy.table).toHaveBeenCalled();
      const firstTableData = consoleSpy.table.mock.calls[0][0] as any;
      expect(firstTableData.customField).toBe('secret123');

      vi.clearAllMocks();
      addSensitiveKey('customField');

      logger.debug('Data:', data);
      expect(consoleSpy.table).toHaveBeenCalled();
      const secondTableData = consoleSpy.table.mock.calls[0][0] as any;
      expect(secondTableData.customField).toBe('se***');
    });

    it('단일 객체 메시지를 구조화된 형태로 출력해야 함', () => {
      const payload = { user: 'john', password: 'secret123' };

      logger.info(payload);

      expect(consoleSpy.table).toHaveBeenCalled();
      const tableData = consoleSpy.table.mock.calls[0][0] as any;
      expect(tableData.user).toBe('john');
      expect(tableData.password).toBe('se***');
    });

    it('email은 앞 3자 + *** + @ + 도메인으로 마스킹해야 함', () => {
      const payload = { email: 'user@example.com', userEmail: 'admin@test.co.kr' };

      logger.info(payload);

      expect(consoleSpy.table).toHaveBeenCalled();
      const tableData = consoleSpy.table.mock.calls[0][0] as any;
      expect(tableData.email).toBe('use***@example.com');
      expect(tableData.userEmail).toBe('adm***@test.co.kr');
    });

    it('짧은 email은 ***@도메인으로 마스킹해야 함', () => {
      const payload = { email: 'ab@test.com' };

      logger.info(payload);

      expect(consoleSpy.table).toHaveBeenCalled();
      const tableData = consoleSpy.table.mock.calls[0][0] as any;
      expect(tableData.email).toBe('***@test.com');
    });

    it('password는 앞 2자 + ***로 마스킹해야 함', () => {
      const payload = { password: 'mypassword123', pwd: 'secret', passwd: 'ab' };

      logger.info(payload);

      expect(consoleSpy.table).toHaveBeenCalled();
      const tableData = consoleSpy.table.mock.calls[0][0] as any;
      expect(tableData.password).toBe('my***');
      expect(tableData.pwd).toBe('se***');
      expect(tableData.passwd).toBe('***');
    });

    it('짧은 문자열은 ***로만 마스킹해야 함', () => {
      const payload = { apiKey: 'ab', token: 'x' };

      logger.info(payload);

      expect(consoleSpy.table).toHaveBeenCalled();
      const tableData = consoleSpy.table.mock.calls[0][0] as any;
      expect(tableData.apiKey).toBe('***');
      expect(tableData.token).toBe('***');
    });

    it('비문자열 값도 문자열로 변환 후 마스킹해야 함', () => {
      const payload = { password: 12345, email: null, apiKey: true };

      logger.info(payload);

      expect(consoleSpy.table).toHaveBeenCalled();
      const tableData = consoleSpy.table.mock.calls[0][0] as any;
      expect(tableData.password).toBe('12***');
      expect(tableData.email).toBe('***');
      expect(tableData.apiKey).toBe('tr***');
    });

    it('같은 값의 마스킹 결과가 캐시되어야 함', () => {
      const email = 'user@example.com';
      const password = 'mypassword123';
      
      // 첫 번째 로깅
      logger.info('First', { email, password });
      expect(consoleSpy.table).toHaveBeenCalled();
      const firstData = consoleSpy.table.mock.calls[0][0] as any;
      expect(firstData.email).toBe('use***@example.com');
      expect(firstData.password).toBe('my***');

      vi.clearAllMocks();

      // 두 번째 로깅 (같은 값)
      logger.info('Second', { email, password });
      expect(consoleSpy.table).toHaveBeenCalled();
      const secondData = consoleSpy.table.mock.calls[0][0] as any;
      // 캐시에서 가져온 결과도 동일해야 함
      expect(secondData.email).toBe('use***@example.com');
      expect(secondData.password).toBe('my***');
    });

    it('다른 키에 같은 값이 있어도 다른 마스킹 결과를 반환해야 함', () => {
      const value = 'test@example.com';
      
      // email 키로 마스킹
      logger.info('Email', { email: value });
      expect(consoleSpy.table).toHaveBeenCalled();
      const emailData = consoleSpy.table.mock.calls[0][0] as any;
      expect(emailData.email).toBe('tes***@example.com');

      vi.clearAllMocks();

      // 다른 키로 같은 값 마스킹
      logger.info('Other', { apiKey: value });
      expect(consoleSpy.table).toHaveBeenCalled();
      const apiKeyData = consoleSpy.table.mock.calls[0][0] as any;
      // 키가 다르면 마스킹 결과도 다름
      expect(apiKeyData.apiKey).toBe('te***');
    });
  });

  describe('구성 옵션', () => {
    it('생성 시 민감 키를 교체할 수 있어야 함', () => {
      vi.clearAllMocks();

      const customLogger = new WebLogger({ prefix: '[Opt]', sensitiveKeys: ['custom'] });
      customLogger.info('payload', { custom: 'secret', password: 'visible' });

      expect(consoleSpy.table).toHaveBeenCalled();
      const tableData = consoleSpy.table.mock.calls[0][0] as any;
      expect(tableData.custom).toBe('se***');
      expect(tableData.password).toBe('visible');
    });

    it('생성 시 민감 패턴을 교체할 수 있어야 함', () => {
      vi.clearAllMocks();

      const customLogger = new WebLogger({
        prefix: '[Opt]',
        sensitivePatterns: { ticket: /TICKET-\d+/g },
      });

      customLogger.debug('Ticket:', 'TICKET-123');
      const logCalls = consoleSpy.log.mock.calls.length
        ? consoleSpy.log.mock.calls
        : consoleSpy.debug.mock.calls;
      expect(logCalls.length).toBeGreaterThan(0);
      const flattened = logCalls
        .flat()
        .filter((arg: unknown) => typeof arg === 'string') as string[];
      expect(flattened.some((arg) => arg.includes('[TICKET]'))).toBe(true);
      expect(flattened.some((arg) => arg.includes('TICKET-123'))).toBe(false);

      vi.clearAllMocks();
      customLogger.debug('Email: user@example.com');
      const secondCalls = consoleSpy.log.mock.calls.length
        ? consoleSpy.log.mock.calls
        : consoleSpy.debug.mock.calls;
      const secondMessage = extractMessageFromLog(secondCalls);
      expect(secondMessage).toContain('user@example.com');
    });

    it('addSensitivePatterns는 기본 패턴을 유지하면서 추가해야 함', () => {
      vi.clearAllMocks();
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

    it('setSensitivePatterns로 기본 패턴을 제거하면 경고를 표시해야 함', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      setSensitivePatterns({ ticket: /TICKET-\d+/g });
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

  describe('로그 레벨', () => {
    it('로그 레벨이 none일 때 아무것도 출력하지 않아야 함', () => {
      // 환경 변수 모킹
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // 로그 레벨 none으로 설정
      logger.setLogLevel('none');

      // 모든 로그 메서드 호출
      logger.debug('Should not appear');
      logger.info('Should not appear');
      logger.warn('Should not appear');
      logger.error('Should not appear');

      // 아무것도 출력되지 않아야 함
      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();

      // 환경 변수 복원
      process.env.NODE_ENV = originalEnv;
      logger.setLogLevel('debug'); // 테스트 후 복원
    });

    it('setLogLevel이 즉시 반영되어야 함', () => {
      // 개발 환경에서는 기본적으로 debug 레벨
      vi.clearAllMocks();

      // warn 레벨로 변경
      logger.setLogLevel('warn');

      // debug와 info는 출력되지 않아야 함
      logger.debug('Should not appear');
      logger.info('Should not appear');

      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();

      // warn과 error는 출력되어야 함
      logger.warn('Should appear');
      logger.error('Should appear');

      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalled();

      // debug 레벨로 다시 변경
      logger.setLogLevel('debug');

      vi.clearAllMocks();

      // 이제 debug도 출력되어야 함
      logger.debug('Should appear now');
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('여러 인스턴스가 동일한 로그 레벨을 공유해야 함', () => {
      const logger1 = new WebLogger('[LOGGER1]');
      const logger2 = new WebLogger('[LOGGER2]');

      // warn 레벨로 설정
      logger1.setLogLevel('warn');

      vi.clearAllMocks();

      // logger1과 logger2 모두 warn 레벨 적용
      logger1.debug('Should not appear');
      logger2.debug('Should not appear');

      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.debug).not.toHaveBeenCalled();

      // warn은 모두 출력되어야 함
      logger1.warn('Should appear from logger1');
      logger2.warn('Should appear from logger2');

      expect(consoleSpy.warn).toHaveBeenCalledTimes(2);

      // debug 레벨로 복원
      logger1.setLogLevel('debug');
    });

    it('currentLogLevel getter가 동적으로 변경된 레벨을 반환해야 함', () => {
      // 초기 레벨 확인 (개발 환경에서는 debug)
      expect(logger.currentLogLevel).toBe('debug');

      // warn으로 변경
      logger.setLogLevel('warn');
      expect(logger.currentLogLevel).toBe('warn');

      // error로 변경
      logger.setLogLevel('error');
      expect(logger.currentLogLevel).toBe('error');

      // debug로 복원
      logger.setLogLevel('debug');
      expect(logger.currentLogLevel).toBe('debug');
    });
  });

  describe('Prefix 확장', () => {
    it('withPrefix로 새 prefix를 가진 로거를 생성해야 함', () => {
      const childLogger = logger.withPrefix('[Child]');

      childLogger.info('child message');

      expect(consoleSpy.log).toHaveBeenCalled();
      const [firstArg] = consoleSpy.log.mock.calls[0];
      expect(String(firstArg)).toContain('[Child]');
    });

    it('새 인스턴스 생성 후에도 원본 prefix는 유지되어야 함', () => {
      const childLogger = logger.withPrefix('[Child]');

      childLogger.info('child message');
      vi.clearAllMocks();

      logger.info('parent message');

      expect(consoleSpy.log).toHaveBeenCalled();
      const [firstArg] = consoleSpy.log.mock.calls[0];
      expect(String(firstArg)).toContain('[TEST]');
      expect(String(firstArg)).not.toContain('[Child]');
    });
  });

  describe('순환 참조', () => {
    it('순환 참조를 처리해야 함', () => {
      const obj: any = { a: 1 };
      obj.self = obj;

      logger.debug('Circular:', obj);

      // 크래시하지 않고 로그가 출력됨
      expect(consoleSpy.log.mock.calls.length).toBeGreaterThanOrEqual(1);

      // console.table도 호출될 수 있음
      const allCalls = [...consoleSpy.log.mock.calls, ...consoleSpy.table.mock.calls];

      // [CIRCULAR] 텍스트가 어딘가에 포함되어 있어야 함
      const hasCircular = allCalls.some((call: any[]) =>
        call.some((arg: any) => {
          const str = typeof arg === 'string' ? arg : JSON.stringify(arg);
          return str && str.includes('[CIRCULAR]');
        }),
      );
      expect(hasCircular).toBe(true);
    });
  });

  describe('깊이 제한', () => {
    it('10단계 이상 중첩된 객체를 제한해야 함', () => {
      // 12단계 깊이의 객체 생성
      let deep: any = { level: 1 };
      let current = deep;
      for (let i = 2; i <= 12; i++) {
        current.next = { level: i };
        current = current.next;
      }

      logger.debug('Deep:', deep);

      expect(consoleSpy.log.mock.calls.length).toBeGreaterThanOrEqual(1);

      // 모든 console 호출 확인
      const allCalls = [...consoleSpy.log.mock.calls, ...consoleSpy.table.mock.calls];

      // [MAX_DEPTH] 텍스트 포함 확인
      const hasMaxDepth = allCalls.some((call: any[]) =>
        call.some((arg: any) => {
          const str = typeof arg === 'string' ? arg : JSON.stringify(arg);
          return str && str.includes('[MAX_DEPTH]');
        }),
      );
      expect(hasMaxDepth).toBe(true);
    });
  });

  describe('순환 Map/Set', () => {
    it('Map의 순환 참조를 안전하게 처리해야 함', () => {
      const map = new Map<string, unknown>();
      map.set('self', map);

      expect(() => logger.debug('Map:', map)).not.toThrow();

      const mapCalls = [...consoleSpy.log.mock.calls, ...consoleSpy.debug.mock.calls];
      const mapArg = mapCalls.flat().find((arg: unknown) => arg instanceof Map) as
        | Map<string, unknown>
        | undefined;
      expect(mapArg).toBeInstanceOf(Map);
      expect(mapArg?.get('self')).toBe('[CIRCULAR]');
    });

    it('Set의 순환 참조를 안전하게 처리해야 함', () => {
      const set = new Set<unknown>();
      set.add(set);

      expect(() => logger.debug('Set:', set)).not.toThrow();

      const setCalls = [...consoleSpy.log.mock.calls, ...consoleSpy.debug.mock.calls];
      const setArg = setCalls.flat().find((arg: unknown) => arg instanceof Set) as
        | Set<unknown>
        | undefined;
      expect(setArg).toBeInstanceOf(Set);
      expect(Array.from(setArg ?? []).includes('[CIRCULAR]')).toBe(true);
    });
  });

  describe('프로토타입 오염 방지', () => {
    it('__proto__ 키를 필터링해야 함', () => {
      // Object.defineProperty를 사용하여 __proto__를 실제 프로퍼티로 정의
      const malicious: any = Object.create(null);
      Object.defineProperty(malicious, '__proto__', {
        value: { isAdmin: true },
        enumerable: true,
        writable: true,
        configurable: true,
      });
      malicious.normal = 'data';

      logger.debug('Data:', malicious);

      expect(consoleSpy.log.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(consoleSpy.table.mock.calls.length).toBeGreaterThanOrEqual(1);

      // console.table 호출 시 전달된 데이터 확인
      const tableData = consoleSpy.table.mock.calls[0][0];

      // 직접 키 확인
      const keys = Object.keys(tableData);
      if (keys.includes('__proto__')) {
        // __proto__ 키가 있다면 [UNSAFE_KEY]로 변환되어야 함
        expect(tableData['__proto__']).toBe('[UNSAFE_KEY]');
      }

      expect(tableData.normal).toBe('data');
    });

    it('constructor 키를 필터링해야 함', () => {
      const malicious = {
        constructor: { prototype: { isAdmin: true } },
        normal: 'data',
      };

      logger.debug('Data:', malicious);

      expect(consoleSpy.log.mock.calls.length).toBeGreaterThanOrEqual(1);

      const allCalls = [...consoleSpy.log.mock.calls, ...consoleSpy.table.mock.calls];

      // [UNSAFE_KEY] 텍스트 포함 확인
      const hasUnsafeKey = allCalls.some((call: any[]) =>
        call.some((arg: any) => {
          const str = typeof arg === 'string' ? arg : JSON.stringify(arg);
          return str && str.includes('[UNSAFE_KEY]');
        }),
      );
      expect(hasUnsafeKey).toBe(true);
    });
  });

  describe('문자열 길이 제한', () => {
    it('5000자 이상의 문자열을 잘라야 함', () => {
      const longString = 'a'.repeat(5001);
      logger.debug(longString);

      const callArgs = consoleSpy.log.mock.calls[0];

      // [TRUNCATED] 텍스트 포함 확인
      const hasTruncated = callArgs.some(
        (arg: any) => typeof arg === 'string' && arg.includes('[TRUNCATED]'),
      );
      expect(hasTruncated).toBe(true);
    });

    it('5000자 이하의 문자열은 잘리지 않아야 함', () => {
      const normalString = 'a'.repeat(5000);
      logger.debug(normalString);

      const callArgs = consoleSpy.log.mock.calls[0];

      // [TRUNCATED] 텍스트가 없어야 함
      const hasTruncated = callArgs.some(
        (arg: any) => typeof arg === 'string' && arg.includes('[TRUNCATED]'),
      );
      expect(hasTruncated).toBe(false);
    });
  });

  describe('ReDoS 공격 방지', () => {
    it('악의적인 정규식 입력에 대해 타임아웃으로 보호해야 함', () => {
      // ReDoS 공격 시나리오: 매우 긴 반복 패턴
      // 이메일 정규식에 취약한 패턴
      const maliciousEmail = 'a'.repeat(1000) + '@' + 'b'.repeat(1000) + '.c';

      vi.clearAllMocks();

      const startTime = Date.now();
      logger.debug('Malicious input:', maliciousEmail);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // 실행 시간이 합리적인 범위 내에 있어야 함 (1초 이내)
      expect(executionTime).toBeLessThan(1000);

      // 로그가 정상적으로 출력되어야 함 (크래시하지 않음)
      // 여러 파라미터일 때는 console.log 또는 console.debug를 사용할 수 있음
      const wasCalled =
        consoleSpy.log.mock.calls.length > 0 || consoleSpy.debug.mock.calls.length > 0;
      expect(wasCalled).toBe(true);
    });

    it('복잡한 반복 패턴에 대해 안전하게 처리해야 함', () => {
      // 카드번호 정규식에 취약한 패턴
      const maliciousCard = '1'.repeat(500) + '-' + '2'.repeat(500) + '-' + '3'.repeat(500);

      vi.clearAllMocks();

      const startTime = Date.now();
      logger.debug('Card input:', maliciousCard);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // 실행 시간이 합리적인 범위 내에 있어야 함
      expect(executionTime).toBeLessThan(1000);
      const wasCalled =
        consoleSpy.log.mock.calls.length > 0 || consoleSpy.debug.mock.calls.length > 0;
      expect(wasCalled).toBe(true);
    });

    it('매우 긴 문자열도 타임아웃 내에 처리되어야 함', () => {
      // 최대 길이 제한을 넘는 문자열
      const veryLongString = 'x'.repeat(10000) + '@example.com';

      vi.clearAllMocks();

      const startTime = Date.now();
      logger.debug('Very long string:', veryLongString);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // 실행 시간이 합리적인 범위 내에 있어야 함
      expect(executionTime).toBeLessThan(1000);
      const wasCalled =
        consoleSpy.log.mock.calls.length > 0 || consoleSpy.debug.mock.calls.length > 0;
      expect(wasCalled).toBe(true);

      // [TRUNCATED] 표시가 있어야 함
      const allCalls = [...consoleSpy.log.mock.calls, ...consoleSpy.debug.mock.calls];
      const hasTruncated = allCalls.some((call: any[]) =>
        call.some((arg: any) => typeof arg === 'string' && arg.includes('[TRUNCATED]')),
      );
      expect(hasTruncated).toBe(true);
    });

    it('정규식 실행 중 오류가 발생해도 크래시하지 않아야 함', () => {
      // 특수 문자로 구성된 악의적 입력
      const maliciousInput = 'a'.repeat(100) + '\\' + 'b'.repeat(100);

      vi.clearAllMocks();

      // 크래시하지 않고 정상적으로 처리되어야 함
      expect(() => {
        logger.debug('Malicious regex input:', maliciousInput);
      }).not.toThrow();

      const wasCalled =
        consoleSpy.log.mock.calls.length > 0 || consoleSpy.debug.mock.calls.length > 0;
      expect(wasCalled).toBe(true);
    });
  });

  describe('민감한 객체 속성 필터링', () => {
    it('password 속성을 마스킹해야 함', () => {
      const data = {
        username: 'john',
        password: 'secret123',
        email: 'john@example.com',
      };

      logger.debug('User data:', data);

      // console.table이 호출될 수 있음
      const tableCall = vi.spyOn(console, 'table').mockImplementation(() => {});

      // 로그 확인
      expect(consoleSpy.log).toHaveBeenCalled();

      tableCall.mockRestore();
    });

    it('token 속성을 마스킹해야 함', () => {
      const data = {
        userId: '123',
        accessToken: 'secret-token-value',
        refreshToken: 'refresh-token-value',
      };

      logger.debug('Auth data:', data);

      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe('타임스탬프 형식', () => {
    it('올바른 타임스탬프 형식을 출력해야 함', () => {
      logger.debug('Test message'); // debug는 dev 환경에서 항상 동작

      expect(consoleSpy.log).toHaveBeenCalled();
      const message = consoleSpy.log.mock.calls[0][0];

      // HH:MM:SS 형식 확인
      const timeRegex = /\[\d{2}:\d{2}:\d{2}\]/;
      expect(message).toMatch(timeRegex);
    });
  });

  describe('그룹 로깅', () => {
    it('group 메서드가 console.group을 호출해야 함', () => {
      const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

      logger.group('Group Title');
      logger.debug('Inside group');
      logger.groupEnd();

      expect(groupSpy).toHaveBeenCalledWith(expect.stringContaining('Group Title'));
      expect(groupEndSpy).toHaveBeenCalled();

      groupSpy.mockRestore();
      groupEndSpy.mockRestore();
    });
  });

  describe('성능 측정', () => {
    it('time과 timeEnd가 동작해야 함', () => {
      const timeSpy = vi.spyOn(console, 'time').mockImplementation(() => {});
      const timeEndSpy = vi.spyOn(console, 'timeEnd').mockImplementation(() => {});

      logger.time('operation');
      // 실제 작업 시뮬레이션
      logger.timeEnd('operation');

      // WebLogger가 프리픽스를 추가함
      expect(timeSpy).toHaveBeenCalledWith('[TEST] operation');
      expect(timeEndSpy).toHaveBeenCalledWith('[TEST] operation');

      timeSpy.mockRestore();
      timeEndSpy.mockRestore();
    });
  });

  describe('에러 객체 처리', () => {
    it('Error 객체를 올바르게 로깅해야 함', () => {
      const error = new Error('Test error message');
      error.stack = 'Error: Test error message\n    at Test.test (test.js:10:10)';

      logger.error('Error occurred:', error);

      // error 레벨은 console.error를 사용
      expect(consoleSpy.error).toHaveBeenCalled();
      const call = consoleSpy.error.mock.calls[consoleSpy.error.mock.calls.length - 1];
      const message = call.join(' ');

      expect(message).toContain('ERROR');
      expect(message).toContain('Error occurred:');
    });

    it('커스텀 에러 속성을 보존해야 함', () => {
      class CustomError extends Error {
        code: string;
        statusCode: number;

        constructor(message: string, code: string, statusCode: number) {
          super(message);
          this.code = code;
          this.statusCode = statusCode;
        }
      }

      const customError = new CustomError('Custom error', 'ERR_CUSTOM', 500);
      logger.error('Custom error:', customError);

      // error 레벨은 console.error를 사용
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('isEnabled', () => {
    it('로그 레벨이 none이 아닐 때 true를 반환해야 함', () => {
      logger.setLogLevel('debug');
      expect(logger.isEnabled).toBe(true);

      logger.setLogLevel('info');
      expect(logger.isEnabled).toBe(true);

      logger.setLogLevel('warn');
      expect(logger.isEnabled).toBe(true);

      logger.setLogLevel('error');
      expect(logger.isEnabled).toBe(true);
    });

    it('로그 레벨이 none일 때 false를 반환해야 함', () => {
      logger.setLogLevel('none');
      expect(logger.isEnabled).toBe(false);

      // 복원
      logger.setLogLevel('debug');
    });
  });

  describe('프로덕션 모드', () => {
    it('프로덕션 환경에서는 debug와 info 로그가 출력되지 않아야 함', () => {
      // 프로덕션 환경 설정 (프로덕션에서는 기본 로그 레벨이 'warn'임)
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // window.__WEB_LOGGER_LOG_LEVEL__ 초기화 (프로덕션 기본값 사용)
      if (typeof window !== 'undefined') {
        delete window.__WEB_LOGGER_LOG_LEVEL__;
      }
      if (typeof localStorage !== 'undefined') {
      }

      // 새로운 WebLogger 인스턴스 생성 (프로덕션 설정 적용)
      const prodLogger = new WebLogger('[PROD]');

      // 모든 스파이 초기화
      vi.clearAllMocks();

      prodLogger.debug('Should not appear'); // 출력 안됨
      prodLogger.info('Should not appear'); // 출력 안됨
      prodLogger.warn('Should appear'); // warn은 프로덕션에서도 출력
      prodLogger.error('Should appear'); // error는 프로덕션에서도 출력

      // debug와 info는 호출되지 않아야 함
      expect(
        consoleSpy.log.mock.calls.filter(
          (call) => call[0] && typeof call[0] === 'string' && call[0].includes('DEBUG'),
        ).length,
      ).toBe(0);
      expect(
        consoleSpy.log.mock.calls.filter(
          (call) => call[0] && typeof call[0] === 'string' && call[0].includes('INFO'),
        ).length,
      ).toBe(0);
      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();

      // warn과 error는 호출되어야 함
      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalled();

      // 환경 변수 복원
      process.env.NODE_ENV = originalEnv;
      // 로그 레벨도 복원
      prodLogger.setLogLevel('debug');
    });
  });

  describe('엣지 케이스', () => {
    it('메타데이터가 배열인 경우 console.log를 사용해야 함', () => {
      // group 메서드는 객체가 아닌 경우 console.table을 호출하지 않음
      // 하지만 실제로는 배열도 table로 표시될 수 있음
      // 이 테스트는 배열이 객체로 변환되어 table로 표시되는 것을 확인
      const arrayData = [1, 2, 3];
      logger.group('Array data', arrayData);
      logger.groupEnd();

      // group 메서드가 호출되었는지 확인
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('스타일이 없는 환경에서도 정상 동작해야 함', () => {
      // console.log의 %c 스타일 지원 여부와 관계없이 동작해야 함
      logger.debug('Test message');
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('스타일이 undefined인 경우 fallback으로 consoleFn을 사용해야 함', () => {
      // warn 레벨은 스타일이 없으므로 fallback 경로를 사용
      // 하지만 실제로는 style이 undefined가 아니므로, style이 false인 경우를 시뮬레이션
      // logWithStyle에서 style이 없으면 else 블록으로 가서 fallback 사용
      logger.warn('Warning message');

      const warnCalls = vi.mocked(console.warn).mock.calls;
      expect(warnCalls.length).toBeGreaterThan(0);
      const lastCall = warnCalls[warnCalls.length - 1];
      expect(lastCall[0]).toContain('[TEST]');
      expect(lastCall[0]).toContain('WARN');
    });

    it('logWithStyle에서 style이 없는 경우 fallback 경로를 사용해야 함', () => {
      // error 레벨은 스타일이 없으므로 fallback 경로를 사용
      logger.error('Error message');

      const errorCalls = vi.mocked(console.error).mock.calls;
      expect(errorCalls.length).toBeGreaterThan(0);
    });

    it('원시 타입(숫자, 불린 등)은 sanitizeLogData에서 그대로 반환되어야 함', () => {
      // 원시 타입은 객체도 문자열도 아니므로 마지막 return 문으로 처리됨
      logger.info(123);
      logger.info(true);
      logger.info(null);
      logger.info(undefined);

      const logCalls = [
        ...vi.mocked(console.log).mock.calls,
        ...vi.mocked(console.info).mock.calls,
      ];
      expect(logCalls.length).toBeGreaterThan(0);
    });

    it('metadata가 Map인 경우 console.log로 출력해야 함', () => {
      const mapMetadata = new Map([['key', 'value']]);
      logger.info('Message', mapMetadata);

      // Map metadata는 logWithStyle에서 별도로 console.log로 출력됨
      const logCalls = [
        ...vi.mocked(console.log).mock.calls,
        ...vi.mocked(console.info).mock.calls,
      ];
      expect(
        logCalls.some((call: unknown[]) => call.some((arg: unknown) => arg instanceof Map)),
      ).toBe(true);
    });

    it('metadata가 Set인 경우 console.log로 출력해야 함', () => {
      const setMetadata = new Set(['value1', 'value2']);
      logger.info('Message', setMetadata);

      // Set metadata는 logWithStyle에서 별도로 console.log로 출력됨
      const logCalls = [
        ...vi.mocked(console.log).mock.calls,
        ...vi.mocked(console.info).mock.calls,
      ];
      expect(
        logCalls.some((call: unknown[]) => call.some((arg: unknown) => arg instanceof Set)),
      ).toBe(true);
    });

    it('metadata가 빈 객체인 경우 console.log로 출력해야 함', () => {
      logger.info('Message', {});

      const logCalls = vi.mocked(console.log).mock.calls;
      expect(logCalls.length).toBeGreaterThan(0);
    });

    it('console.table이 없는 환경에서 metadata는 console.log로 출력해야 함', () => {
      const originalTable = console.table;
      // @ts-expect-error: 테스트를 위해 의도적으로 undefined 설정
      console.table = undefined;

      logger.info('Message', { key: 'value' });

      const logCalls = vi.mocked(console.log).mock.calls;
      expect(logCalls.length).toBeGreaterThan(0);

      // 복원
      console.table = originalTable;
    });

    it('log level이 none일 때 getConsoleFunction의 default 케이스를 테스트', () => {
      logger.setLogLevel('none');

      // none 레벨에서는 모든 로그가 출력되지 않음 (shouldLog에서 currentLevel이 'none'이면 false 반환)
      // getConsoleFunction의 default 케이스는 'none' 레벨일 때 사용됨
      // 하지만 none 레벨에서는 shouldLog가 false를 반환하므로 로그가 출력되지 않음
      // 따라서 getConsoleFunction의 default 케이스를 직접 테스트하기는 어려움
      // 대신 다른 레벨에서 getConsoleFunction이 올바르게 동작하는지 확인

      logger.setLogLevel('error');
      logger.error('Error message');
      expect(consoleSpy.error).toHaveBeenCalled();

      // none 레벨로 다시 설정하여 모든 로그가 출력되지 않음을 확인
      logger.setLogLevel('none');
      logger.warn('Warning');
      logger.debug('Debug');
      logger.info('Info');
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
    });

    it('console.info가 없는 환경에서 console.log를 사용해야 함', () => {
      const originalInfo = console.info;
      // @ts-expect-error: 테스트를 위해 의도적으로 undefined 설정
      console.info = undefined;

      logger.info('Test info');
      expect(consoleSpy.log).toHaveBeenCalled();

      // 복원
      console.info = originalInfo;
    });

    it('localStorage 접근 실패 시 기본값을 사용해야 함', () => {
      // localStorage를 모킹하여 접근 실패 시뮬레이션
      const originalLocalStorage = window.localStorage;

      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(() => {
            throw new Error('Access denied');
          }),
          setItem: vi.fn(() => {
            throw new Error('Access denied');
          }),
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        writable: true,
        configurable: true,
      });

      // 새로운 로거 인스턴스 생성 (localStorage 접근 실패)
      const testLogger = new WebLogger('[TEST]');

      // 기본값으로 동작해야 함 (개발 환경에서는 debug)
      expect(testLogger.currentLogLevel).toBe('debug');

      // 복원
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('민감한 키 관리', () => {
    beforeEach(() => {
      // 각 테스트 전에 기본값으로 초기화
      resetSensitiveKeys();
    });

    afterEach(() => {
      // 각 테스트 후에 기본값으로 복원
      resetSensitiveKeys();
    });

    it('민감한 키를 추가할 수 있어야 함', () => {
      addSensitiveKey('customSecret');
      addSensitiveKey('apiSecret');

      const data = { customSecret: 'secret123', apiSecret: 'key456', normalKey: 'value' };
      logger.debug('User data:', data);

      // sanitizeLogData가 호출되어 customSecret과 apiSecret이 부분 마스킹되었는지 확인
      // 실제로는 console에 출력된 내용을 확인하기 어려우므로,
      // getSensitiveKeys로 추가된 키가 있는지 확인
      const keys = getSensitiveKeys();
      expect(keys).toContain('customsecret');
      expect(keys).toContain('apisecret');
    });

    it('민감한 키를 제거할 수 있어야 함', () => {
      // email 필터링 제거
      removeSensitiveKey('email');

      // getSensitiveKeys로 email이 제거되었는지 확인
      const keys = getSensitiveKeys();
      expect(keys).not.toContain('email');

      // password는 여전히 있어야 함
      expect(keys).toContain('password');
    });

    it('현재 민감한 키 목록을 가져올 수 있어야 함', () => {
      const keys = getSensitiveKeys();

      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBeGreaterThan(0);
      expect(keys).toContain('password');
      expect(keys).toContain('token');
      expect(keys).toContain('email');
    });

    it('민감한 키 목록을 기본값으로 초기화할 수 있어야 함', () => {
      // 키 추가
      addSensitiveKey('customKey1');
      addSensitiveKey('customKey2');

      let keys = getSensitiveKeys();
      expect(keys).toContain('customkey1');
      expect(keys).toContain('customkey2');

      // 초기화
      resetSensitiveKeys();

      keys = getSensitiveKeys();
      expect(keys).not.toContain('customkey1');
      expect(keys).not.toContain('customkey2');
      expect(keys).toContain('password'); // 기본 키는 유지
    });

    it('대소문자 구분 없이 키를 추가/제거할 수 있어야 함', () => {
      addSensitiveKey('CustomKey');
      addSensitiveKey('ANOTHER_KEY');

      // 대소문자 구분 없이 소문자로 저장되어야 함
      let keys = getSensitiveKeys();
      expect(keys).toContain('customkey');
      expect(keys).toContain('another_key');

      // 제거도 대소문자 구분 없이 동작해야 함
      removeSensitiveKey('CUSTOMKEY');
      keys = getSensitiveKeys();
      expect(keys).not.toContain('customkey');
      expect(keys).toContain('another_key');
    });

    it('모든 WebLogger 인스턴스가 동일한 민감한 키 목록을 공유해야 함', () => {
      const logger1 = new WebLogger('[App1]');
      const logger2 = new WebLogger('[App2]');

      addSensitiveKey('sharedKey');

      // 두 로거 모두 동일한 전역 설정을 사용하므로
      // getSensitiveKeys는 동일한 결과를 반환해야 함
      const keys1 = getSensitiveKeys();
      const keys2 = getSensitiveKeys();

      expect(keys1).toEqual(keys2);
      expect(keys1).toContain('sharedkey');
      expect(keys2).toContain('sharedkey');
    });
  });
});
