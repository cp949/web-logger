import { getSanitizeCache, hasSanitizeCache, maskValueCache, setSanitizeCache } from './cache';
import { MAX_DEPTH, MAX_STRING_LENGTH, REGEX_TIMEOUT_MS, UNSAFE_KEYS } from './constants';
import { LoggerError, LoggerErrorType, handleError } from './errors';
import { SensitiveKeysManager } from './managers/SensitiveKeysManager';
import { SensitivePatternsManager } from './managers/SensitivePatternsManager';

// 싱글톤 인스턴스
const sensitiveKeysManager = SensitiveKeysManager.getInstance();
const sensitivePatternsManager = SensitivePatternsManager.getInstance();

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
export function maskSensitiveValue(value: unknown, key?: string): string {
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
 * 민감한 정보 자동 필터링
 *
 * 프로덕션에서 개인정보 보호를 위해 로그 데이터를 자동으로 정화합니다.
 * 재귀적으로 객체를 순회하며 민감한 정보를 마스킹합니다.
 *
 * **마스킹 우선순위:**
 * 1. 키 기반 마스킹 (최우선): 객체 속성 키가 민감 키워드와 일치하면 전체 값이 부분 마스킹
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
 * // → { password: '12***', email: 'use***@example.com' }
 *
 * sanitizeLogData({ userInfo: 'user@example.com' })
 * // → { userInfo: '[EMAIL]' }
 * ```
 */
export function sanitizeLogData(
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
    if (hasSanitizeCache(data as object)) {
      return getSanitizeCache(data as object);
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
    setSanitizeCache(data as object, sanitized);
    return sanitized;
  }

  // 배열인 경우 각 요소 필터링
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item, depth + 1, visited));
  }

  return data;
}
