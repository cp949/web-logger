# @cp949/web-logger-react

A small React adapter that creates stable `WebLogger` instances with `useWebLogger`.

[npm package](https://www.npmjs.com/package/@cp949/web-logger-react) · [한국어](README.ko.md) ·
[monorepo](../../README.md)

## Installation

```bash
pnpm add @cp949/web-logger @cp949/web-logger-react
```

Peer requirements:

- React 18 or 19
- `@cp949/web-logger` `^1.0.4`

## Usage

```tsx
import { useEffect } from 'react';
import { useWebLogger } from '@cp949/web-logger-react';

function UserList() {
  const logger = useWebLogger('[UserList]');

  useEffect(() => {
    logger.info('Users loaded', { count: 3 });
  }, [logger]);

  return <div>User list</div>;
}
```

The returned logger is memoized. It remains the same object across renders until the prefix changes.

Without a prefix, the hook returns the shared `webLogger` instance from `@cp949/web-logger`:

```tsx
function SaveButton() {
  const logger = useWebLogger();

  return <button onClick={() => logger.info('Save clicked')}>Save</button>;
}
```

All instances use the core package's shared log level and sensitive-data configuration. See the
[`@cp949/web-logger` README](../web-logger/README.md) for level control, masking, and the full logger API.

## Next.js

`useWebLogger` is a React hook, so call it from a Client Component:

```tsx
'use client';

import { useEffect } from 'react';
import { useWebLogger } from '@cp949/web-logger-react';

export function AccountPanel() {
  const logger = useWebLogger('[AccountPanel]');

  useEffect(() => {
    logger.debug('Panel mounted');
  }, [logger]);

  return <section>Account</section>;
}
```

The core package can be imported during server rendering, but this hook is for React component code. For
durable server logs, use a server logger with the transports and persistence your application requires.

## API

### `useWebLogger(prefix?: string): WebLogger`

| Parameter | Type | Description |
| --- | --- | --- |
| `prefix` | `string \| undefined` | Label prepended to log output. Omit it to use the shared logger. |

The package also re-exports the `WebLogger` and `LogLevel` TypeScript types from `@cp949/web-logger`.

## Development

From the monorepo root:

```bash
pnpm --filter @cp949/web-logger-react test
pnpm --filter @cp949/web-logger-react typecheck
pnpm --filter @cp949/web-logger-react build
```

Coverage thresholds are configured at 80% for statements, functions, and lines, and 75% for branches.

## License

MIT
