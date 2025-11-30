# Logger Demo

Next.js demo application for testing `@cp949/web-logger` and `@cp949/web-logger-react`.

## Features

This demo app showcases:

1. **Direct Function Usage** - Using log functions directly from `@cp949/web-logger`
2. **React Hook Usage** - Using `useWebLogger` hook from `@cp949/web-logger-react`
3. **Sensitive Data Filtering** - Automatic filtering of emails, phone numbers, passwords, etc.
4. **Log Level Control** - Dynamic log level changes

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

## Usage Examples

### 1. Direct Function Usage

```typescript
import { logDebug, logInfo, logWarn, logError } from '@cp949/web-logger';

logDebug('Debug message');
logInfo('Info message');
logWarn('Warning message');
logError('Error message');
```

### 2. React Hook Usage

```tsx
import { useWebLogger } from '@cp949/web-logger-react';

function MyComponent() {
  const logger = useWebLogger('[MyComponent]');
  
  useEffect(() => {
    logger.info('Component mounted');
  }, [logger]);
  
  return <div>My Component</div>;
}
```

### 3. Sensitive Data Filtering

The logger automatically filters sensitive data:

```typescript
logInfo('User data:', {
  email: 'user@example.com',  // → [EMAIL]
  phone: '010-1234-5678',     // → [PHONE]
  password: 'secret123',      // → [REDACTED]
  card: '1234-5678-9012-3456' // → [CARD]
});
```

### 4. Log Level Control

```typescript
import { setLogLevel, getLogLevel } from '@cp949/web-logger';

setLogLevel('warn'); // Only warn and error will be shown
setLogLevel('debug'); // All logs will be shown
```

## Tech Stack

- **Next.js**: 16.0.5
- **React**: 19
- **TypeScript**: 5.9.3
- **@cp949/web-logger**: Workspace dependency
- **@cp949/web-logger-react**: Workspace dependency

## Project Structure

```
apps/logger-demo/
├── app/
│   ├── components/
│   │   ├── UserList.tsx      # Example component using useWebLogger
│   │   └── UserDetails.tsx   # Example component using useWebLogger
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Main demo page
│   └── globals.css           # Global styles
├── package.json
├── tsconfig.json
└── next.config.ts
```

