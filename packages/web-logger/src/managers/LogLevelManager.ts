import { LoggerError, LoggerErrorType, handleError } from '../errors';
import type { LogLevel } from '../types';
import { isValidLogLevel } from '../utils';
import { isDevelopment } from '../utils/environment';

/**
 * 전역 로그 레벨 상태 관리자 (싱글톤)
 * 모든 WebLogger 인스턴스가 동일한 로그 레벨을 공유하도록 함
 */
export class LogLevelManager {
  private static instance: LogLevelManager;

  private constructor() {
    // empty
  }

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
