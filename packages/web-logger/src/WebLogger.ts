import { isDevelopment } from './utils/environment';

/**
 * Web Environment Conditional Logger
 *
 * 웹 환경용 조건부 로깅 유틸리티
 * - 개발 모드에서만 활성화
 * - 프로덕션 빌드에서 완전 제거 (Tree shaking)
 * - 브라우저 개발자 도구 최적화
 */

// 민감 패턴 타입 및 기본값 (정규식 재사용)
export type SensitivePatternMap = Record<string, RegExp>;

const DEFAULT_SENSITIVE_PATTERNS: SensitivePatternMap = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  card: /\b\d{4}[\s\-\.\/]?\d{4}[\s\-\.\/]?\d{4}[\s\-\.\/]?\d{3,4}\b/g,
  phone: /(\+82|0)[\s\-\.]?\d{1,2}[\s\-\.]?\d{3,4}[\s\-\.]?\d{4}/g,
  ssn: /\b\d{6}[\s\-]?\d{7}\b/g,
  jwt: /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/g,
  apiKey: /[a-zA-Z0-9]{32,}/g,
  password: /password['":\s]*['"'][^'"]*['"']/gi,
};

// 프로토타입 오염 방지를 위한 안전하지 않은 키
const UNSAFE_KEYS = ['__proto__', 'constructor', 'prototype'];

// 성능 최적화: 객체 sanitize 결과 캐싱 (WeakMap 활용)
let sanitizeCache = new WeakMap<object, unknown>();

/**
 * 간단한 LRU 캐시 구현
 * 최근 사용된 항목을 유지하고, 최대 크기를 초과하면 가장 오래된 항목을 제거합니다.
 */
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private readonly maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 최근 사용된 항목을 맨 뒤로 이동 (LRU)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // 이미 존재하는 경우 제거 후 다시 추가
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 최대 크기 초과 시 가장 오래된 항목(첫 번째) 제거
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// 마스킹 값 캐시 (LRU, 최대 1000개)
const maskValueCache = new LRUCache<string, string>(1000);

// 민감 키 변경 시 캐시 무효화
const clearSanitizeCache = (): void => {
  sanitizeCache = new WeakMap<object, unknown>();
  maskValueCache.clear();
};

const isMetadataCandidate = (value: unknown): value is LogMetadata => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'object') {
    if (value instanceof Date) return false;
    if (ArrayBuffer.isView(value)) return false;
    return true;
  }
  return false;
};

/**
 * 에러 타입 정의
 */
enum LoggerErrorType {
  STORAGE_ACCESS = 'STORAGE_ACCESS',
  REGEX_TIMEOUT = 'REGEX_TIMEOUT',
  REGEX_ERROR = 'REGEX_ERROR',
  INVALID_LOG_LEVEL = 'INVALID_LOG_LEVEL',
}

/**
 * Logger 에러 클래스
 */
class LoggerError extends Error {
  constructor(
    public readonly type: LoggerErrorType,
    message: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'LoggerError';
  }
}

/**
 * 안전한 에러 처리 헬퍼
 */
const handleError = (error: unknown, context: string): void => {
  if (isDevelopment()) {
    console.warn(`[WebLogger] ${context}:`, error);
  }
  // 프로덕션에서는 조용히 실패 (에러 로깅만)
};

/**
 * 로그 레벨 타입
 *
 * - `debug`: 모든 로그 출력 (개발 환경 기본값)
 * - `info`: info, warn, error 출력
 * - `warn`: warn, error만 출력 (프로덕션 기본값)
 * - `error`: error만 출력
 * - `none`: 모든 로그 비활성화
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

// 로그 레벨별 설정
interface LogLevelConfig {
  style: string;
  label: string;
}

const LOG_LEVEL_CONFIGS: Record<LogLevel, LogLevelConfig> = {
  debug: {
    style: 'color: #6B7280; font-weight: normal;',
    label: 'DEBUG',
  },
  info: {
    style: 'color: #3B82F6; font-weight: normal;',
    label: 'INFO',
  },
  warn: {
    style: 'color: #F59E0B; font-weight: bold;',
    label: 'WARN',
  },
  error: {
    style: 'color: #EF4444; font-weight: bold;',
    label: 'ERROR',
  },
  none: {
    style: '',
    label: '',
  },
};

/**
 * 로그 메타데이터 타입
 *
 * 객체 형태의 추가 정보를 로그와 함께 전달할 때 사용합니다.
 * `console.table`을 사용하여 구조화된 형태로 표시됩니다.
 *
 * @example
 * ```typescript
 * logger.info('User login', { userId: 123, email: 'user@example.com' });
 * ```
 */
export type LogMetadata =
  | Record<string, unknown>
  | Map<unknown, unknown>
  | Set<unknown>
  | unknown[];

/**
 * 로그 가능한 값 타입
 *
 * WebLogger가 처리할 수 있는 모든 데이터 타입을 포함합니다.
 */
export type LogValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Error
  | LogMetadata
  | LogValue[];

/**
 * WebLogger 구성 옵션
 */
export interface WebLoggerOptions<TMetadata extends LogMetadata = LogMetadata> {
  prefix?: string;
  sensitiveKeys?: string[];
  sensitivePatterns?: SensitivePatternMap;
  // 타입 추론용 메타데이터 힌트 (실제 값 사용 안 함)
  _metadataType?: TMetadata;
  /**
   * 기본 패턴 제거 시 경고 표시 여부 (기본값: false)
   */
  suppressPatternWarnings?: boolean;
}

// Window 인터페이스 확장
declare global {
  interface Window {
    __WEB_LOGGER_LOG_LEVEL__?: LogLevel;
  }
}

/**
 * 로그 레벨 유효성 검증
 */
const isValidLogLevel = (level: unknown): level is LogLevel => {
  return typeof level === 'string' && ['debug', 'info', 'warn', 'error', 'none'].includes(level);
};

/**
 * 전역 민감한 키 관리자 (싱글톤)
 * 모든 WebLogger 인스턴스가 동일한 민감한 키 목록을 공유하도록 함
 */
class SensitiveKeysManager {
  private static instance: SensitiveKeysManager;
  private sensitiveKeys: Set<string>;

  /**
   * 기본 민감한 키 목록
   *
   * 객체 속성 키가 이 목록의 키워드와 일치하면 (대소문자 구분 없음),
   * 값의 내용과 관계없이 전체 값이 `[REDACTED]`로 마스킹됩니다.
   *
   * 총 28개의 기본 키를 포함하며, 다음과 같이 분류됩니다:
   * - 인증 관련 (10개): password, pwd, passwd, token, apiKey, api_key,
   *   accessToken, refreshToken, authToken, authorization
   * - 개인정보 관련 (6개): email, phone, phoneNumber, mobile,
   *   ssn, socialSecurityNumber, residentNumber, resident_number
   * - 결제 관련 (3개): creditCard, cardNumber, card_number
   * - 보안 관련 (7개): secret, secretKey, privateKey, private_key,
   *   sessionId, session_id, cookie, cookies
   *
   * 사용자는 `addSensitiveKey()` 또는 `removeSensitiveKey()`를 통해
   * 동적으로 키 목록을 관리할 수 있습니다.
   *
   * @see SensitiveKeysManager.isSensitive()
   */
  private readonly defaultKeys = [
    // 인증 관련 (10개)
    'password',
    'pwd',
    'passwd',
    'token',
    'apiKey',
    'api_key',
    'accessToken',
    'refreshToken',
    'authToken',
    'authorization',
    // 개인정보 관련 (6개)
    'email',
    'phone',
    'phoneNumber',
    'mobile',
    'ssn',
    'socialSecurityNumber',
    'residentNumber',
    'resident_number',
    // 결제 관련 (3개)
    'creditCard',
    'cardNumber',
    'card_number',
    // 보안 관련 (7개)
    'secret',
    'secretKey',
    'privateKey',
    'private_key',
    'sessionId',
    'session_id',
    'cookie',
    'cookies',
  ];

  private constructor() {
    this.sensitiveKeys = new Set(this.defaultKeys.map((key) => key.toLowerCase()));
  }

  static getInstance(): SensitiveKeysManager {
    if (!SensitiveKeysManager.instance) {
      SensitiveKeysManager.instance = new SensitiveKeysManager();
    }
    return SensitiveKeysManager.instance;
  }

  /**
   * 민감한 키 추가
   *
   * 새로운 민감 키워드를 목록에 추가합니다. 키는 대소문자 구분 없이 저장되며,
   * 추가 시 sanitize 캐시가 자동으로 초기화됩니다.
   *
   * @param key 추가할 키 (대소문자 구분 없음, 빈 문자열 제외)
   *
   * @example
   * ```typescript
   * addKey('customSecret');
   * addKey('apiSecret');
   * ```
   */
  addKey(key: string): void {
    if (typeof key === 'string' && key.length > 0) {
      this.sensitiveKeys.add(key.toLowerCase());
      clearSanitizeCache();
    }
  }

  /**
   * 민감한 키 제거
   *
   * 목록에서 민감 키워드를 제거합니다. 키는 대소문자 구분 없이 매칭되며,
   * 제거 시 sanitize 캐시가 자동으로 초기화됩니다.
   *
   * @param key 제거할 키 (대소문자 구분 없음, 빈 문자열 제외)
   *
   * @example
   * ```typescript
   * removeKey('email'); // email 필터링 비활성화
   * ```
   */
  removeKey(key: string): void {
    if (typeof key === 'string' && key.length > 0) {
      this.sensitiveKeys.delete(key.toLowerCase());
      clearSanitizeCache();
    }
  }

  /**
   * 민감한 키 목록을 교체
   *
   * 기존 키 목록을 모두 제거하고 새로운 키 목록으로 교체합니다.
   * 빈 값은 자동으로 필터링되며, 모든 키는 소문자로 변환되어 저장됩니다.
   *
   * @param keys 새 키 배열 (빈 값은 자동 제외)
   */
  setKeys(keys: string[]): void {
    this.sensitiveKeys = new Set(keys.filter(Boolean).map((key) => key.toLowerCase()));
    clearSanitizeCache();
  }

  /**
   * 현재 민감한 키 목록 가져오기
   *
   * 현재 활성화된 모든 민감 키워드를 정렬된 배열로 반환합니다.
   * 반환된 배열은 복사본이므로 원본 목록에 영향을 주지 않습니다.
   *
   * @returns 민감한 키 배열 (정렬된 복사본, 소문자)
   */
  getKeys(): string[] {
    return Array.from(this.sensitiveKeys).sort();
  }

  /**
   * 기본 키 목록으로 초기화
   *
   * 민감 키 목록을 기본 28개 키로 초기화합니다.
   * 사용자가 추가/제거한 모든 키가 제거되고 기본값으로 복원됩니다.
   * 초기화 시 sanitize 캐시가 자동으로 초기화됩니다.
   */
  reset(): void {
    this.sensitiveKeys = new Set(this.defaultKeys.map((key) => key.toLowerCase()));
    clearSanitizeCache();
  }

  /**
   * 키가 민감한 키인지 확인
   *
   * 키 이름이 민감 키워드 목록에 포함되어 있는지 확인합니다.
   * 대소문자를 구분하지 않으며, 부분 일치도 허용합니다.
   * 예: 'apiKey', 'ApiKey', 'myApiKey' 모두 민감 키로 인식
   *
   * @param key 확인할 키 (문자열)
   * @returns 키가 민감 키워드를 포함하면 `true`, 그렇지 않으면 `false`
   *
   * @example
   * ```typescript
   * isSensitive('password'); // true
   * isSensitive('apiKey'); // true
   * isSensitive('myApiKey'); // true (부분 일치)
   * isSensitive('username'); // false
   * ```
   */
  isSensitive(key: string): boolean {
    if (typeof key !== 'string' || key.length === 0) {
      return false;
    }
    const lowerKey = key.toLowerCase();
    return Array.from(this.sensitiveKeys).some((sensitive) => lowerKey.includes(sensitive));
  }
}

// 싱글톤 인스턴스
const sensitiveKeysManager = SensitiveKeysManager.getInstance();

/**
 * 전역 민감 패턴 관리자 (싱글톤)
 */
class SensitivePatternsManager {
  private static instance: SensitivePatternsManager;
  private patterns: SensitivePatternMap;
  private suppressWarnings = false;

  private constructor() {
    this.patterns = { ...DEFAULT_SENSITIVE_PATTERNS };
  }

  static getInstance(): SensitivePatternsManager {
    if (!SensitivePatternsManager.instance) {
      SensitivePatternsManager.instance = new SensitivePatternsManager();
    }
    return SensitivePatternsManager.instance;
  }

  getPatterns(): SensitivePatternMap {
    return this.patterns;
  }

  /**
   * 민감 패턴 전체를 교체
   */
  setPatterns(patterns: SensitivePatternMap): void {
    const normalized = this.normalizePatterns(patterns);
    this.warnIfDefaultsMissing(normalized);
    this.patterns = normalized;
    clearSanitizeCache();
  }

  /**
   * 민감 패턴 병합 (기존 + 추가/교체)
   */
  mergePatterns(patterns: SensitivePatternMap): void {
    const normalized = this.normalizePatterns(patterns);
    this.patterns = { ...this.patterns, ...normalized };
    clearSanitizeCache();
  }

  reset(): void {
    this.patterns = { ...DEFAULT_SENSITIVE_PATTERNS };
    clearSanitizeCache();
  }

  private normalizePatterns(patterns: SensitivePatternMap): SensitivePatternMap {
    const normalized: SensitivePatternMap = {};
    for (const [key, pattern] of Object.entries(patterns)) {
      if (pattern instanceof RegExp) {
        normalized[key] = pattern;
      }
    }
    return normalized;
  }

  private warnIfDefaultsMissing(nextPatterns: SensitivePatternMap): void {
    const missing = Object.keys(DEFAULT_SENSITIVE_PATTERNS).filter(
      (key) => !Object.prototype.hasOwnProperty.call(nextPatterns, key),
    );

    if (
      !this.suppressWarnings &&
      missing.length > 0 &&
      typeof console !== 'undefined' &&
      console.warn
    ) {
      console.warn(
        `[WebLogger] Default sensitive patterns removed: ${missing.join(
          ', ',
        )}. Ensure this is intentional.`,
      );
    }
  }
  setSuppressWarnings(value: boolean): void {
    this.suppressWarnings = value;
  }
}

const sensitivePatternsManager = SensitivePatternsManager.getInstance();

/**
 * 전역 로그 레벨 상태 관리자 (싱글톤)
 * 모든 WebLogger 인스턴스가 동일한 로그 레벨을 공유하도록 함
 */
class LogLevelManager {
  private static instance: LogLevelManager;

  private constructor() {}

  static getInstance(): LogLevelManager {
    if (!LogLevelManager.instance) {
      LogLevelManager.instance = new LogLevelManager();
    }
    return LogLevelManager.instance;
  }

  /**
   * 현재 로그 레벨 가져오기 (런타임 제어)
   *
   * 다음 우선순위로 로그 레벨을 결정합니다:
   * 1. `globalThis.__WEB_LOGGER_LOG_LEVEL__` - 런타임 전역 상태 (최우선, SSR/CSR 모두 지원)
   * 2. `window.__WEB_LOGGER_LOG_LEVEL__` - 브라우저 전역 변수 (런타임 제어, 디버깅용)
   * 3. `__INITIAL_LOG_LEVEL__` - 빌드 타임 상수 (빌드 시 주입, Tree Shaking 최적화)
   * 4. `process.env.WEB_LOGGER_LOG_LEVEL` - 환경 변수 (런타임 fallback)
   * 5. `isDevelopment()` - 개발 모드 감지 시 'debug' 반환
   * 6. 기본값: 'warn' - 프로덕션 환경 기본값 (error + warn만 출력)
   *
   * 프로덕션에서도 디버깅을 위해 로그 레벨을 동적으로 설정 가능합니다.
   * 모든 WebLogger 인스턴스가 동일한 전역 로그 레벨을 공유합니다.
   *
   * @returns 현재 활성화된 로그 레벨
   * @see setLogLevel()
   * @see LogLevelManager
   */
  getCurrentLogLevel(): LogLevel {
    // 1. 런타임 전역 상태(동적 제어 우선)
    const globalLevel = globalThis.__WEB_LOGGER_LOG_LEVEL__;
    if (isValidLogLevel(globalLevel)) {
      return globalLevel;
    }

    // 2. 브라우저 전역 변수 (런타임 제어, 디버깅용)
    if (typeof window !== 'undefined') {
      const browserLevel = window.__WEB_LOGGER_LOG_LEVEL__;
      if (isValidLogLevel(browserLevel)) {
        return browserLevel;
      }
    }

    // 3. 빌드 타임 시드 (기본값 제공용)
    if (typeof __INITIAL_LOG_LEVEL__ !== 'undefined' && __INITIAL_LOG_LEVEL__) {
      const initialLevel = __INITIAL_LOG_LEVEL__ as LogLevel;
      if (isValidLogLevel(initialLevel)) {
        return initialLevel;
      }
    }

    // 4. 환경 변수 (런타임 제어, 빌드 타임 상수가 없는 경우 fallback)
    if (typeof process !== 'undefined' && process.env) {
      const envLevel = process.env['WEB_LOGGER_LOG_LEVEL'] as LogLevel;
      if (isValidLogLevel(envLevel)) {
        return envLevel;
      }
    }

    // 5. 개발 모드 감지 (기존 호환성)
    if (isDevelopment()) {
      return 'debug'; // 개발: 모든 레벨
    }

    // 6. 기본값: 프로덕션에서는 warn 이상 (error + warn)
    // 중요한 경고도 프로덕션에서 확인 가능하도록 허용
    return 'warn';
  }

  /**
   * 로그 레벨 설정 (런타임 제어)
   * 프로덕션에서 디버깅 시 사용
   * 모든 WebLogger 인스턴스에 즉시 반영됨
   *
   * @param level 설정할 로그 레벨 ('debug' | 'info' | 'warn' | 'error' | 'none')
   * @throws {LoggerError} 개발 모드에서 잘못된 로그 레벨이 전달된 경우
   */
  setLogLevel(level: LogLevel): void {
    if (!isValidLogLevel(level)) {
      const error = new LoggerError(
        LoggerErrorType.INVALID_LOG_LEVEL,
        `Invalid log level: ${level}. Must be one of: debug, info, warn, error, none`,
      );
      if (isDevelopment()) {
        throw error;
      }
      // 프로덕션에서는 조용히 실패 (안전한 fallback)
      handleError(error, '잘못된 로그 레벨 설정');
      return;
    }

    // SSR/Node 환경 전역에도 저장
    globalThis.__WEB_LOGGER_LOG_LEVEL__ = level;

    if (typeof window !== 'undefined') {
      // 전역 변수에 저장 (현재 세션용, 즉시 반영)
      window.__WEB_LOGGER_LOG_LEVEL__ = level;
    }
  }
}

// 싱글톤 인스턴스
const logLevelManager = LogLevelManager.getInstance();

// 성능 및 보안 상수
const MAX_STRING_LENGTH = 5000; // ReDoS 공격 방지를 위한 문자열 길이 제한
const REGEX_TIMEOUT_MS = 100; // 정규식 실행 시간 제한 (밀리초)
const MAX_DEPTH = 10; // 순환 참조 방지를 위한 최대 깊이

/**
 * 정규식 실행 시간 제한 (ReDoS 공격 방지)
 *
 * 모든 민감 정보 패턴을 순차적으로 적용하며, 총 실행 시간이 타임아웃을 초과하면
 * 남은 패턴 처리를 중단합니다. 이를 통해 ReDoS(정규식 서비스 거부) 공격을 방지합니다.
 *
 * **보안 특징:**
 * - 각 패턴마다 타임아웃 체크 수행
 * - 타임아웃 초과 시 안전하게 종료 (원본 반환하지 않음)
 * - 개별 패턴 오류 발생 시 해당 패턴만 스킵하고 계속 진행
 *
 * @param text 처리할 문자열 (최대 5,000자, 이 함수 호출 전에 제한됨)
 * @param timeoutMs 타임아웃 시간 (밀리초, 기본값: 100ms)
 * @returns 패턴이 적용된 문자열 (일부 패턴이 타임아웃으로 스킵될 수 있음)
 *
 * @see MAX_STRING_LENGTH
 * @see REGEX_TIMEOUT_MS
 */
function applyRegexWithTimeout(text: string, timeoutMs: number = REGEX_TIMEOUT_MS): string {
  const startTime = Date.now();
  let result = text;
  const patterns = sensitivePatternsManager.getPatterns();

  try {
    // 각 정규식 패턴을 순차적으로 적용
    for (const [key, pattern] of Object.entries(patterns)) {
      // 타임아웃 체크
      if (Date.now() - startTime > timeoutMs) {
        // 타임아웃 발생 시 남은 문자열은 처리하지 않고 반환
        const error = new LoggerError(
          LoggerErrorType.REGEX_TIMEOUT,
          `정규식 실행 시간 초과 (${timeoutMs}ms), 일부 패턴 스킵`,
        );
        handleError(error, '정규식 타임아웃');
        break;
      }

      try {
        // 정규식 실행
        result = result.replace(pattern, `[${key.toUpperCase()}]`);
      } catch (error) {
        // 정규식 실행 중 오류 발생 시 해당 패턴만 스킵
        const regexError = new LoggerError(
          LoggerErrorType.REGEX_ERROR,
          `정규식 패턴 ${key} 실행 실패`,
          error,
        );
        handleError(regexError, `정규식 패턴 ${key} 오류`);
        continue;
      }
    }
  } catch (error) {
    // 전체 정규식 처리 중 오류 발생 시 원본 문자열 반환
    const criticalError = new LoggerError(
      LoggerErrorType.REGEX_ERROR,
      '정규식 처리 중 치명적 오류',
      error,
    );
    handleError(criticalError, '정규식 처리 오류');
    return text; // 안전하게 원본 반환
  }

  return result;
}

/**
 * 민감한 값 부분 마스킹
 *
 * 키 기반 마스킹에서 사용되며, 전체 값을 `[REDACTED]`로 대체하는 대신
 * 일부 문자를 표시하고 나머지를 별표로 마스킹합니다.
 *
 * **마스킹 전략:**
 * - Email: 앞 3자 + `***` + `@` + 도메인 (예: `use***@example.com`)
 * - Password 계열: 앞 2자 + `***` (예: `my***`)
 * - 기타: 앞 2자 + `***` (예: `se***`)
 *
 * @param value 마스킹할 값 (모든 타입 가능)
 * @param key 속성 키 (선택적, 마스킹 전략 결정에 사용)
 * @returns 마스킹된 문자열
 *
 * @example
 * ```typescript
 * maskSensitiveValue('user@example.com', 'email'); // 'use***@example.com'
 * maskSensitiveValue('mypassword123', 'password'); // 'my***'
 * maskSensitiveValue('secretkey123', 'apiKey'); // 'se***'
 * ```
 */
function maskSensitiveValue(value: unknown, key?: string): string {
  // null이나 undefined는 특별 처리 (캐싱 불필요)
  if (value === null || value === undefined) return '***';

  const str = String(value);
  if (str.length === 0) return '***';

  // 캐시 키 생성: value와 key를 조합
  const cacheKey = `${str}|${key || ''}`;

  // 캐시에서 확인
  const cached = maskValueCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // 마스킹 수행
  let masked: string;

  // email 특별 처리
  if (key && /email/i.test(key) && str.includes('@')) {
    const [local, domain] = str.split('@');
    if (!local || !domain) {
      masked = '***'; // @ 앞이나 뒤가 없는 경우
    } else if (local.length <= 3) {
      masked = `***@${domain}`;
    } else {
      masked = `${local.slice(0, 3)}***@${domain}`;
    }
  }
  // password 계열은 앞 2자만 표시
  else if (key && /password|pwd|passwd/i.test(key)) {
    if (str.length <= 2) {
      masked = '***';
    } else {
      masked = `${str.slice(0, 2)}***`;
    }
  }
  // 기타는 앞 2자 표시
  else {
    if (str.length <= 2) {
      masked = '***';
    } else {
      masked = `${str.slice(0, 2)}***`;
    }
  }

  // 캐시에 저장
  maskValueCache.set(cacheKey, masked);
  return masked;
}

/**
 * 로그 레벨이 활성화되어 있는지 확인
 *
 * 요청한 로그 레벨이 현재 설정된 로그 레벨에서 출력 가능한지 확인합니다.
 *
 * **로그 레벨 계층 구조:**
 * - `debug` (0): 모든 로그 출력
 * - `info` (1): info, warn, error 출력
 * - `warn` (2): warn, error만 출력
 * - `error` (3): error만 출력
 * - `none`: 모든 로그 비활성화
 *
 * **특별 규칙:**
 * - `error` 레벨은 항상 활성화됨 (최우선)
 * - `none` 레벨이면 모든 로그 비활성화
 * - 요청 레벨이 현재 레벨보다 같거나 높으면 활성화
 *
 * @param requestedLevel 확인할 로그 레벨 (요청된 레벨)
 * @param currentLevel 현재 설정된 로그 레벨
 * @returns 로그를 출력해야 하면 `true`, 그렇지 않으면 `false`
 *
 * @example
 * ```typescript
 * shouldLog('debug', 'warn'); // false (warn 레벨에서는 debug 미출력)
 * shouldLog('error', 'warn'); // true (error는 항상 출력)
 * shouldLog('warn', 'warn'); // true (같은 레벨은 출력)
 * shouldLog('info', 'none'); // false (none이면 모두 비활성화)
 * ```
 */
const shouldLog = (requestedLevel: LogLevel, currentLevel: LogLevel): boolean => {
  if (currentLevel === 'none') return false;
  if (requestedLevel === 'error') return true; // error는 항상 활성화

  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  const currentIndex = levels.indexOf(currentLevel);
  const requestedIndex = levels.indexOf(requestedLevel);
  return requestedIndex >= currentIndex;
};

/**
 * 민감한 정보 자동 필터링
 *
 * 프로덕션에서 개인정보 보호를 위해 로그 데이터를 자동으로 정화합니다.
 * 재귀적으로 객체를 순회하며 민감한 정보를 마스킹합니다.
 *
 * **마스킹 우선순위:**
 * 1. 키 기반 마스킹 (최우선): 객체 속성 키가 민감 키워드와 일치하면 전체 값이 `[REDACTED]`로 대체
 * 2. 패턴 기반 마스킹: 값에서 이메일, 전화번호, 카드번호 등 패턴 감지 시 해당 패턴만 마스킹
 *
 * **처리되는 데이터 타입:**
 * - 문자열: 정규식 패턴 매칭으로 민감 정보 마스킹
 * - 객체: 재귀적으로 모든 속성 필터링 (최대 깊이 10단계)
 * - 배열: 각 요소를 재귀적으로 필터링
 * - Map/Set: 키와 값을 모두 필터링
 * - Date: ISO 문자열로 변환 후 패턴 검사
 * - Error: name, message, stack 필터링
 * - TypedArray/Buffer: `[BINARY_DATA]` 또는 `[BUFFER]`로 마스킹
 *
 * **성능 및 보안 보호:**
 * - 최대 깊이 제한: 10단계 (순환 참조 방지)
 * - 문자열 길이 제한: 5,000자 (ReDoS 공격 방지)
 * - 정규식 타임아웃: 100ms (ReDoS 공격 방지)
 * - WeakMap 캐싱: 동일 객체 재사용으로 성능 최적화
 * - WeakSet 순환 참조 감지: 메모리 누수 방지
 *
 * @param data 필터링할 데이터 (모든 타입 가능)
 * @param depth 현재 재귀 깊이 (기본값: 0, 최대 10)
 * @param visited 순환 참조 방지를 위한 방문한 객체 집합 (WeakSet)
 * @returns 필터링된 데이터 (원본과 동일한 구조, 민감 정보만 마스킹)
 *
 * @example
 * ```typescript
 * sanitizeLogData({ password: '123', email: 'user@example.com' })
 * // → { password: '[REDACTED]', email: '[REDACTED]' }
 *
 * sanitizeLogData({ userInfo: 'user@example.com' })
 * // → { userInfo: '[EMAIL]' }
 * ```
 */
function sanitizeLogData(
  data: unknown,
  depth: number = 0,
  visited: WeakSet<object> = new WeakSet(),
): unknown {
  // 최대 깊이 제한 (순환 참조 및 성능 보호)
  if (depth > MAX_DEPTH) {
    return '[MAX_DEPTH]';
  }

  if (data === null || data === undefined) {
    return data;
  }

  // 원시 타입은 그대로 반환 (숫자, 불린, 심볼 등)
  if (typeof data !== 'object' && typeof data !== 'string') {
    return data;
  }

  // 문자열인 경우 정규식으로 필터링
  if (typeof data === 'string') {
    // 성능 최적화: 긴 문자열은 길이 제한 후 정규식 적용
    if (data.length > MAX_STRING_LENGTH) {
      const truncated = data.slice(0, MAX_STRING_LENGTH) + '... [TRUNCATED]';
      return applyRegexWithTimeout(truncated);
    }

    // 정규식 적용 (민감한 정보 필터링)
    return applyRegexWithTimeout(data);
  }

  // 순환 참조 방지: 객체 계열은 먼저 방문 여부 확인
  if (typeof data === 'object' && data !== null) {
    if (visited.has(data as object)) {
      return '[CIRCULAR]';
    }
    visited.add(data as object);
  }

  // Error 객체는 특별 처리
  if (data instanceof Error) {
    return {
      name: data.name,
      message: sanitizeLogData(data.message, depth + 1, visited),
      stack: data.stack ? sanitizeLogData(data.stack, depth + 1, visited) : undefined,
    };
  }

  // Date 객체 처리
  if (data instanceof Date) {
    const dateString = data.toISOString();
    return sanitizeLogData(dateString, depth + 1, visited);
  }

  // Map 객체 처리
  if (data instanceof Map) {
    const sanitized = new Map();
    for (const [key, value] of data.entries()) {
      const sanitizedKey =
        typeof key === 'string' && sensitiveKeysManager.isSensitive(key)
          ? maskSensitiveValue(key, key)
          : sanitizeLogData(key, depth + 1, visited);
      // Map의 값도 민감한 키인 경우 마스킹
      const sanitizedValue =
        typeof key === 'string' && sensitiveKeysManager.isSensitive(key)
          ? maskSensitiveValue(value, key)
          : sanitizeLogData(value, depth + 1, visited);
      sanitized.set(sanitizedKey, sanitizedValue);
    }
    return sanitized;
  }

  // Set 객체 처리
  if (data instanceof Set) {
    const sanitized = new Set();
    for (const item of data.values()) {
      sanitized.add(sanitizeLogData(item, depth + 1, visited));
    }
    return sanitized;
  }

  // Buffer 처리 (Node.js) - TypedArray 체크보다 먼저 실행
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
    return '[BUFFER]';
  }

  // TypedArray 처리 (Uint8Array, Int32Array 등)
  if (ArrayBuffer.isView(data) && !(data instanceof DataView)) {
    return '[BINARY_DATA]';
  }

  // 객체인 경우 재귀적으로 필터링
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    // 성능 최적화: 캐시 확인 (같은 객체는 재사용)
    if (sanitizeCache.has(data as object)) {
      return sanitizeCache.get(data as object);
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      // 프로토타입 오염 방지
      if (UNSAFE_KEYS.includes(key)) {
        sanitized[key] = '[UNSAFE_KEY]';
        continue;
      }

      // hasOwnProperty 체크로 프로토타입 체인 속성 제외
      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        continue;
      }

      // 민감한 키 확인 (전역 관리자 사용)
      if (sensitiveKeysManager.isSensitive(key)) {
        sanitized[key] = maskSensitiveValue(value, key);
      } else {
        sanitized[key] = sanitizeLogData(value, depth + 1, visited);
      }
    }

    // 캐시에 저장 (성능 최적화)
    sanitizeCache.set(data as object, sanitized);
    return sanitized;
  }

  // 배열인 경우 각 요소 필터링
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item, depth + 1, visited));
  }

  return data;
}

/**
 * WebLogger 클래스
 *
 * 프로덕션 환경에 최적화된 웹 로깅 라이브러리의 메인 클래스입니다.
 * 자동 민감 정보 필터링, 로그 레벨 제어, SSR/CSR 호환 등의 기능을 제공합니다.
 *
 * @example
 * ```typescript
 * const logger = new WebLogger('[MyApp]');
 * logger.debug('Debug message');
 * logger.info('User data:', { userId: 123 });
 * logger.warn('Warning message');
 * logger.error('Error occurred:', error);
 * ```
 */
export class WebLogger<TMetadata extends LogMetadata = LogMetadata> {
  private readonly prefix: string;
  private readonly logLevelManager: LogLevelManager;

  /**
   * WebLogger 인스턴스 생성
   *
   * @param prefixOrOptions 로그 prefix 또는 구성 옵션 (기본값: '[APP]')
   * @param options 추가 구성 옵션 (prefix를 문자열로 전달할 때 사용)
   *
   * @example
   * ```typescript
   * const logger = new WebLogger('[MyApp]');
   * const custom = new WebLogger({ prefix: '[Secure]', sensitiveKeys: ['secret'] });
   * logger.info('Message'); // [MyApp] [12:34:56] INFO Message
   * ```
   */
  constructor(
    prefixOrOptions: string | WebLoggerOptions<TMetadata> = '[APP]',
    options?: WebLoggerOptions<TMetadata>,
  ) {
    const resolvedOptions = typeof prefixOrOptions === 'string' ? options : prefixOrOptions;
    const resolvedPrefix =
      typeof prefixOrOptions === 'string' ? prefixOrOptions : prefixOrOptions.prefix;

    this.prefix = resolvedPrefix ?? '[APP]';
    this.logLevelManager = logLevelManager;
    this.applyOptions(resolvedOptions);
  }

  /**
   * 새 prefix를 사용하는 WebLogger 인스턴스 생성
   *
   * 전역 로그 레벨, 민감 정보 설정 등은 그대로 공유됩니다.
   *
   * @param prefix 로그 앞에 붙일 새 prefix
   * @returns 새 WebLogger 인스턴스
   */
  withPrefix(prefix: string): WebLogger<TMetadata> {
    return new WebLogger<TMetadata>(prefix);
  }

  /**
   * 구성 옵션 적용
   */
  private applyOptions(options?: WebLoggerOptions<TMetadata>): void {
    if (!options) return;

    if (options.sensitiveKeys && Array.isArray(options.sensitiveKeys)) {
      sensitiveKeysManager.setKeys(options.sensitiveKeys);
    }

    if (options.sensitivePatterns && Object.keys(options.sensitivePatterns).length > 0) {
      sensitivePatternsManager.setPatterns(options.sensitivePatterns);
    }

    if (typeof options.suppressPatternWarnings === 'boolean') {
      sensitivePatternsManager.setSuppressWarnings(options.suppressPatternWarnings);
    }
  }

  /**
   * 현재 로그 레벨 가져오기 (동적 조회)
   *
   * `setLogLevel()` 호출 시 즉시 반영됩니다.
   * 모든 WebLogger 인스턴스가 동일한 전역 로그 레벨을 공유합니다.
   *
   * @returns 현재 로그 레벨
   *
   * @example
   * ```typescript
   * logger.setLogLevel('debug');
   * console.log(logger.currentLogLevel); // 'debug'
   * ```
   */
  get currentLogLevel(): LogLevel {
    return this.logLevelManager.getCurrentLogLevel();
  }

  /**
   * 로그 레벨 설정 (런타임 제어)
   *
   * 프로덕션에서 디버깅 시 사용할 수 있습니다.
   * 모든 WebLogger 인스턴스에 즉시 반영되며, `globalThis`를 통해 SSR/CSR 환경에서도 동기화됩니다.
   *
   * @param level 설정할 로그 레벨
   *
   * @example
   * ```typescript
   * logger.setLogLevel('warn'); // warn과 error만 출력
   * logger.setLogLevel('debug'); // 모든 로그 출력
   * ```
   */
  setLogLevel(level: LogLevel): void {
    this.logLevelManager.setLogLevel(level);
  }

  /**
   * 공통 로깅 메서드 - 중복 코드 제거
   * @private
   */
  private logWithLevel(
    level: LogLevel,
    message?: unknown,
    ...optionalParams: Array<TMetadata | unknown>
  ): void {
    const currentLevel = this.currentLogLevel;
    if (!shouldLog(level, currentLevel)) return;

    // 민감한 정보 필터링
    const sanitizedMessage = sanitizeLogData(message);
    const sanitizedParams = optionalParams.map((param) => sanitizeLogData(param));
    const config = LOG_LEVEL_CONFIGS[level];

    if (optionalParams.length === 0) {
      // 단일 메시지만 있는 경우 (객체는 구조화해 출력)
      const isStructuredObject =
        typeof sanitizedMessage === 'object' &&
        sanitizedMessage !== null &&
        !Array.isArray(sanitizedMessage) &&
        !(sanitizedMessage instanceof Date) &&
        !ArrayBuffer.isView(sanitizedMessage);

      if (isStructuredObject) {
        this.logWithStyle(level, '', sanitizedMessage as LogMetadata, config.style);
      } else {
        this.logWithStyle(level, String(sanitizedMessage), undefined, config.style);
      }
    } else if (optionalParams.length === 1 && isMetadataCandidate(optionalParams[0])) {
      // 메시지 + 메타데이터
      this.logWithStyle(
        level,
        String(sanitizedMessage),
        sanitizedParams[0] as TMetadata,
        config.style,
      );
    } else {
      // 여러 파라미터인 경우 (console.x와 동일하게 처리)
      const timestamp = this.getTimestamp();
      const consoleFn = this.getConsoleFunction(level);
      consoleFn(
        `${this.prefix} [${timestamp}] ${config.label}`,
        sanitizedMessage,
        ...sanitizedParams,
      );
    }
  }

  /**
   * 디버그 레벨 로깅 (가장 상세한 정보)
   * console.debug()와 동일한 시그니처
   *
   * @param message 로그 메시지
   * @param optionalParams 추가 파라미터 (console.debug와 동일)
   */
  debug(message?: unknown, ...optionalParams: Array<TMetadata | unknown>): void {
    this.logWithLevel('debug', message, ...optionalParams);
  }

  /**
   * 정보 레벨 로깅 (일반적인 정보)
   * console.info()와 동일한 시그니처
   *
   * @param message 로그 메시지
   * @param optionalParams 추가 파라미터 (console.info와 동일)
   */
  info(message?: unknown, ...optionalParams: Array<TMetadata | unknown>): void {
    this.logWithLevel('info', message, ...optionalParams);
  }

  /**
   * 경고 레벨 로깅
   * console.warn()과 동일한 시그니처
   *
   * @param message 로그 메시지
   * @param optionalParams 추가 파라미터 (console.warn과 동일)
   */
  warn(message?: unknown, ...optionalParams: Array<TMetadata | unknown>): void {
    this.logWithLevel('warn', message, ...optionalParams);
  }

  /**
   * 에러 레벨 로깅
   * console.error()와 동일한 시그니처
   * 프로덕션에서도 항상 활성화됨
   *
   * @param message 로그 메시지
   * @param optionalParams 추가 파라미터 (console.error와 동일)
   */
  error(message?: unknown, ...optionalParams: Array<TMetadata | unknown>): void {
    this.logWithLevel('error', message, ...optionalParams);
  }

  /**
   * 일반 로깅 (console.log 호환)
   *
   * `console.log()`와 동일한 시그니처를 제공합니다.
   * 로그 레벨이 `none`인 경우 출력되지 않습니다.
   *
   * @param args 로그할 인자들 (여러 개 가능)
   *
   * @example
   * ```typescript
   * logger.log('Simple message');
   * logger.log('Multiple', 'arguments', { data: 'value' });
   * ```
   */
  log(...args: unknown[]): void {
    if (this.currentLogLevel === 'none') return;

    // 민감한 정보 필터링
    const sanitizedArgs = args.map((arg) => sanitizeLogData(arg));

    const timestamp = this.getTimestamp();
    console.log(`${this.prefix} [${timestamp}] LOG`, ...sanitizedArgs);
  }

  /**
   * 그룹화된 로깅 (복잡한 데이터용)
   *
   * 관련된 로그들을 그룹으로 묶어 구조화된 형태로 표시합니다.
   * 메타데이터가 제공되면 `console.table`을 사용하여 표 형식으로 출력됩니다.
   * `groupEnd()`를 호출하여 그룹을 닫아야 합니다.
   *
   * @param title 그룹 제목
   * @param data 표시할 메타데이터 (선택적, 객체 형태)
   *
   * @example
   * ```typescript
   * logger.group('User Information', { id: 123, name: 'John' });
   * logger.debug('Additional details...');
   * logger.groupEnd();
   * ```
   */
  group(title: string, data?: TMetadata): void {
    if (this.currentLogLevel === 'none') return;

    // 민감한 정보 필터링
    const sanitizedTitle = typeof title === 'string' ? sanitizeLogData(title) : title;
    const sanitizedData = data ? sanitizeLogData(data) : undefined;

    console.group(`${this.prefix} ${sanitizedTitle}`);
    if (sanitizedData) {
      console.table(sanitizedData);
    }
  }

  /**
   * 그룹 종료
   *
   * `group()`으로 시작한 그룹을 닫습니다.
   *
   * @example
   * ```typescript
   * logger.group('User Information');
   * logger.debug('Details...');
   * logger.groupEnd(); // 그룹 닫기
   * ```
   */
  groupEnd(): void {
    if (this.currentLogLevel === 'none') return;
    console.groupEnd();
  }

  /**
   * 성능 측정 시작
   *
   * 작업의 실행 시간을 측정하기 시작합니다.
   * `timeEnd()`를 호출하여 측정을 종료하고 경과 시간을 출력합니다.
   *
   * @param label 측정할 작업의 레이블 (고유해야 함)
   *
   * @example
   * ```typescript
   * logger.time('API call');
   * await fetchData();
   * logger.timeEnd('API call'); // API call: 123ms
   * ```
   */
  time(label: string): void {
    if (this.currentLogLevel === 'none') return;
    console.time(`${this.prefix} ${label}`);
  }

  /**
   * 성능 측정 종료
   *
   * `time()`으로 시작한 측정을 종료하고 경과 시간을 출력합니다.
   *
   * @param label `time()`에서 사용한 레이블과 동일해야 함
   *
   * @example
   * ```typescript
   * logger.time('API call');
   * await fetchData();
   * logger.timeEnd('API call'); // [APP] API call: 123ms
   * ```
   */
  timeEnd(label: string): void {
    if (this.currentLogLevel === 'none') return;
    console.timeEnd(`${this.prefix} ${label}`);
  }

  /**
   * 로깅 활성화 여부 확인
   *
   * 로그 레벨이 `none`이 아닌 경우 `true`를 반환합니다.
   *
   * @returns 로깅이 활성화되어 있으면 `true`, 비활성화되어 있으면 `false`
   *
   * @example
   * ```typescript
   * if (logger.isEnabled) {
   *   logger.debug('Debug message');
   * }
   * ```
   */
  get isEnabled(): boolean {
    return this.currentLogLevel !== 'none';
  }

  /**
   * 타임스탬프 생성 (HH:MM:SS 형식, 년도 제외)
   */
  private getTimestamp(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * 스타일이 적용된 로그 출력
   */
  private logWithStyle(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata,
    style?: string,
  ): void {
    const timestamp = this.getTimestamp();
    const levelUpper = level.toUpperCase().padEnd(5);
    const consoleFn = this.getConsoleFunction(level);

    if (style && typeof console.log === 'function') {
      // 스타일을 지원하는 경우에도 올바른 console 함수 사용
      // 단, console.log만 %c 스타일을 지원하므로 스타일이 있을 때만 console.log 사용
      if (level === 'debug' || level === 'info') {
        console.log(`%c${this.prefix} [${timestamp}] ${levelUpper} ${message}`, style);
      } else {
        // warn과 error는 스타일 없이 원래 함수 사용
        consoleFn(`${this.prefix} [${timestamp}] ${levelUpper} ${message}`);
      }
    } else {
      // 스타일 지원하지 않는 환경을 위한 fallback
      consoleFn(`${this.prefix} [${timestamp}] ${levelUpper} ${message}`);
    }

    // 메타데이터가 있으면 추가 출력
    if (metadata) {
      this.printMetadata(metadata);
    }
  }

  /**
   * 메타데이터 출력 헬퍼
   */
  private printMetadata(metadata: LogMetadata): void {
    if (metadata instanceof Map || metadata instanceof Set) {
      console.log(metadata);
      return;
    }

    if (Array.isArray(metadata)) {
      if (console.table) {
        console.table(metadata);
      } else {
        console.log(metadata);
      }
      return;
    }

    if (metadata && typeof metadata === 'object') {
      if (console.table && Object.keys(metadata).length > 0) {
        console.table(metadata);
      } else {
        console.log(metadata);
      }
      return;
    }

    console.log(metadata);
  }

  /**
   * 로그 레벨에 맞는 console 함수 반환
   */
  private getConsoleFunction(level: LogLevel): typeof console.log {
    switch (level) {
      case 'debug':
        return console.debug || console.log;
      case 'info':
        return console.info || console.log;
      case 'warn':
        return console.warn || console.log;
      case 'error':
        return console.error || console.log;
      default:
        return console.log;
    }
  }
}

/**
 * 기본 WebLogger 인스턴스
 *
 * 편의 함수들(`logDebug`, `logInfo` 등)이 사용하는 기본 인스턴스입니다.
 * 즉시 초기화되어 레이스 컨디션을 방지합니다.
 *
 * @example
 * ```typescript
 * import { webLogger } from '@cp949/web-logger';
 *
 * webLogger.setLogLevel('debug');
 * webLogger.info('Message');
 * ```
 */
export const webLogger = new WebLogger('[APP]');

/**
 * 민감한 키 추가 (전역 설정)
 * 모든 WebLogger 인스턴스에 적용됩니다.
 *
 * @param key 추가할 키 (대소문자 구분 없음)
 *
 * @example
 * ```typescript
 * import { addSensitiveKey } from '@cp949/web-logger';
 *
 * addSensitiveKey('customSecret');
 * addSensitiveKey('apiSecret');
 * ```
 */
export const addSensitiveKey = (key: string): void => {
  sensitiveKeysManager.addKey(key);
};

/**
 * 민감한 키 제거 (전역 설정)
 * 모든 WebLogger 인스턴스에 적용됩니다.
 *
 * @param key 제거할 키 (대소문자 구분 없음)
 *
 * @example
 * ```typescript
 * import { removeSensitiveKey } from '@cp949/web-logger';
 *
 * removeSensitiveKey('email'); // email 필터링 비활성화
 * ```
 */
export const removeSensitiveKey = (key: string): void => {
  sensitiveKeysManager.removeKey(key);
};

/**
 * 현재 민감한 키 목록 가져오기
 *
 * @returns 민감한 키 배열 (정렬된 복사본)
 *
 * @example
 * ```typescript
 * import { getSensitiveKeys } from '@cp949/web-logger';
 *
 * console.log(getSensitiveKeys());
 * // ['apiKey', 'api_key', 'authorization', 'cardNumber', ...]
 * ```
 */
export const getSensitiveKeys = (): string[] => {
  return sensitiveKeysManager.getKeys();
};

/**
 * 민감한 키 목록을 기본값으로 초기화
 *
 * @example
 * ```typescript
 * import { resetSensitiveKeys } from '@cp949/web-logger';
 *
 * resetSensitiveKeys(); // 기본 키 목록으로 복원
 * ```
 */
export const resetSensitiveKeys = (): void => {
  sensitiveKeysManager.reset();
};

/**
 * 민감 패턴 교체 (전역 설정)
 * 모든 WebLogger 인스턴스에 적용됩니다.
 */
export const setSensitivePatterns = (patterns: SensitivePatternMap): void => {
  sensitivePatternsManager.setPatterns(patterns);
};

/**
 * 민감 패턴 병합 (전역 설정)
 * 기존 패턴을 유지하면서 새로운 패턴을 추가/덮어씁니다.
 */
export const addSensitivePatterns = (patterns: SensitivePatternMap): void => {
  sensitivePatternsManager.mergePatterns(patterns);
};

/**
 * 현재 민감 패턴 가져오기
 */
export const getSensitivePatterns = (): SensitivePatternMap => {
  return sensitivePatternsManager.getPatterns();
};

/**
 * 민감 패턴 기본값으로 초기화
 */
export const resetSensitivePatterns = (): void => {
  sensitivePatternsManager.reset();
};

/**
 * 민감 패턴 관련 경고 표시 여부 설정
 * 기본값: false (경고 표시). true로 설정 시 기본 패턴 제거 경고를 숨깁니다.
 */
export const setSensitivePatternWarnings = (suppress: boolean): void => {
  sensitivePatternsManager.setSuppressWarnings(suppress);
};
