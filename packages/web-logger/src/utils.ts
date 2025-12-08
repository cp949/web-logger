import type { LogLevel, LogMetadata } from './types';

/**
 * 로그 레벨 유효성 검증
 */
export const isValidLogLevel = (level: unknown): level is LogLevel => {
  return typeof level === 'string' && ['debug', 'info', 'warn', 'error', 'none'].includes(level);
};

/**
 * 메타데이터 후보인지 확인
 */
export const isMetadataCandidate = (value: unknown): value is LogMetadata => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'object') {
    if (value instanceof Date) return false;
    if (ArrayBuffer.isView(value)) return false;
    return true;
  }
  return false;
};

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
export const shouldLog = (requestedLevel: LogLevel, currentLevel: LogLevel): boolean => {
  if (currentLevel === 'none') return false;
  if (requestedLevel === 'error') return true; // error는 항상 활성화

  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  const currentIndex = levels.indexOf(currentLevel);
  const requestedIndex = levels.indexOf(requestedLevel);
  return requestedIndex >= currentIndex;
};
