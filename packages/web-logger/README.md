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
- SSR/CSR compatibility: Works seamlessly in both server-side rendering and client-side environments

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

// Simple prefix
const logger = new WebLogger('[MyApp]');
logger.debug('Debug');
logger.info('Info');
logger.warn('Warning');
logger.error('Error');

// Custom metadata type (TypeScript)
type UserMeta = { userId: string; email?: string };
const typedLogger = new WebLogger<UserMeta>('[Typed]');
typedLogger.info('User logged in', { userId: 'u1' });

// Default prefix is "[APP]" when none is provided
const defaultLogger = new WebLogger();
defaultLogger.info('Hello');
```

### 2. React Hook (web-logger-react)

```tsx
import { useWebLogger } from '@cp949/web-logger-react';

function UserList() {
  const logger = useWebLogger('[UserList]');

  useEffect(() => {
    logger.info('Component mounted');
  }, [logger]);

  return <div>UserList</div>;
}
```

More patterns: see `packages/web-logger-react/README.md` in this repo or the npm package page.
Core options/API: see `packages/web-logger/README.md` for sensitive key/pattern controls.

### 3. Sandbox / Playground Ideas

- Try masking: `logger.info({ email: 'user@example.com', card: '4111-1111-1111-1111' })`
- Toggle log level in console: `window.__WEB_LOGGER_LOG_LEVEL__ = 'debug' | 'warn'`
- Test structured arrays/maps/sets: `logger.debug(new Map([['key', 'value']]))`
- Inspect sensitive key runtime changes: `addSensitiveKey('customSecret'); logger.info({ customSecret: 'secret' })`
- Run the demo script: `pnpm demo` (uses `packages/web-logger/scripts/demo.ts`)

### 3. Log Level Control

```typescript
import { setLogLevel, getLogLevel } from '@cp949/web-logger';

// Change log level (immediately applied)
setLogLevel('warn'); // Only warn and error output
setLogLevel('debug'); // All logs output

// Check current level
console.log(getLogLevel()); // 'debug'
```

**Runtime overrides win:** `setLogLevel` (or `window.__WEB_LOGGER_LOG_LEVEL__`) always overrides build-time seeds (`__INITIAL_LOG_LEVEL__` / `WEB_LOGGER_LOG_LEVEL`). Use seeds as defaults; rely on runtime switches for live debugging without redeploying.

### 4. Log Structured Objects Directly

```typescript
logger.info({ user: 'alice', password: 'secret' });
// Renders as a structured table with masked fields (e.g., password → my***)

// Arrays/Maps/Sets stay structured too, with circular references shown as [CIRCULAR].
logger.debug('Payload:', new Map([['self', map]]));
```

### 5. Automatic Sensitive Data Filtering

Web Logger provides two types of data masking with clear priority:

#### Key-based Masking (Higher Priority)
When object property keys match sensitive keywords, the value is partially masked showing only a few characters:

```typescript
// Sensitive keys are partially masked showing first few characters
logDebug('User data:', {
  password: 'mypassword123',  // → password: 'my***'
  email: 'user@example.com', // → email: 'use***@example.com'
  apiKey: 'key123456789'     // → apiKey: 'ke***'
});
```

**Sensitive keys include:** `password`, `passwd`, `pass`, `secret`, `token`, `apiKey`, `api_key`, `auth`, `authorization`, `cookie`, `session`, `private`, `ssn`, `email`, `phone`, `tel`, `mobile`, `card`, `credit`, `cvv`, `cvc`

#### Pattern-based Masking (Lower Priority)
For non-sensitive keys, values are scanned for patterns and masked accordingly:

```typescript
// Pattern detection in regular property values
logDebug('Contact info:', {
  userEmail: 'user@example.com',        // → userEmail: '[EMAIL]'
  description: 'Call 010-1234-5678',    // → description: 'Call [PHONE]'
  payment: '1234-5678-9012-3456'        // → payment: '[CARD]'
});
```

**Detected patterns:** Email addresses → `[EMAIL]`, Credit cards → `[CARD]`, Phone numbers → `[PHONE]`, JWT tokens → `[JWT]`, API keys → `[APIKEY]`, Passwords → `[PASSWORD]`

#### Priority Example
```typescript
// Key-based masking takes precedence
const data = {
  email: 'user@example.com',     // Key matches → 'use***@example.com' (not '[EMAIL]')
  userInfo: 'user@example.com'   // Key doesn't match → '[EMAIL]'
};
```

#### Detailed Masking Behavior

1. **Key-based masking (first check)**: If the property key matches a sensitive keyword, the value is partially masked:
   - Email: First 3 characters + `***` + `@` + domain (e.g., `use***@example.com`)
   - Password: First 2 characters + `***` (e.g., `my***`)
   - Others: First 2 characters + `***` (e.g., `se***`)

2. **Pattern-based masking (fallback)**: If the key is not sensitive, the value is scanned for patterns:
   - Email addresses: `user@example.com` → `[EMAIL]`
   - Credit cards: `1234-5678-9012-3456` → `[CARD]`
   - Phone numbers: `010-1234-5678` → `[PHONE]`
   - JWT tokens: `Bearer eyJ...` → `Bearer [JWT]`
   - API keys: 32+ character strings → `[APIKEY]`
   - Passwords: Strings containing `password: "..."` → `[PASSWORD]`

3. **Built-in objects**: Map, Set, Date, TypedArray, and Buffer are handled specially (see [Built-in Objects Handling](#-built-in-objects-handling) section).

4. **Nested objects**: Recursive sanitization up to 10 levels deep to prevent circular references.

5. **Cache invalidation on key changes**: Adding/removing/resetting sensitive keys clears the sanitization cache so new settings apply immediately at runtime.

### Sensitive Key Cookbook

```typescript
import { addSensitiveKey, removeSensitiveKey, resetSensitiveKeys, getSensitiveKeys } from '@cp949/web-logger';

// Add custom keys (immediately applied)
addSensitiveKey('customSecret');
addSensitiveKey('apiSecret');

// Remove a default key when you explicitly need raw values
removeSensitiveKey('email');

// Inspect current keys
console.log(getSensitiveKeys());

// Reset to defaults
resetSensitiveKeys();
```

### Override defaults via options

```typescript
import { WebLogger, setSensitivePatterns, addSensitivePatterns } from '@cp949/web-logger';

// Replace default keys at construction time
const logger = new WebLogger({
  prefix: '[Secure]',
  sensitiveKeys: ['customSecret', 'apiSecret'], // replaces defaults
  suppressPatternWarnings: true, // silence warnings if you drop built-in patterns
});

// Replace default patterns globally
setSensitivePatterns({
  ticket: /TICKET-\d+/g,
  hash: /\b[a-f0-9]{40}\b/gi,
});

// Merge without losing defaults
addSensitivePatterns({
  ticket: /TICKET-\d+/g,
});

// Build-time seeds vs runtime:
// - Use build-time defines for defaults (__INITIAL_LOG_LEVEL__, etc.)
// - Prefer runtime APIs (setLogLevel, addSensitivePatterns) for live toggles/experiments

// Control warnings when replacing defaults
setSensitivePatternWarnings(true); // suppress warnings
setSensitivePatternWarnings(false); // show warnings (default)
setSensitivePatternWarnings(true); // temporarily suppress
setSensitivePatterns({ ticket: /TICKET-\d+/g });
setSensitivePatternWarnings(false); // restore default

// Typed metadata example
type UserMeta = { userId: string; email?: string };
const typedLogger = new WebLogger<UserMeta>('[Typed]');
// Good
typedLogger.info('User', { userId: 'u1' });
// @ts-expect-error - email must be string | undefined
typedLogger.info('User', { userId: 'u2', email: 123 });
```

> `setSensitivePatterns` replaces all defaults and emits a warning if you drop built-in patterns. Use `addSensitivePatterns` to extend while keeping defaults.

### Bundler Tips (Vite / webpack / Rspack)
- Define build-time constants for better tree-shaking: `__DEV__`, `__NODE_ENV__`, `__INITIAL_LOG_LEVEL__`, and replace `process.env.NODE_ENV` / `WEB_LOGGER_LOG_LEVEL`.
- Ensure ESM tree-shaking is enabled (`sideEffects: false` or per-file) so unused levels/paths drop out.
- Browser-only: gate usage behind `typeof window !== 'undefined'` when integrating in isomorphic code.
- If you alias `process.env` in bundlers, keep the defines aligned to avoid double-injection.

**Vite define example**
```ts
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    __DEV__: true,
    __NODE_ENV__: JSON.stringify(process.env.NODE_ENV || 'development'),
    __INITIAL_LOG_LEVEL__: JSON.stringify('debug'),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.WEB_LOGGER_LOG_LEVEL': JSON.stringify(process.env.WEB_LOGGER_LOG_LEVEL || ''),
  },
});
```

**webpack/Rspack define example**
```js
// webpack.config.js
const webpack = require('webpack');

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
      __NODE_ENV__: JSON.stringify(process.env.NODE_ENV || 'development'),
      __INITIAL_LOG_LEVEL__: JSON.stringify(process.env.WEB_LOGGER_LOG_LEVEL || ''),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.WEB_LOGGER_LOG_LEVEL': JSON.stringify(process.env.WEB_LOGGER_LOG_LEVEL || ''),
    }),
  ],
};
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

### 7. Component-scoped Prefix (React)

```tsx
import { useEffect, useMemo } from 'react';
import { createPrefixedLogger } from '@cp949/web-logger';

function UserList() {
  const logger = useMemo(() => createPrefixedLogger('[UserList]'), []);

  useEffect(() => {
    logger.info('hello users'); // [UserList] hello users
  }, [logger]);

  return <div>UserList</div>;
}
```

## 🌍 SSR Support

This library fully supports Server-Side Rendering (SSR) environments like Next.js, Remix, Nuxt, and other frameworks.

### How It Works

The library automatically detects the environment and uses the appropriate global object:
- **Browser (CSR)**: Uses `window.__WEB_LOGGER_LOG_LEVEL__`
- **Server (SSR)**: Uses `globalThis.__WEB_LOGGER_LOG_LEVEL__`

The log level is shared across all WebLogger instances via `globalThis`, ensuring consistent behavior in both server and client environments.

### Key Features for SSR

1. **No Runtime Errors**: Works without throwing errors in Node.js environments
2. **Shared Log Level**: Log levels are shared across all instances via `globalThis`
3. **Same Security Policies**: Sensitive data masking works identically on server and client
4. **Zero Configuration**: No special setup required for SSR frameworks
5. **Built-in Objects Support**: Map, Set, Date, TypedArray, and Buffer are properly handled in both environments

### Usage in Next.js App Router

```typescript
// app/page.tsx
import { logDebug, logInfo } from '@cp949/web-logger';

export default function Page() {
  logInfo('Page component rendered'); // Works on both server and client
  
  return <div>Hello World</div>;
}

// app/api/route.ts
import { logDebug, logError } from '@cp949/web-logger';

export async function GET() {
  try {
    logDebug('API route called'); // Works in Node.js
    // ... your logic
    return Response.json({ message: 'Hello' });
  } catch (error) {
    logError('API error:', error); // Properly masks sensitive data
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### Log Level Synchronization

Log levels set in one environment are automatically synchronized:

```typescript
// Server-side (Next.js API route)
import { setLogLevel } from '@cp949/web-logger';

export async function GET() {
  setLogLevel('debug'); // Sets globalThis.__WEB_LOGGER_LOG_LEVEL__
  // All WebLogger instances (server and client) will use 'debug'
}

// Client-side (React component)
import { WebLogger } from '@cp949/web-logger';

const logger = new WebLogger('[App]');
logger.debug('This will work'); // Uses the level set on server
```

### Dynamic Import (Optional)

For complete control over when the logger loads:

```typescript
// Client-only logging
if (typeof window !== 'undefined') {
  const { logDebug } = await import('@cp949/web-logger');
  logDebug('Client-side only message');
}
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

Object properties with the following keys are automatically partially masked:
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

## 🗂️ Built-in Objects Handling

Web Logger properly handles JavaScript built-in objects like Map, Set, Date, TypedArray, and Buffer, ensuring sensitive data is masked even within these complex structures.

### Map Objects

Map keys and values are both sanitized. If a key matches a sensitive keyword, the key itself is partially masked:

```typescript
import { logInfo } from '@cp949/web-logger';

const userMap = new Map([
  ['email', 'user@example.com'],      // Key 'email' → 'use***@example.com'
  ['password', 'secret123'],          // Key 'password' → 'se***'
  ['username', 'john'],               // Normal key preserved
  ['contact', 'user@example.com']     // Value masked: '[EMAIL]'
]);

logInfo('User data:', userMap);
// Output: Map with partially masked keys and sanitized values
```

**Important Notes:**
- Map keys are checked against sensitive keywords (case-insensitive)
- If a key is sensitive, it's partially masked to prevent key collision
- Map values are sanitized using the same rules as regular object properties

### Set Objects

Set elements are sanitized individually. **Note**: If multiple different values are masked to the same pattern (e.g., multiple emails → `[EMAIL]`), Set's uniqueness property will deduplicate them:

```typescript
import { logInfo } from '@cp949/web-logger';

const emailSet = new Set([
  'user1@example.com',
  'user2@example.com',
  'admin@example.com'
]);

logInfo('Email list:', emailSet);
// Output: Set(['[EMAIL]']) - All emails masked to [EMAIL], Set deduplicates to single element
```

**Important Notes:**
- Set elements are sanitized using pattern-based masking
- After masking, if multiple elements become identical (e.g., all `[EMAIL]`), Set's uniqueness will reduce the size
- This is expected behavior due to Set's nature - consider using an Array if you need to preserve the original count

### Date Objects

Date objects are converted to ISO strings and then scanned for sensitive patterns:

```typescript
import { logInfo } from '@cp949/web-logger';

const eventDate = new Date('2024-12-01');
const customDate = {
  toISOString: () => 'meeting-with-user@example.com-2024'
};

logInfo('Event date:', eventDate);
// Output: "2024-12-01T00:00:00.000Z" (or similar ISO format)

logInfo('Custom date:', customDate);
// Output: "meeting-with-[EMAIL]-2024" (email pattern detected in ISO string)
```

### TypedArray and Buffer

Binary data types are masked to prevent accidental logging of sensitive binary content:

```typescript
import { logInfo } from '@cp949/web-logger';

// TypedArray (Uint8Array, Int32Array, etc.)
const buffer = new Uint8Array([1, 2, 3, 4, 5]);
logInfo('Binary data:', buffer);
// Output: "[BINARY_DATA]"

// Node.js Buffer
if (typeof Buffer !== 'undefined') {
  const nodeBuffer = Buffer.from('sensitive data');
  logInfo('Node buffer:', nodeBuffer);
  // Output: "[BUFFER]"
}
```

**Important Notes:**
- TypedArray (Uint8Array, Int32Array, Float64Array, etc.) → `[BINARY_DATA]`
- Node.js Buffer → `[BUFFER]` (checked before TypedArray to ensure correct detection)
- DataView objects are preserved as-is (not masked)

### Nested Built-in Objects

Built-in objects can be nested within regular objects and arrays:

```typescript
import { logInfo } from '@cp949/web-logger';

const complexData = {
  date: new Date('2024-12-01'),
  userMap: new Map([
    ['email', 'user@example.com'],
    ['password', 'secret']
  ]),
  emailSet: new Set(['user1@example.com', 'user2@example.com']),
  binaryData: new Uint8Array([1, 2, 3])
};

logInfo('Complex data:', complexData);
// All nested built-in objects are properly sanitized
```

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
- Statements: 85.26%
- Branches: 82.3%
- Functions: 90.36%
- Lines: 86.18%
- Test cases: 147 (including masking priority, built-in objects, console API, environment detection)

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

### v1.0.1 (2024-12-01)
- Added full SSR/CSR compatibility for Next.js and other frameworks
- Uses globalThis for server environments, window for browser
- No runtime errors in Node.js environments
- Shared log level across all instances via globalThis
- Enhanced type declarations for global variables
- Added SSR-specific test cases

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
