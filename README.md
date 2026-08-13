# web-logger

TypeScript monorepo for a browser-oriented logger and its React hook.

**Languages:** [English](README.md) | [한국어](README.ko.md)

## Packages

| Package | Purpose |
| --- | --- |
| [`@cp949/web-logger`](packages/web-logger/README.md) | Log levels, prefixed output, structured data, and sensitive-data masking |
| [`@cp949/web-logger-react`](packages/web-logger-react/README.md) | A memoized React hook for component-scoped loggers |

The repository also contains [`logger-demo`](apps/logger-demo), a Vite application used to try both
packages in a browser.

## Install a package

Install the core package for plain TypeScript or JavaScript projects:

```bash
pnpm add @cp949/web-logger
```

React applications need both packages:

```bash
pnpm add @cp949/web-logger @cp949/web-logger-react
```

## Quick start

```typescript
import { logError, logInfo, setLogLevel } from '@cp949/web-logger';

setLogLevel('info');

logInfo('Application started');
logError('Request failed', { status: 500 });
```

For React components:

```tsx
import { useEffect } from 'react';
import { useWebLogger } from '@cp949/web-logger-react';

function Checkout() {
  const logger = useWebLogger('[Checkout]');

  useEffect(() => {
    logger.info('Mounted');
  }, [logger]);

  return null;
}
```

See the package READMEs for configuration details and the complete public API.

## Repository setup

Requirements:

- Node.js `^20.19.0 || >=22.12.0`
- pnpm `10.25.0`

```bash
pnpm install
pnpm dev
```

`pnpm dev` builds the two library packages first, then starts their watch tasks and the demo application.

## Development commands

| Command | Description |
| --- | --- |
| `pnpm build` | Build every workspace package through Turborepo |
| `pnpm dev` | Build the libraries, then start persistent development tasks |
| `pnpm test` | Run package test suites |
| `pnpm typecheck` | Type-check every workspace package |
| `pnpm lint` | Run package lint tasks |
| `pnpm format:check` | Check repository formatting with Biome |
| `pnpm size` | Build and report both library bundle sizes |
| `pnpm size:ci` | Run the configured size-limit checks and print JSON |

Run a task for one package with a pnpm filter:

```bash
pnpm --filter @cp949/web-logger test
pnpm --filter @cp949/web-logger-react typecheck
```

## Repository layout

```text
apps/
  logger-demo/             Browser demo
packages/
  web-logger/              Core logger
  web-logger-react/        React hook
```

Generated package output is written to each package's `dist/` directory.

## Security

Masking is a safeguard for accidental console output, not a reason to pass credentials or secrets to a
logger. Keep sensitive values out of logs whenever possible and configure application-specific keys and
patterns when the defaults are not enough.

## License

The packages are published under the MIT license.
