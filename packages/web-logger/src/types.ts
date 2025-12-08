/**
 * 타입 정의
 */

/**
 * 민감 패턴 맵 타입
 */
export type SensitivePatternMap = Record<string, RegExp>;

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
 * 로그 레벨별 설정
 */
export interface LogLevelConfig {
  style: string;
  label: string;
}

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
  /**
   * 민감 정보 마스킹 활성화 여부
   * - 기본값: `!isDevelopment()` (개발 모드에서는 false, 프로덕션에서는 true)
   * - 개발 모드에서는 실제 값을 확인하기 위해 마스킹을 비활성화
   * - 프로덕션 모드에서는 보안을 위해 마스킹을 활성화
   *
   * @example
   * ```typescript
   * // 개발 모드에서도 마스킹 활성화
   * const logger = new WebLogger({ enableMasking: true });
   *
   * // 프로덕션 모드에서도 마스킹 비활성화
   * const logger = new WebLogger({ enableMasking: false });
   * ```
   */
  enableMasking?: boolean;
}

// Window 인터페이스 확장
declare global {
  interface Window {
    __WEB_LOGGER_LOG_LEVEL__?: LogLevel;
  }
}
