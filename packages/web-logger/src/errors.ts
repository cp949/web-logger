import { isDevelopment } from './utils/environment';

/**
 * 에러 타입 정의
 */
export enum LoggerErrorType {
  STORAGE_ACCESS = 'STORAGE_ACCESS',
  REGEX_TIMEOUT = 'REGEX_TIMEOUT',
  REGEX_ERROR = 'REGEX_ERROR',
  INVALID_LOG_LEVEL = 'INVALID_LOG_LEVEL',
}

/**
 * Logger 에러 클래스
 */
export class LoggerError extends Error {
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
export const handleError = (error: unknown, context: string): void => {
  if (isDevelopment()) {
    console.warn(`[WebLogger] ${context}:`, error);
  }
  // 프로덕션에서는 조용히 실패 (에러 로깅만)
};
