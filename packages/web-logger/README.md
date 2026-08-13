# @cp949/web-logger

A browser-oriented TypeScript logger with runtime log levels, prefixed output, structured metadata, and
sensitive-data masking.

[npm package](https://www.npmjs.com/package/@cp949/web-logger) · [한국어](README.ko.md) ·
[monorepo](../../README.md)

## Installation

```bash
pnpm add @cp949/web-logger
```

The package includes ESM, CommonJS, source maps, and TypeScript declarations. Its compiled JavaScript
targets ES2020.

## Quick start

Use the shared logger through the convenience functions:

```typescript
import { logDebug, logError, logInfo, logWarn, setLogLevel } from '@cp949/web-logger';

setLogLevel('debug');

logDebug('Preparing request');
logInfo('Request completed', { status: 200 });
logWarn('Retry budget is low');
logError('Request failed', new Error('Network error'));
```

Create a separate prefix when a feature or component needs its own label:

```typescript
import { WebLogger } from '@cp949/web-logger';

const logger = new WebLogger('[Checkout]');

logger.info('Payment form opened');
logger.error('Payment failed', { orderId: 'order-42' });
```

Log lines include the prefix, local time, and level. Objects passed as metadata are displayed with
`console.table` when the runtime supports it.

## Log levels

All logger instances share one active log level.

| Level | Output |
| --- | --- |
| `debug` | `debug`, `info`, `warn`, and `error` |
| `info` | `info`, `warn`, and `error` |
| `warn` | `warn` and `error` |
| `error` | `error` only |
| `none` | No output |

Change or read the level at runtime:

```typescript
import { getLogLevel, setLogLevel } from '@cp949/web-logger';

setLogLevel('warn');
console.log(getLogLevel()); // 'warn'
```

In a browser console, the same shared value can be changed directly:

```javascript
window.__WEB_LOGGER_LOG_LEVEL__ = 'debug';
```

If no valid override is present, development builds use `debug` and production builds use `warn`.

## Sensitive-data masking

Masking is disabled in development builds and enabled in production builds unless `enableMasking` is set
explicitly. Enable it during development when test output may contain sensitive values:

```typescript
import { WebLogger } from '@cp949/web-logger';

const logger = new WebLogger({
  prefix: '[Account]',
  enableMasking: true,
});

logger.info('Profile loaded', {
  email: 'user@example.com',
  accessToken: 'do-not-log-this-value',
});
```

The built-in rules cover common credential, personal-data, payment, email, phone, card, JWT, and API-key
shapes. Object keys are matched case-insensitively and by substring, so a key such as `billingEmail` also
matches the default `email` key.

Add project-specific keys or patterns without removing the defaults:

```typescript
import { addSensitiveKey, addSensitivePatterns } from '@cp949/web-logger';

addSensitiveKey('customerReference');
addSensitivePatterns({
  internalTicket: /TICKET-\d{6}/g,
});
```

The key and pattern managers are global. Creating a logger with `sensitiveKeys` replaces the shared key
list, and `sensitivePatterns` replaces the shared pattern map:

```typescript
const logger = new WebLogger({
  sensitiveKeys: ['password', 'sessionToken'],
  sensitivePatterns: {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  },
  suppressPatternWarnings: true,
});
```

Use the exported reset functions to restore the built-in values after temporary configuration.

Masking is a best-effort safeguard. Do not intentionally send passwords, access tokens, private keys, or
other credentials to a logger.

## Structured values

The sanitizer handles nested objects and arrays as well as `Error`, `Date`, `Map`, `Set`, typed arrays,
and Node.js `Buffer` values. Circular references and deeply nested values are bounded so logging malformed
data does not recurse indefinitely.

```typescript
const logger = new WebLogger('[Cache]');

logger.info('Cache snapshot', new Map([['entries', 12]]));
logger.info('Last refresh', new Date());
logger.error(new Error('Cache unavailable'));
```

## Console-compatible adapter

`convertToConsoleLogger` returns a `Partial<Console>`. Supported logging, grouping, and timing methods use
the supplied `WebLogger`; unsupported utility methods are delegated to the host console when available.

```typescript
import { convertToConsoleLogger, WebLogger } from '@cp949/web-logger';

const appConsole = convertToConsoleLogger(new WebLogger('[Legacy]'));

appConsole.info?.('Migrated console call');
appConsole.time?.('load');
appConsole.timeEnd?.('load');
```

## SSR and Node.js

The module does not require `window` while it is imported, so it can be loaded during server rendering.
Calls made on the server write to that process's console. Runtime level changes are stored on `globalThis`;
the `window.__WEB_LOGGER_LOG_LEVEL__` shortcut is browser-only.

This package is intended for application diagnostics, not durable server logging. Use a server logger when
you need persistence, transports, request correlation, or structured ingestion.

## API summary

### Logger instances

| Export | Description |
| --- | --- |
| `WebLogger` | Logger class; accepts a prefix string or `WebLoggerOptions` |
| `webLogger` | Shared logger with the `[APP]` prefix |
| `logger` | Separate exported logger with the `[APP]` prefix |
| `createPrefixedLogger(prefix)` | Creates a logger with a new prefix |

`WebLogger` provides `debug`, `info`, `warn`, `error`, `log`, `group`, `groupEnd`, `time`, `timeEnd`,
`withPrefix`, `setLogLevel`, `currentLogLevel`, and `isEnabled`.

### Convenience functions

| Export | Description |
| --- | --- |
| `logDebug`, `logInfo`, `logWarn`, `logError` | Level-specific calls on `webLogger` |
| `logMsg` | `console.log`-style call on `webLogger` |
| `logGroup`, `logGroupEnd` | Start and finish a console group |
| `logTime`, `logTimeEnd` | Start and finish a named console timer |
| `setLogLevel`, `getLogLevel` | Change or read the shared level |
| `isDebugEnabled` | Reports whether logging is not set to `none` |
| `convertToConsoleLogger` | Adapts a `WebLogger` to `Partial<Console>` |

### Masking configuration

| Export | Description |
| --- | --- |
| `addSensitiveKey`, `removeSensitiveKey` | Update the shared sensitive-key set |
| `getSensitiveKeys`, `resetSensitiveKeys` | Read or reset sensitive keys |
| `setSensitivePatterns` | Replace the shared pattern map |
| `addSensitivePatterns` | Merge entries into the shared pattern map |
| `getSensitivePatterns`, `resetSensitivePatterns` | Read or reset patterns |
| `setSensitivePatternWarnings` | Suppress or enable warnings about removed default patterns |

Exported types are `LogLevel`, `LogMetadata`, `SensitivePatternMap`, and `WebLoggerOptions`.

## Development

From the monorepo root:

```bash
pnpm --filter @cp949/web-logger test
pnpm --filter @cp949/web-logger typecheck
pnpm --filter @cp949/web-logger build
```

Coverage thresholds are configured in `vitest.config.ts`: 58% statements, 48% branches, 66% functions,
and 60% lines.

## License

MIT
