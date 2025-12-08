# @cp949/web-logger-react

React hooks for [@cp949/web-logger](https://www.npmjs.com/package/@cp949/web-logger).

**Languages:** [English](README.md) | [한국어](README.ko.md)

## Installation

```bash
pnpm add @cp949/web-logger-react @cp949/web-logger
```

or

```bash
npm install @cp949/web-logger-react @cp949/web-logger
```

or

```bash
yarn add @cp949/web-logger-react @cp949/web-logger
```

## Requirements

- React 18 or 19
- `@cp949/web-logger` (peer dependency)

## Usage

### Basic Usage

```tsx
import { useWebLogger } from '@cp949/web-logger-react';
import { useEffect } from 'react';

function UserList() {
  const logger = useWebLogger('[UserList]');

  useEffect(() => {
    logger.info('hello users'); // => [UserList] hello users
  }, [logger]);

  return <div>UserList</div>;
}
```

### Without Prefix

```tsx
import { useWebLogger } from '@cp949/web-logger-react';
import { useEffect } from 'react';

function App() {
  const logger = useWebLogger();

  useEffect(() => {
    logger.debug('Application started');
    logger.info('User logged in', { userId: 123 });
    logger.warn('Rate limit approaching');
    logger.error('Failed to fetch data', error);
  }, [logger]);

  return <div>App</div>;
}
```

### Multiple Components

```tsx
import { useWebLogger } from '@cp949/web-logger-react';

function UserList() {
  const logger = useWebLogger('[UserList]');

  useEffect(() => {
    logger.info('hello users'); // => [UserList] hello users
  }, [logger]);

  return <div>UserList</div>;
}

function UserDetails() {
  const logger = useWebLogger('[UserDetails]');

  useEffect(() => {
    logger.info('user info'); // => [UserDetails] user info
  }, [logger]);

  return <div>UserDetails</div>;
}
```

### Next.js / SSR-friendly usage

```tsx
// app/(client)/page.tsx (Next.js App Router)
'use client';

import { useEffect } from 'react';
import { useWebLogger } from '@cp949/web-logger-react';

export default function Page() {
  const logger = useWebLogger('[Page]');

  useEffect(() => {
    logger.info('mounted in browser');
  }, [logger]);

  return <div>Hello</div>;
}
```

> Use `useWebLogger` only in client components / browser contexts. For server-side logging, use your server logger or guard with `if (typeof window !== 'undefined')`.

#### Server-side note

- Prefer your platform logger (e.g., `console`, pino, winston) on the server.
- Keep `@cp949/web-logger` client-side to avoid bundling browser-only code into SSR lambdas.

## Why this hook?

- **Global state compatibility**: Uses the shared `webLogger` (and `createPrefixedLogger`) so runtime log level / sensitive key & pattern changes stay in sync.
- **React-friendly memoization**: `useMemo` avoids recreating instances on re-render; dependency on `prefix` makes intent explicit.
- **Safe defaults for app code**: In client components, you can import the hook and get a logger that respects global settings without wiring anything else.
- **Default prefix**: If you omit `prefix`, the shared `webLogger` is returned (default prefix `[APP]`).
- **Pattern warnings**: Suppress default-pattern warnings via `setSensitivePatternWarnings(true)` in `@cp949/web-logger` if you intentionally replace built-ins.

More options (sensitive keys/patterns, warnings): see `packages/web-logger/README.md` in this repo or the npm docs for @cp949/web-logger.

> Static prefix and client-only code? Declaring `const logger = createPrefixedLogger('[App]')` outside components is fine, but keep it in client-only modules to avoid pulling browser code into SSR bundles.

## API

### `useWebLogger(prefix?: string)`

Creates a WebLogger instance with optional prefix. The logger instance is memoized and only recreated when the prefix changes.

#### Parameters

- `prefix` (optional): A string prefix to prepend to all log messages (e.g., `'[UserList]'`)

#### Returns

A `WebLogger` instance with the following methods:

- `debug(message?: unknown, ...optionalParams: unknown[]): void`
- `info(message?: unknown, ...optionalParams: unknown[]): void`
- `warn(message?: unknown, ...optionalParams: unknown[]): void`
- `error(message?: unknown, ...optionalParams: unknown[]): void`
- `log(...args: unknown[]): void`
- `group(title: string, data?: LogMetadata): void`
- `groupEnd(): void`
- `time(label: string): void`
- `timeEnd(label: string): void`
- `setLogLevel(level: LogLevel): void`
- `get currentLogLevel(): LogLevel`
- `get isEnabled(): boolean`

For more details about the WebLogger API, see the [@cp949/web-logger documentation](https://www.npmjs.com/package/@cp949/web-logger).

#### Example

```tsx
import { useWebLogger } from '@cp949/web-logger-react';

function MyComponent() {
  const logger = useWebLogger('[MyComponent]');

  useEffect(() => {
    // All logs will be prefixed with [MyComponent]
    logger.debug('Component mounted');
    logger.info('Data loaded', { count: 10 });
    logger.warn('Warning message');
    logger.error('Error occurred', error);
  }, [logger]);

  return <div>My Component</div>;
}
```

## Features

- **Memoized Logger**: The logger instance is memoized and only recreated when the prefix changes
- **TypeScript Support**: Full TypeScript definitions included
- **React 18 & 19 Compatible**: Works with both React 18 and 19
- **Zero Configuration**: Works out of the box with @cp949/web-logger

## License

MIT

## Related

- [@cp949/web-logger](https://www.npmjs.com/package/@cp949/web-logger) - The core logging library
