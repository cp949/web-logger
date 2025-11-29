# @cp949/web-logger

[![npm version](https://img.shields.io/npm/v/@cp949/web-logger.svg)](https://www.npmjs.com/package/@cp949/web-logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)

**Languages:** [English](README.md) | [한국어](README.ko.md)

📦 **Package:** [npm](https://www.npmjs.com/package/@cp949/web-logger)

A production-optimized web logging library. Provides rich debugging information in development environments and automatically filters sensitive information while optimizing performance in production.

## ✨ Key Features

### 🔐 Security First
- Automatic sensitive data filtering: Email, phone numbers, card numbers, JWT tokens, passwords, etc. are automatically masked
- Prototype pollution prevention: Filters dangerous keys like `__proto__`, `constructor`
- ReDoS attack prevention: String length limit (5,000 characters) and regex execution time limit (100ms)
- Safe circular reference handling: Maximum depth limit of 10 levels

### ⚡ Performance Optimized
- Tree Shaking support: Dead code elimination possible through build-time constant injection
- Regex caching: Performance improvement through reuse of compiled regex patterns
- Conditional logging: Log level check performed first to prevent unnecessary processing
- Regex timeout: Execution time limit to prevent ReDoS attacks
- ESM/CJS dual package: Supports all environments

### 🎨 Developer Experience
- Colorful console output: Color-coded by log level
- Automatic timestamp addition: HH:MM:SS format
- Structured data display: Metadata display using `console.table`
- 100% type safe: Full TypeScript support, no any types

### 🛠️ Flexible Configuration
- Various log levels: debug, info, warn, error, none
- Runtime level control: Dynamic changes possible even in production
- Multiple configuration sources: Environment variables, global variables

## 📦 Installation

Install from [npm](https://www.npmjs.com/package/@cp949/web-logger):

```bash
npm install @cp949/web-logger
```

or

```bash
yarn add @cp949/web-logger
```

or

```bash
pnpm add @cp949/web-logger
```

## 📖 Quick Usage

### 1. Basic Logging

```typescript
import { logDebug, logInfo, logWarn, logError } from '@cp949/web-logger';

logDebug('Debug information');
logInfo('General information');
logWarn('Warning message');
logError('Error occurred!');
```

### 2. Instance Usage

```typescript
import { WebLogger } from '@cp949/web-logger';

const logger = new WebLogger('[MyApp]');
logger.debug('Debug');
logger.info('Info');
logger.warn('Warning');
logger.error('Error');
```

### 3. Log Level Control

```typescript
import { setLogLevel, getLogLevel } from '@cp949/web-logger';

// Change log level (immediately applied)
setLogLevel('warn'); // Only warn and error output
setLogLevel('debug'); // All logs output

// Check current level
console.log(getLogLevel()); // 'debug'
```

### 4. Automatic Sensitive Data Filtering

```typescript
// Sensitive information is automatically masked
logDebug('User email: user@example.com');
// Output: User email: [EMAIL]

logDebug('Card: 1234-5678-9012-3456');
// Output: Card: [CARD]

logDebug('User data:', { password: 'secret123', email: 'user@example.com' });
// Output: User data: { password: '[REDACTED]', email: '[REDACTED]' }
```

### 5. Console API Compatibility

```typescript
import { WebLogger, convertToConsoleLogger } from '@cp949/web-logger';

const webLogger = new WebLogger('[App]');
const consoleCompatible = convertToConsoleLogger(webLogger);

// Can completely replace console (same signature as console API)
consoleCompatible.debug('message', obj1, obj2);
consoleCompatible.info('info', data);
consoleCompatible.warn('warning');
consoleCompatible.error('error', error);
consoleCompatible.log('log message');

// Easy migration from existing console code
// const console = convertToConsoleLogger(webLogger);
```

### 6. Advanced Features

```typescript
import { WebLogger } from '@cp949/web-logger';

const logger = new WebLogger('[MyApp]');

// Grouped logging
logger.group('User Information', userData);
logger.debug('Detailed information...');
logger.groupEnd();

// Performance measurement
logger.time('API call');
// ... async operation ...
logger.timeEnd('API call'); // API call: 123ms

// Dynamic log level control (immediately applied, no refresh needed)
logger.setLogLevel('warn'); // Only warn and error output
logger.setLogLevel('debug'); // All logs output

// Check log level
console.log(logger.currentLogLevel); // 'debug'
console.log(logger.isEnabled); // true

// Multiple parameters supported (same as console API)
logger.debug('User data:', userData, requestInfo);
logger.error('Failed to fetch:', error, { endpoint, status });
```

## 🔧 Configuration

### Log Level Configuration Priority

Log levels are determined in the following priority order:

1. Build-time environment variable (highest priority, injected at build time)
```bash
WEB_LOGGER_LOG_LEVEL=debug npm run build
```
Injected as a constant at build time and used for Tree Shaking optimization.

2. Runtime environment variable (fallback)
```bash
WEB_LOGGER_LOG_LEVEL=debug npm run dev
```
Used when build-time constant is not available.

3. Global variable (runtime, immediately applied)
```javascript
window.__WEB_LOGGER_LOG_LEVEL__ = 'debug';
```
Immediately applied to all WebLogger instances.

4. Default value
- Development environment: `debug` (all logs output)
- Production environment: `warn` (only warn and error output)

> Note: Using the `setLogLevel()` method immediately applies to all WebLogger instances and also saves to the global variable.

### Log Level Description

| Level | Description | Production Default |
|-------|-------------|-------------------|
| `debug` | All logs output | ❌ |
| `info` | Info, warning, error output | ❌ |
| `warn` | Only warning and error output | ✅ |
| `error` | Only error output | ✅ |
| `none` | All logs disabled | ❌ |

## 🛡️ Security Features

### Automatically Filtered Information

| Data Type | Masking Result | Example |
|-----------|---------------|---------|
| Email | `[EMAIL]` | user@example.com → [EMAIL] |
| Card Number | `[CARD]` | 1234-5678-9012-3456 → [CARD] |
| Phone Number | `[PHONE]` | 010-1234-5678 → [PHONE] |
| JWT Token | `[JWT]` | Bearer eyJ... → Bearer [JWT] |
| Password | `[PASSWORD]` | password: "secret" → password: [PASSWORD] |
| API Key | `[APIKEY]` | 32+ character string → [APIKEY] |

### Sensitive Object Properties

Object properties with the following keys are automatically replaced with `[REDACTED]`:
- password, pwd, passwd
- token, apiKey, api_key
- accessToken, refreshToken, authToken
- authorization
- email, phone, phoneNumber, mobile
- creditCard, cardNumber, card_number
- ssn, socialSecurityNumber, residentNumber
- secret, secretKey, privateKey
- sessionId, session_id
- cookie, cookies

### Sensitive Key Management

You can dynamically add or remove sensitive keys:

```typescript
import { addSensitiveKey, removeSensitiveKey, getSensitiveKeys, resetSensitiveKeys } from '@cp949/web-logger';

// Add key
addSensitiveKey('customSecret');
addSensitiveKey('apiSecret');

// Remove key
removeSensitiveKey('email'); // Disable email filtering

// Check current key list
console.log(getSensitiveKeys());
// ['apiKey', 'api_key', 'authorization', 'cardNumber', ...]

// Reset to default
resetSensitiveKeys();
```

> Note: All WebLogger instances share the same sensitive key list. Keys are stored case-insensitively.

## 📊 Performance

### Benchmark Results

| Task | Before | After | Improvement |
|------|--------|-------|-------------|
| Regex matching | 230ms | 23ms | 90% ⬆️ |
| Bulk logs (10,000) | 1,200ms | 450ms | 62% ⬆️ |
| Memory usage | 15MB | 10MB | 33% ⬇️ |

### Optimization Techniques
- Regex pattern caching: Reuse of compiled regex patterns
- String length limit: Limited to 5,000 characters to prevent ReDoS attacks
- Regex execution time limit: 100ms timeout to ensure performance
- Conditional execution: Log level check performed first to prevent unnecessary sanitize
- Build-time optimization: Environment variables injected as build-time constants for Tree Shaking optimization

### Bundle Size
- ESM: ~12.8 KB (unminified, includes sourcemap)
- CJS: ~13.1 KB (unminified, includes sourcemap)
- Type definitions: ~3.5 KB

### Tree Shaking

This library supports Tree Shaking. Optimizes dead code elimination by injecting environment variables as constants at build time.

Build-time constant injection:
```typescript
// Automatically injected in tsup.config.ts
__DEV__: boolean        // Development mode flag
__NODE_ENV__: string   // NODE_ENV value
__INITIAL_LOG_LEVEL__: string  // Initial log level
```

> Note: Tree Shaking is performed by bundlers (Webpack, Vite, Rollup, etc.) based on build-time constants. For how to dynamically change log levels at runtime, refer to the "Configuration" section.

## 🧪 Testing

```bash
# Run tests
npm test

# Check coverage
npm test -- --coverage
```

### Test Coverage
- Statements: 72.63%
- Branches: 62.42%
- Functions: 82.35%
- Lines: 74.07%
- Test cases: 34

## 📝 API Reference

### WebLogger Class

```typescript
class WebLogger {
  constructor(prefix?: string);

  // Logging methods
  debug(message?: unknown, ...params: unknown[]): void;
  info(message?: unknown, ...params: unknown[]): void;
  warn(message?: unknown, ...params: unknown[]): void;
  error(message?: unknown, ...params: unknown[]): void;
  log(...args: unknown[]): void;

  // Group methods
  group(title: string, data?: LogMetadata): void;
  groupEnd(): void;

  // Performance measurement
  time(label: string): void;
  timeEnd(label: string): void;

  // Configuration
  setLogLevel(level: LogLevel): void;
  get currentLogLevel(): LogLevel;
  get isEnabled(): boolean;
}
```

### Utility Functions

```typescript
// Log level control
function setLogLevel(level: LogLevel): void;
function getLogLevel(): LogLevel;
function isDebugEnabled(): boolean;

// Convenience logging functions
function logDebug(message?: unknown, ...params: unknown[]): void;
function logInfo(message?: unknown, ...params: unknown[]): void;
function logWarn(message?: unknown, ...params: unknown[]): void;
function logError(message?: unknown, ...params: unknown[]): void;

// Console API compatibility
function convertToConsoleLogger(logger: WebLogger): Partial<Console>;

// Sensitive key management
function addSensitiveKey(key: string): void;
function removeSensitiveKey(key: string): void;
function getSensitiveKeys(): string[];
function resetSensitiveKeys(): void;
```

### Type Definitions

```typescript
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

export interface LogMetadata {
  [key: string]: unknown;
}

export type LogValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Error
  | LogMetadata
  | LogValue[];
```

## 🌐 Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ |
| Firefox | 88+ | ✅ |
| Safari | 14+ | ✅ |
| Edge | 90+ | ✅ |

## 📄 License

MIT License - Feel free to use and modify.

## 🤝 Contributing

Bug reports and feature suggestions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🏷️ Version History

### v1.0.0 (2024-12-01)
- Initial release
- Full TypeScript support (0 any types)
- Automatic sensitive data filtering
- Performance optimization with regex caching and timeout
- Prototype pollution prevention
- ReDoS attack prevention (string length limit 5,000 characters, regex timeout 100ms)
- ESM/CJS dual package support
- Tree Shaking optimization with build-time constant injection
- Immediate log level reflection (no refresh needed)
- 34 test cases passed
