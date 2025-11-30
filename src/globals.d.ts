/**
 * 빌드 타임 상수 타입 선언 (tsup define)
 */
import type { LogLevel } from './WebLogger';

declare global {
  const __DEV__: boolean;
  const __NODE_ENV__: 'development' | 'production' | 'test';
  const __INITIAL_LOG_LEVEL__: LogLevel | '';

  var __WEB_LOGGER_LOG_LEVEL__: LogLevel | undefined;

  interface Window {
    __WEB_LOGGER_LOG_LEVEL__?: LogLevel;
  }

  interface GlobalThis {
    __WEB_LOGGER_LOG_LEVEL__?: LogLevel;
  }
}

export {};
