/**
 * Logger 모듈
 *
 * 사용 예시:
 * import { logDebug, logError } from '@repo-logger';
 */

import { WebLogger, webLogger, type LogLevel, type LogMetadata } from './WebLogger';

export const logger = new WebLogger('[APP]');

// 편의 함수들 (tree shaking을 위해 개별 export)
// 충돌 방지를 위해 log 접두사 사용
// console.debug(), console.info(), console.warn()과 동일한 시그니처
export const logDebug = (message?: unknown, ...optionalParams: unknown[]): void => {
  webLogger.debug(message, ...optionalParams);
};

export const logInfo = (message?: unknown, ...optionalParams: unknown[]): void => {
  webLogger.info(message, ...optionalParams);
};

export const logWarn = (message?: unknown, ...optionalParams: unknown[]): void => {
  webLogger.warn(message, ...optionalParams);
};

// console.error()와 동일한 시그니처
export const logError = (message?: unknown, ...optionalParams: unknown[]): void => {
  webLogger.error(message, ...optionalParams);
};

export const logGroup = (title: string, data?: LogMetadata): void => {
  webLogger.group(title, data);
};

export const logGroupEnd = (): void => {
  webLogger.groupEnd();
};

export const logTime = (label: string): void => {
  webLogger.time(label);
};

export const logTimeEnd = (label: string): void => {
  webLogger.timeEnd(label);
};

export const logMsg = (...args: unknown[]): void => {
  webLogger.log(...args);
};

// 개발 모드 확인 유틸리티
export const isDebugEnabled = (): boolean => {
  return webLogger.isEnabled;
};

/**
 * 로그 레벨 설정 (프로덕션 디버깅용)
 * 브라우저 콘솔에서 실행 가능
 */
export const setLogLevel = (level: LogLevel): void => {
  webLogger.setLogLevel(level);
};

/**
 * 현재 로그 레벨 확인
 */
export const getLogLevel = (): LogLevel => {
  return webLogger.currentLogLevel;
};

/**
 * WebLogger를 console API와 호환되는 객체로 변환
 * 
 * 기존 console 사용 코드를 WebLogger로 쉽게 마이그레이션할 수 있습니다.
 * 주요 로깅 메서드(debug, info, warn, error, log)는 WebLogger를 통해 처리되며,
 * 민감한 정보 자동 필터링과 로그 레벨 제어 기능을 사용할 수 있습니다.
 * 
 * @param logger 변환할 WebLogger 인스턴스
 * @returns console API와 호환되는 객체 (Partial<Console>)
 * 
 * @example
 * ```typescript
 * const webLogger = new WebLogger('[App]');
 * const consoleCompatible = convertToConsoleLogger(webLogger);
 * 
 * // console을 완전히 대체 가능
 * consoleCompatible.debug('message', obj1, obj2);
 * consoleCompatible.info('info', data);
 * consoleCompatible.warn('warning');
 * consoleCompatible.error('error', error);
 * ```
 */
export const convertToConsoleLogger = (logger: WebLogger): Partial<Console> => {
  return {
    // 기본 로깅 메서드들 (WebLogger 사용)
    debug: (...data: unknown[]): void => {
      if (data.length === 0) {
        logger.debug();
      } else {
        logger.debug(data[0], ...data.slice(1));
      }
    },
    info: (...data: unknown[]): void => {
      if (data.length === 0) {
        logger.info();
      } else {
        logger.info(data[0], ...data.slice(1));
      }
    },
    warn: (...data: unknown[]): void => {
      if (data.length === 0) {
        logger.warn();
      } else {
        logger.warn(data[0], ...data.slice(1));
      }
    },
    error: (...data: unknown[]): void => {
      if (data.length === 0) {
        logger.error();
      } else {
        logger.error(data[0], ...data.slice(1));
      }
    },
    log: (...data: unknown[]): void => {
      logger.log(...data);
    },

    // 그룹 메서드들
    group: (...data: unknown[]): void => {
      if (data.length === 0) {
        logger.group('');
      } else {
        const title = String(data[0]);
        const metadata = data.length > 1 && typeof data[1] === 'object' && !Array.isArray(data[1]) && data[1] !== null
          ? (data[1] as LogMetadata)
          : undefined;
        logger.group(title, metadata);
      }
    },
    groupEnd: (): void => {
      logger.groupEnd();
    },
    groupCollapsed: (...data: unknown[]): void => {
      // WebLogger는 groupCollapsed를 지원하지 않으므로 group으로 대체
      if (data.length === 0) {
        logger.group('');
      } else {
        const title = String(data[0]);
        const metadata = data.length > 1 && typeof data[1] === 'object' && !Array.isArray(data[1]) && data[1] !== null
          ? (data[1] as LogMetadata)
          : undefined;
        logger.group(title, metadata);
      }
    },

    // 성능 측정 메서드들
    time: (label: string): void => {
      logger.time(label);
    },
    timeEnd: (label: string): void => {
      logger.timeEnd(label);
    },
    timeLog: (label?: string, ...data: unknown[]): void => {
      // WebLogger는 timeLog를 지원하지 않으므로 원래 console로 위임
      if (typeof console !== 'undefined' && console.timeLog) {
        console.timeLog(label, ...data);
      }
    },

    // 기타 console 메서드들 (원래 console로 위임)
    table: (data: unknown): void => {
      if (typeof console !== 'undefined' && console.table) {
        console.table(data);
      }
    },
    clear: (): void => {
      if (typeof console !== 'undefined' && console.clear) {
        console.clear();
      }
    },
    trace: (...data: unknown[]): void => {
      if (typeof console !== 'undefined' && console.trace) {
        console.trace(...data);
      }
    },
    dir: (...data: unknown[]): void => {
      if (typeof console !== 'undefined' && console.dir) {
        console.dir(...data);
      }
    },
    dirxml: (...data: unknown[]): void => {
      if (typeof console !== 'undefined' && console.dirxml) {
        console.dirxml(...data);
      }
    },
    count: (label?: string): void => {
      if (typeof console !== 'undefined' && console.count) {
        console.count(label);
      }
    },
    countReset: (label?: string): void => {
      if (typeof console !== 'undefined' && console.countReset) {
        console.countReset(label);
      }
    },
    assert: (condition: boolean, ...data: unknown[]): void => {
      if (typeof console !== 'undefined' && console.assert) {
        console.assert(condition, ...data);
      }
    },
    profile: (label?: string): void => {
      if (typeof console !== 'undefined' && console.profile) {
        console.profile(label);
      }
    },
    profileEnd: (label?: string): void => {
      if (typeof console !== 'undefined' && console.profileEnd) {
        console.profileEnd(label);
      }
    },
    timeStamp: (label?: string): void => {
      if (typeof console !== 'undefined' && console.timeStamp) {
        console.timeStamp(label);
      }
    },
  };
};
