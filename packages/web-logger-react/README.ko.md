# @cp949/web-logger-react

[@cp949/web-logger](https://www.npmjs.com/package/@cp949/web-logger)를 위한 React 훅.

**Languages:** [English](README.md) | [한국어](README.ko.md)

## 설치

```bash
pnpm add @cp949/web-logger-react @cp949/web-logger
```

또는

```bash
npm install @cp949/web-logger-react @cp949/web-logger
```

또는

```bash
yarn add @cp949/web-logger-react @cp949/web-logger
```

## 요구 사항

- React 18 또는 19
- `@cp949/web-logger` (peer dependency)

## 사용법

### 기본 사용

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

### Prefix 없이

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

### 여러 컴포넌트에서 사용

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

function UserDetails() {
  const logger = useWebLogger('[UserDetails]');

  useEffect(() => {
    logger.info('user info'); // => [UserDetails] user info
  }, [logger]);

  return <div>UserDetails</div>;
}
```

### Next.js / SSR 환경에서

```tsx
// app/(client)/page.tsx (Next.js App Router)
'use client';

import { useEffect } from 'react';
import { useWebLogger } from '@cp949/web-logger-react';

export default function Page() {
  const logger = useWebLogger('[Page]');

  useEffect(() => {
    logger.info('브라우저에서 마운트됨');
  }, [logger]);

  return <div>Hello</div>;
}
```

> `useWebLogger`는 클라이언트 컴포넌트/브라우저 컨텍스트에서만 호출하세요. 서버 사이드에서는 서버 로거나 `if (typeof window !== 'undefined')`와 함께 사용하세요.

#### 서버 사이드 안내

- 서버에서는 플랫폼 로거(예: `console`, pino, winston 등)를 사용하는 편이 좋습니다.
- `@cp949/web-logger`는 브라우저 전용이므로 SSR 함수 번들에 포함되지 않도록 클라이언트 코드로만 한정하세요.

## 이 훅을 쓰는 이유

- **전역 상태 호환**: 공유 `webLogger`/`createPrefixedLogger`를 사용하므로 런타임 로그 레벨·민감 키/패턴 변경과 즉시 동기화됩니다.
- **React 친화적 메모이제이션**: `useMemo`로 리렌더 시 인스턴스 재생성을 피하고, `prefix` 의존성을 명시합니다.
- **안전한 기본값**: 클라이언트 컴포넌트에서 훅만 불러도 전역 설정을 따르는 로거를 바로 사용할 수 있습니다.
- **기본 prefix**: `prefix`를 생략하면 공유 `webLogger`(기본 prefix `[APP]`)가 반환됩니다.
- **패턴 경고 제어**: 기본 패턴을 교체할 때는 `@cp949/web-logger`의 `setSensitivePatternWarnings(true)`로 경고를 숨길 수 있습니다.

민감 키/패턴 옵션과 자세한 설정은 저장소의 `packages/web-logger/README.ko.md` 또는 @cp949/web-logger 문서에서 확인하세요.

> 정적 prefix이고 클라이언트 전용 코드라면 컴포넌트 밖에서 `const logger = createPrefixedLogger('[App]')`로 써도 됩니다. 다만 SSR 번들에 브라우저 코드가 섞이지 않도록 클라이언트 모듈에서만 선언하세요.

## API

### `useWebLogger(prefix?: string)`

옵션인 prefix를 포함해 WebLogger 인스턴스를 생성합니다. prefix가 바뀔 때만 인스턴스가 재생성되도록 memoization 됩니다.

#### 파라미터

- `prefix`(선택): 모든 로그 메시지 앞에 붙일 문자열 (예: `'[UserList]'`)

#### 반환값

다음 메서드를 가진 `WebLogger` 인스턴스:

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

WebLogger API 상세는 [@cp949/web-logger 문서](https://www.npmjs.com/package/@cp949/web-logger)를 참고하세요.

#### 예시

```tsx
import { useWebLogger } from '@cp949/web-logger-react';
import { useEffect } from 'react';

function MyComponent() {
  const logger = useWebLogger('[MyComponent]');

  useEffect(() => {
    // 모든 로그에 [MyComponent] prefix가 붙습니다
    logger.debug('Component mounted');
    logger.info('Data loaded', { count: 10 });
    logger.warn('Warning message');
    logger.error('Error occurred', error);
  }, [logger]);

  return <div>My Component</div>;
}
```

## 특징

- **메모이즈된 로거**: prefix가 바뀔 때만 새 인스턴스를 생성
- **TypeScript 지원**: 전체 타입 정의 제공
- **React 18 & 19 호환**: 두 버전 모두 지원
- **Zero 설정**: @cp949/web-logger만 추가하면 바로 동작

## 라이선스

MIT

## 관련 패키지

- [@cp949/web-logger](https://www.npmjs.com/package/@cp949/web-logger) - 핵심 로깅 라이브러리
