/**
 * Web Environment Conditional Logger
 *
 * 웹 환경용 조건부 로깅 유틸리티
 * - 개발 모드에서만 활성화
 * - 프로덕션 빌드에서 완전 제거 (Tree shaking)
 * - 브라우저 개발자 도구 최적화
 */

import { LOG_LEVEL_CONFIGS } from './constants';
import { LogLevelManager } from './managers/LogLevelManager';
import { SensitiveKeysManager } from './managers/SensitiveKeysManager';
import { SensitivePatternsManager } from './managers/SensitivePatternsManager';
import { sanitizeLogData } from './masking';
import type { LogLevel, LogMetadata, SensitivePatternMap, WebLoggerOptions } from './types';
import { isMetadataCandidate, shouldLog } from './utils';
import { isDevelopment } from './utils/environment';

// 싱글톤 인스턴스
const logLevelManager = LogLevelManager.getInstance();
const sensitiveKeysManager = SensitiveKeysManager.getInstance();
const sensitivePatternsManager = SensitivePatternsManager.getInstance();

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
  private readonly enableMasking: boolean;

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
    // enableMasking 기본값: 프로덕션 모드에서는 true, 개발 모드에서는 false
    this.enableMasking =
      resolvedOptions?.enableMasking !== undefined
        ? resolvedOptions.enableMasking
        : !isDevelopment();
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

    // 민감한 정보 필터링 (enableMasking이 true일 때만)
    const sanitizedMessage = this.enableMasking ? sanitizeLogData(message) : message;
    const sanitizedParams = this.enableMasking
      ? optionalParams.map((param) => sanitizeLogData(param))
      : optionalParams;
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

    // 민감한 정보 필터링 (enableMasking이 true일 때만)
    const sanitizedArgs = this.enableMasking ? args.map((arg) => sanitizeLogData(arg)) : args;

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

    // 민감한 정보 필터링 (enableMasking이 true일 때만)
    const sanitizedTitle =
      this.enableMasking && typeof title === 'string' ? sanitizeLogData(title) : title;
    const sanitizedData = this.enableMasking && data ? sanitizeLogData(data) : data;

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

// 타입 재export
export type { LogLevel, LogMetadata, SensitivePatternMap, WebLoggerOptions } from './types';
