/**
 * Logger 모듈
 *
 * 사용 예시:
 * import { logDebug, logError } from '@repo-logger';
 */

import { WebLogger, webLogger, type LogLevel, type LogMetadata } from './WebLogger';

export const logger = new WebLogger('[APP]');

/**
 * prefix가 지정된 새 WebLogger 인스턴스 생성 (컴포넌트/도메인 스코프용)
 *
 * @param prefix 로그 앞에 붙일 prefix (예: '[UserList]')
 * @returns 지정된 prefix를 사용하는 WebLogger
 */
export const createPrefixedLogger = <TMetadata extends LogMetadata = LogMetadata>(
  prefix: string,
): WebLogger<TMetadata> => {
  return webLogger.withPrefix(prefix) as WebLogger<TMetadata>;
};

/**
 * 디버그 레벨 로깅 (가장 상세한 정보)
 * 
 * `console.debug()`와 동일한 시그니처를 제공합니다.
 * 개발 환경에서만 활성화되는 상세한 디버깅 정보를 출력합니다.
 * 
 * @param message 로그 메시지
 * @param optionalParams 추가 파라미터 (console.debug와 동일)
 * 
 * @example
 * ```typescript
 * logDebug('Debug information');
 * logDebug('User data:', { userId: 123, email: 'user@example.com' });
 * ```
 */
export const logDebug = (message?: unknown, ...optionalParams: unknown[]): void => {
  webLogger.debug(message, ...optionalParams);
};

/**
 * 정보 레벨 로깅 (일반적인 정보)
 * 
 * `console.info()`와 동일한 시그니처를 제공합니다.
 * 일반적인 정보성 메시지를 출력합니다.
 * 
 * @param message 로그 메시지
 * @param optionalParams 추가 파라미터 (console.info와 동일)
 * 
 * @example
 * ```typescript
 * logInfo('Application started');
 * logInfo('User login:', { userId: 123 });
 * ```
 */
export const logInfo = (message?: unknown, ...optionalParams: unknown[]): void => {
  webLogger.info(message, ...optionalParams);
};

/**
 * 경고 레벨 로깅
 * 
 * `console.warn()`과 동일한 시그니처를 제공합니다.
 * 주의가 필요한 상황을 알리는 경고 메시지를 출력합니다.
 * 
 * @param message 로그 메시지
 * @param optionalParams 추가 파라미터 (console.warn과 동일)
 * 
 * @example
 * ```typescript
 * logWarn('Deprecated API used');
 * logWarn('Rate limit approaching:', { remaining: 10 });
 * ```
 */
export const logWarn = (message?: unknown, ...optionalParams: unknown[]): void => {
  webLogger.warn(message, ...optionalParams);
};

/**
 * 에러 레벨 로깅
 * 
 * `console.error()`와 동일한 시그니처를 제공합니다.
 * 프로덕션에서도 항상 활성화되며, 에러 상황을 기록합니다.
 * 
 * @param message 로그 메시지
 * @param optionalParams 추가 파라미터 (console.error와 동일)
 * 
 * @example
 * ```typescript
 * logError('Failed to fetch data');
 * logError('API error:', error, { endpoint: '/api/users' });
 * ```
 */
export const logError = (message?: unknown, ...optionalParams: unknown[]): void => {
  webLogger.error(message, ...optionalParams);
};

/**
 * 그룹화된 로깅 시작
 * 
 * 관련된 로그들을 그룹으로 묶어 구조화된 형태로 표시합니다.
 * `logGroupEnd()`를 호출하여 그룹을 닫아야 합니다.
 * 
 * @param title 그룹 제목
 * @param data 표시할 메타데이터 (선택적)
 * 
 * @example
 * ```typescript
 * logGroup('User Information', { id: 123, name: 'John' });
 * logDebug('Additional details...');
 * logGroupEnd();
 * ```
 */
export const logGroup = (title: string, data?: LogMetadata): void => {
  webLogger.group(title, data);
};

/**
 * 그룹화된 로깅 종료
 * 
 * `logGroup()`으로 시작한 그룹을 닫습니다.
 * 
 * @example
 * ```typescript
 * logGroup('User Information');
 * logDebug('Details...');
 * logGroupEnd();
 * ```
 */
export const logGroupEnd = (): void => {
  webLogger.groupEnd();
};

/**
 * 성능 측정 시작
 * 
 * 작업의 실행 시간을 측정하기 시작합니다.
 * `logTimeEnd()`를 호출하여 측정을 종료하고 경과 시간을 출력합니다.
 * 
 * @param label 측정할 작업의 레이블 (고유해야 함)
 * 
 * @example
 * ```typescript
 * logTime('API call');
 * await fetchData();
 * logTimeEnd('API call'); // API call: 123ms
 * ```
 */
export const logTime = (label: string): void => {
  webLogger.time(label);
};

/**
 * 성능 측정 종료
 * 
 * `logTime()`으로 시작한 측정을 종료하고 경과 시간을 출력합니다.
 * 
 * @param label `logTime()`에서 사용한 레이블과 동일해야 함
 * 
 * @example
 * ```typescript
 * logTime('API call');
 * await fetchData();
 * logTimeEnd('API call'); // API call: 123ms
 * ```
 */
export const logTimeEnd = (label: string): void => {
  webLogger.timeEnd(label);
};

/**
 * 일반 로깅 (console.log 호환)
 * 
 * `console.log()`와 동일한 시그니처를 제공합니다.
 * 
 * @param args 로그할 인자들 (여러 개 가능)
 * 
 * @example
 * ```typescript
 * logMsg('Simple message');
 * logMsg('Multiple', 'arguments', { data: 'value' });
 * ```
 */
export const logMsg = (...args: unknown[]): void => {
  webLogger.log(...args);
};

/**
 * 디버그 로깅 활성화 여부 확인
 * 
 * 로그 레벨이 `none`이 아닌 경우 `true`를 반환합니다.
 * 
 * @returns 로깅이 활성화되어 있으면 `true`, 비활성화되어 있으면 `false`
 * 
 * @example
 * ```typescript
 * if (isDebugEnabled()) {
 *   logDebug('Debug message');
 * }
 * ```
 */
export const isDebugEnabled = (): boolean => {
  return webLogger.isEnabled;
};

/**
 * 로그 레벨 설정 (프로덕션 디버깅용)
 * 
 * 모든 WebLogger 인스턴스에 즉시 반영되며, `globalThis`를 통해 SSR/CSR 환경에서도 동기화됩니다.
 * 브라우저 콘솔에서도 실행 가능합니다.
 * 
 * @param level 설정할 로그 레벨
 * 
 * @example
 * ```typescript
 * setLogLevel('warn'); // warn과 error만 출력
 * setLogLevel('debug'); // 모든 로그 출력
 * 
 * // 브라우저 콘솔에서
 * window.__WEB_LOGGER_LOG_LEVEL__ = 'debug';
 * ```
 */
export const setLogLevel = (level: LogLevel): void => {
  webLogger.setLogLevel(level);
};

/**
 * 현재 로그 레벨 확인
 * 
 * @returns 현재 로그 레벨
 * 
 * @example
 * ```typescript
 * console.log(getLogLevel()); // 'debug'
 * ```
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
export const convertToConsoleLogger = <TMetadata extends LogMetadata = LogMetadata>(
  logger: WebLogger<TMetadata>,
): Partial<Console> => {
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
          ? (data[1] as TMetadata)
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
          ? (data[1] as TMetadata)
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
