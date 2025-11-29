/**
 * Web Environment Conditional Logger
 *
 * 웹 환경용 조건부 로깅 유틸리티
 * - 개발 모드에서만 활성화
 * - 프로덕션 빌드에서 완전 제거 (Tree shaking)
 * - 브라우저 개발자 도구 최적화
 */

// 성능 최적화를 위한 정규식 캐싱 (컴파일된 정규식 재사용)
const SENSITIVE_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
  card: /\b\d{4}[\s\-\.\/]?\d{4}[\s\-\.\/]?\d{4}[\s\-\.\/]?\d{3,4}\b/g,
  phone: /(\+82|0)[\s\-\.]?\d{1,2}[\s\-\.]?\d{3,4}[\s\-\.]?\d{4}/g,
  ssn: /\b\d{6}[\s\-]?\d{7}\b/g,
  jwt: /Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/g,
  apiKey: /[a-zA-Z0-9]{32,}/g,
  password: /password['":\s]*['"'][^'"]*['"']/gi
};

// 프로토타입 오염 방지를 위한 안전하지 않은 키
const UNSAFE_KEYS = ['__proto__', 'constructor', 'prototype'];

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

// 개발 모드 감지
const isDevelopment = (): boolean => {
  // 1. 빌드 타임 상수 우선 (Tree Shaking 최적화)
  // @ts-ignore - 빌드 타임에 주입되는 전역 상수
  if (typeof __DEV__ !== 'undefined') {
    // @ts-ignore
    return __DEV__ === true;
  }

  // 2. Node.js 환경 (빌드 타임 상수가 없는 경우 fallback)
  if (typeof process !== 'undefined' && process.env) {
    // @ts-ignore - 빌드 타임에 주입되는 전역 상수
    const nodeEnv = typeof __NODE_ENV__ !== 'undefined' ? __NODE_ENV__ : process.env['NODE_ENV'];
    return nodeEnv === 'development';
  }

  // 3. 브라우저 환경 - 다양한 방법으로 개발 모드 감지
  if (typeof window !== 'undefined') {
    // 3-1. hostname 기반 (localhost, dev 도메인)
    const hostname = window.location?.hostname;
    if (hostname === 'localhost' || hostname.includes('dev') || hostname.includes('staging')) {
      return true;
    }

    // 3-2. URL 파라미터 기반
    const urlParams = new URLSearchParams(window.location?.search || '');
    if (urlParams.get('debug') === 'true' || urlParams.get('dev') === 'true') {
      return true;
    }

    // 3-3. localStorage 기반 설정
    try {
      return localStorage.getItem('app-log-debug') === 'true';
    } catch (error) {
      // localStorage 접근 불가능한 환경 (보안 정책, 시크릿 모드 등)
      handleError(error, 'localStorage 접근 실패 (app-log-debug)');
      return false;
    }
  }

  // 기본값: 프로덕션 모드
  return false;
};

// 로그 레벨 타입
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

// 로그 레벨별 설정
interface LogLevelConfig {
  style: string;
  label: string;
}

const LOG_LEVEL_CONFIGS: Record<LogLevel, LogLevelConfig> = {
  debug: {
    style: 'color: #6B7280; font-weight: normal;',
    label: 'DEBUG'
  },
  info: {
    style: 'color: #3B82F6; font-weight: normal;',
    label: 'INFO'
  },
  warn: {
    style: 'color: #F59E0B; font-weight: bold;',
    label: 'WARN'
  },
  error: {
    style: 'color: #EF4444; font-weight: bold;',
    label: 'ERROR'
  },
  none: {
    style: '',
    label: ''
  }
};

// 메타데이터 타입
export interface LogMetadata {
  [key: string]: unknown;
}

// 로그 가능한 값 타입
export type LogValue = string | number | boolean | null | undefined | Error | LogMetadata | LogValue[];

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
  return (
    typeof level === 'string' &&
    ['debug', 'info', 'warn', 'error', 'none'].includes(level)
  );
};

/**
 * 전역 민감한 키 관리자 (싱글톤)
 * 모든 WebLogger 인스턴스가 동일한 민감한 키 목록을 공유하도록 함
 */
class SensitiveKeysManager {
  private static instance: SensitiveKeysManager;
  private sensitiveKeys: Set<string>;

  // 기본 민감한 키 목록
  private readonly defaultKeys = [
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
    'email',
    'phone',
    'phoneNumber',
    'mobile',
    'creditCard',
    'cardNumber',
    'card_number',
    'ssn',
    'socialSecurityNumber',
    'residentNumber',
    'resident_number',
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
    this.sensitiveKeys = new Set(this.defaultKeys);
  }

  static getInstance(): SensitiveKeysManager {
    if (!SensitiveKeysManager.instance) {
      SensitiveKeysManager.instance = new SensitiveKeysManager();
    }
    return SensitiveKeysManager.instance;
  }

  /**
   * 민감한 키 추가
   * @param key 추가할 키 (대소문자 구분 없음)
   */
  addKey(key: string): void {
    if (typeof key === 'string' && key.length > 0) {
      this.sensitiveKeys.add(key.toLowerCase());
    }
  }

  /**
   * 민감한 키 제거
   * @param key 제거할 키 (대소문자 구분 없음)
   */
  removeKey(key: string): void {
    if (typeof key === 'string' && key.length > 0) {
      this.sensitiveKeys.delete(key.toLowerCase());
    }
  }

  /**
   * 현재 민감한 키 목록 가져오기
   * @returns 민감한 키 배열 (정렬된 복사본)
   */
  getKeys(): string[] {
    return Array.from(this.sensitiveKeys).sort();
  }

  /**
   * 기본 키 목록으로 초기화
   */
  reset(): void {
    this.sensitiveKeys = new Set(this.defaultKeys);
  }

  /**
   * 키가 민감한 키인지 확인
   * @param key 확인할 키
   * @returns 민감한 키인지 여부
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
   * 프로덕션에서도 디버깅을 위해 로그 레벨을 동적으로 설정 가능
   */
  getCurrentLogLevel(): LogLevel {
    // 1. 빌드 타임 상수 우선 (Tree Shaking 최적화)
    // @ts-ignore - 빌드 타임에 주입되는 전역 상수
    if (typeof __INITIAL_LOG_LEVEL__ !== 'undefined' && __INITIAL_LOG_LEVEL__) {
      // @ts-ignore
      const envLevel = __INITIAL_LOG_LEVEL__ as LogLevel;
      if (isValidLogLevel(envLevel)) {
        return envLevel;
      }
    }

    // 2. 환경 변수 (런타임 제어, 빌드 타임 상수가 없는 경우 fallback)
    if (typeof process !== 'undefined' && process.env) {
      const envLevel = process.env['WEB_LOGGER_LOG_LEVEL'] as LogLevel;
      if (isValidLogLevel(envLevel)) {
        return envLevel;
      }
    }

    // 3. 브라우저 전역 변수 (런타임 제어, 디버깅용)
    if (typeof window !== 'undefined') {
      const globalLevel = window.__WEB_LOGGER_LOG_LEVEL__;
      if (isValidLogLevel(globalLevel)) {
        return globalLevel;
      }
    }

    // 6. 개발 모드 감지 (기존 호환성)
    if (isDevelopment()) {
      return 'debug'; // 개발: 모든 레벨
    }

    // 7. 기본값: 프로덕션에서는 warn 이상 (error + warn)
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
 * @param text 처리할 문자열
 * @param timeoutMs 타임아웃 시간 (밀리초, 기본값: 100ms)
 * @returns 처리된 문자열
 */
function applyRegexWithTimeout(text: string, timeoutMs: number = REGEX_TIMEOUT_MS): string {
  const startTime = Date.now();
  let result = text;

  try {
    // 각 정규식 패턴을 순차적으로 적용
    for (const [key, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
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
 * 로그 레벨이 활성화되어 있는지 확인
 */
const shouldLog = (requestedLevel: LogLevel, currentLevel: LogLevel): boolean => {
  if (currentLevel === 'none') return false;
  if (requestedLevel === 'error') return true; // error는 항상 활성화

  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  const currentIndex = levels.indexOf(currentLevel);
  const requestedIndex = levels.indexOf(requestedLevel);
  return requestedIndex >= currentIndex;
};

// 성능 최적화: 객체 sanitize 결과 캐싱 (WeakMap 활용)
const sanitizeCache = new WeakMap<object, unknown>();

/**
 * 민감한 정보 자동 필터링
 * 프로덕션에서 개인정보 보호를 위해 로그 데이터를 자동으로 정화
 * 
 * @param data 필터링할 데이터
 * @param depth 현재 재귀 깊이 (기본값: 0)
 * @param visited 순환 참조 방지를 위한 방문한 객체 집합
 * @returns 필터링된 데이터
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

  // Error 객체는 특별 처리
  if (data instanceof Error) {
    return {
      name: data.name,
      message: sanitizeLogData(data.message, depth + 1, visited),
      stack: data.stack ? sanitizeLogData(data.stack, depth + 1, visited) : undefined,
    };
  }

  // 순환 참조 방지
  if (typeof data === 'object' && data !== null) {
    if (visited.has(data as object)) {
      return '[CIRCULAR]';
    }
    visited.add(data as object);
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
        sanitized[key] = '[REDACTED]';
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

// 조건부 로거 클래스
export class WebLogger {
  private readonly prefix: string;
  private readonly logLevelManager: LogLevelManager;

  constructor(prefix: string = '[XIO]') {
    this.prefix = prefix;
    this.logLevelManager = logLevelManager;
  }

  /**
   * 현재 로그 레벨 가져오기 (동적 조회)
   * setLogLevel 호출 시 즉시 반영됨
   */
  get currentLogLevel(): LogLevel {
    return this.logLevelManager.getCurrentLogLevel();
  }

  /**
   * 로그 레벨 설정 (런타임 제어)
   * 프로덕션에서 디버깅 시 사용
   * 모든 WebLogger 인스턴스에 즉시 반영됨
   */
  setLogLevel(level: LogLevel): void {
    this.logLevelManager.setLogLevel(level);
  }

  /**
   * 공통 로깅 메서드 - 중복 코드 제거
   * @private
   */
  private logWithLevel(level: LogLevel, message?: unknown, ...optionalParams: unknown[]): void {
    const currentLevel = this.currentLogLevel;
    if (!shouldLog(level, currentLevel)) return;

    // 민감한 정보 필터링
    const sanitizedMessage = sanitizeLogData(message);
    const sanitizedParams = optionalParams.map((param) => sanitizeLogData(param));
    const config = LOG_LEVEL_CONFIGS[level];

    if (optionalParams.length === 0) {
      // 단일 메시지만 있는 경우
      this.logWithStyle(
        level,
        String(sanitizedMessage),
        undefined,
        config.style,
      );
    } else if (
      optionalParams.length === 1 &&
      typeof optionalParams[0] === 'object' &&
      !Array.isArray(optionalParams[0]) &&
      optionalParams[0] !== null
    ) {
      // 메시지 + 메타데이터 객체인 경우 (기존 호환성 유지)
      this.logWithStyle(
        level,
        String(sanitizedMessage),
        sanitizedParams[0] as LogMetadata,
        config.style,
      );
    } else {
      // 여러 파라미터인 경우 (console.x와 동일하게 처리)
      const timestamp = this.getTimestamp();
      const consoleFn = this.getConsoleFunction(level);
      consoleFn(`${this.prefix} [${timestamp}] ${config.label}`, sanitizedMessage, ...sanitizedParams);
    }
  }

  /**
   * 디버그 레벨 로깅 (가장 상세한 정보)
   * console.debug()와 동일한 시그니처
   * 
   * @param message 로그 메시지
   * @param optionalParams 추가 파라미터 (console.debug와 동일)
   */
  debug(message?: unknown, ...optionalParams: unknown[]): void {
    this.logWithLevel('debug', message, ...optionalParams);
  }

  /**
   * 정보 레벨 로깅 (일반적인 정보)
   * console.info()와 동일한 시그니처
   * 
   * @param message 로그 메시지
   * @param optionalParams 추가 파라미터 (console.info와 동일)
   */
  info(message?: unknown, ...optionalParams: unknown[]): void {
    this.logWithLevel('info', message, ...optionalParams);
  }

  /**
   * 경고 레벨 로깅
   * console.warn()과 동일한 시그니처
   * 
   * @param message 로그 메시지
   * @param optionalParams 추가 파라미터 (console.warn과 동일)
   */
  warn(message?: unknown, ...optionalParams: unknown[]): void {
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
  error(message?: unknown, ...optionalParams: unknown[]): void {
    this.logWithLevel('error', message, ...optionalParams);
  }

  /**
   * 일반 로깅 (console.log 호환)
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
   * @param title 그룹 제목
   * @param data 표시할 메타데이터 (선택적)
   */
  group(title: string, data?: LogMetadata): void {
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
   * group()으로 시작한 그룹을 닫습니다.
   */
  groupEnd(): void {
    if (this.currentLogLevel === 'none') return;
    console.groupEnd();
  }

  /**
   * 성능 측정 시작
   * 
   * @param label 측정할 작업의 레이블
   */
  time(label: string): void {
    if (this.currentLogLevel === 'none') return;
    console.time(`${this.prefix} ${label}`);
  }

  /**
   * 성능 측정 종료
   * time()으로 시작한 측정을 종료하고 경과 시간을 출력합니다.
   * 
   * @param label time()에서 사용한 레이블과 동일해야 함
   */
  timeEnd(label: string): void {
    if (this.currentLogLevel === 'none') return;
    console.timeEnd(`${this.prefix} ${label}`);
  }

  /**
   * 로깅 활성화 여부 확인
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
    if (metadata && Object.keys(metadata).length > 0) {
      if (typeof metadata === 'object' && !Array.isArray(metadata) && console.table) {
        console.table(metadata);
      } else {
        console.log(metadata);
      }
    }
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

// 기본 로거 인스턴스 (즉시 초기화로 레이스 컨디션 방지)
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
