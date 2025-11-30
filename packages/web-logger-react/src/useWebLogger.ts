/**
 * React hook for creating a WebLogger instance with optional prefix
 */

import { useMemo } from 'react';
import { createPrefixedLogger, WebLogger, webLogger } from '@cp949/web-logger';

/**
 * React hook for creating a WebLogger instance with optional prefix
 *
 * @param prefix - Optional prefix string for log messages (e.g., '[UserList]')
 * @returns WebLogger instance
 *
 * @example
 * ```tsx
 * function UserList() {
 *   const logger = useWebLogger('[UserList]');
 *
 *   useEffect(() => {
 *     logger.info('hello users'); // => [UserList] hello users
 *   }, [logger]);
 *
 *   return <div>UserList</div>;
 * }
 * ```
 */
export function useWebLogger(prefix?: string): WebLogger {
  return useMemo(() => {
    return prefix ? createPrefixedLogger(prefix) : webLogger;
  }, [prefix]);
}
