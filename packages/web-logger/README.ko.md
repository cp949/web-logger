# @cp949/web-logger

[![npm version](https://img.shields.io/npm/v/@cp949/web-logger.svg)](https://www.npmjs.com/package/@cp949/web-logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)

**언어:** [English](README.md) | [한국어](README.ko.md)

📦 **패키지:** [npm](https://www.npmjs.com/package/@cp949/web-logger)

프로덕션 환경에 최적화된 웹 로깅 라이브러리입니다. 개발 환경에서는 풍부한 디버깅 정보를 제공하고, 프로덕션에서는 자동으로 민감한 정보를 필터링하며 성능에 최적화됩니다.

## ✨ 주요 특징

### 🔐 보안 우선

- 민감한 정보 자동 필터링: 이메일, 전화번호, 카드번호, JWT 토큰, 패스워드 등 자동 마스킹
- 프로토타입 오염 방지: `__proto__`, `constructor` 등 위험한 키 필터링
- ReDoS 공격 방지: 문자열 길이 제한 (5,000자) 및 정규식 실행 시간 제한 (100ms)
- 순환 참조 안전 처리: 최대 깊이 10단계 제한

### ⚡ 성능 최적화

- Tree Shaking 지원: 빌드 타임 상수 주입으로 데드 코드 제거 가능
- 정규식 캐싱: 컴파일된 정규식 재사용으로 성능 향상
- 조건부 로깅: 로그 레벨 체크를 먼저 수행하여 불필요한 처리 방지
- 정규식 타임아웃: ReDoS 공격 방지를 위한 실행 시간 제한
- ESM/CJS 듀얼 패키지: 모든 환경 지원
- SSR/CSR 호환: 서버 사이드 렌더링과 클라이언트 사이드 환경 모두에서 완벽 작동

### 🎨 개발자 경험

- 컬러풀한 콘솔 출력: 로그 레벨별 색상 구분
- 타임스탬프 자동 추가: HH:MM:SS 형식
- 구조화된 데이터 표시: `console.table`을 활용한 메타데이터 표시
- 100% 타입 안전: TypeScript 완벽 지원, any 타입 없음

### 🛠️ 유연한 설정

- 다양한 로그 레벨: debug, info, warn, error, none
- 런타임 레벨 제어: 프로덕션에서도 동적 변경 가능
- 다중 설정 소스: 환경변수, 전역변수

## 📦 설치

[npm](https://www.npmjs.com/package/@cp949/web-logger)에서 설치:

```bash
npm install @cp949/web-logger
```

또는

```bash
yarn add @cp949/web-logger
```

또는

```bash
pnpm add @cp949/web-logger
```

## 📖 간단한 사용법

### 1. 기본 로깅

```typescript
import { logDebug, logInfo, logWarn, logError } from '@cp949/web-logger';

logDebug('디버깅 정보');
logInfo('일반 정보');
logWarn('경고 메시지');
logError('에러 발생!');
```

### 2. 인스턴스 사용

```typescript
import { WebLogger } from '@cp949/web-logger';

// 단순 prefix
const logger = new WebLogger('[MyApp]');
logger.debug('디버깅');
logger.info('정보');
logger.warn('경고');
logger.error('에러');

// 커스텀 메타데이터 타입 (TypeScript)
type UserMeta = { userId: string; email?: string };
const typedLogger = new WebLogger<UserMeta>('[Typed]');
typedLogger.info('사용자 로그인', { userId: 'u1' });

// prefix를 생략하면 기본값 "[APP]"이 사용됩니다
const defaultLogger = new WebLogger();
defaultLogger.info('안녕하세요');
```

### 2. React 훅 (web-logger-react)

```tsx
import { useWebLogger } from '@cp949/web-logger-react';

function UserList() {
  const logger = useWebLogger('[UserList]');

  useEffect(() => {
    logger.info('컴포넌트 마운트');
  }, [logger]);

  return <div>UserList</div>;
}
```

더 많은 사용 패턴은 저장소의 `packages/web-logger-react/README.ko.md` 또는 npm 패키지 페이지에서 확인하세요.
민감 키/패턴 등 옵션은 `packages/web-logger/README.ko.md`에서 확인할 수 있습니다.

### 3. 샌드박스/플레이그라운드 아이디어

- 마스킹 체험: `logger.info({ email: 'user@example.com', card: '4111-1111-1111-1111' })`
- 콘솔에서 로그 레벨 토글: `window.__WEB_LOGGER_LOG_LEVEL__ = 'debug' | 'warn'`
- 배열/Map/Set 구조 확인: `logger.debug(new Map([['key', 'value']]))`
- 민감 키 런타임 변경 확인: `addSensitiveKey('customSecret'); logger.info({ customSecret: 'secret' })`
- 데모 스크립트 실행: `pnpm demo` (packages/web-logger/scripts/demo.ts 사용)

### 3. 로그 레벨 제어

```typescript
import { setLogLevel, getLogLevel } from '@cp949/web-logger';

// 로그 레벨 변경 (즉시 반영)
setLogLevel('warn'); // warn, error만 출력
setLogLevel('debug'); // 모든 로그 출력

// 현재 레벨 확인
console.log(getLogLevel()); // 'debug'
```

**런타임 우선:** `setLogLevel`(또는 `window.__WEB_LOGGER_LOG_LEVEL__`)은 항상 빌드 시 기본값(`__INITIAL_LOG_LEVEL__`, `WEB_LOGGER_LOG_LEVEL`)보다 우선합니다. 기본값은 시드로 두고, 라이브 디버깅은 런타임 스위치로 제어하세요.

### 4. 객체를 바로 구조화해 로깅

```typescript
logger.info({ user: 'alice', password: 'secret' });
// 구조화된 테이블로 표시되고 민감 필드(예: password)는 [REDACTED] 처리됩니다.

// 배열/Map/Set도 구조를 유지하며, 순환 참조는 [CIRCULAR]로 표시됩니다.
logger.debug('Payload:', new Map([['self', map]]));
```

### 5. 민감한 정보 자동 필터링

Web Logger는 명확한 우선순위를 가진 두 가지 데이터 마스킹 방식을 제공합니다:

#### 키 기반 마스킹 (높은 우선순위)

객체 속성 키가 민감한 키워드와 일치하면 값 전체가 `[REDACTED]`로 대체됩니다:

```typescript
// 민감한 키는 값에 관계없이 완전히 마스킹됩니다
logDebug('User data:', {
  password: '123', // → password: '[REDACTED]'
  email: 'not-an-email', // → email: '[REDACTED]'
  apiKey: 'key123', // → apiKey: '[REDACTED]'
});
```

**민감한 키 목록:** `password`, `passwd`, `pass`, `secret`, `token`, `apiKey`, `api_key`, `auth`, `authorization`, `cookie`, `session`, `private`, `ssn`, `email`, `phone`, `tel`, `mobile`, `card`, `credit`, `cvv`, `cvc`

#### 패턴 기반 마스킹 (낮은 우선순위)

민감하지 않은 키의 경우, 값을 검사하여 패턴에 따라 마스킹합니다:

```typescript
// 일반 속성 값에서 패턴 감지
logDebug('Contact info:', {
  userEmail: 'user@example.com', // → userEmail: '[EMAIL]'
  description: 'Call 010-1234-5678', // → description: 'Call [PHONE]'
  payment: '1234-5678-9012-3456', // → payment: '[CARD]'
});
```

**감지 패턴:** 이메일 주소 → `[EMAIL]`, 신용카드 → `[CARD]`, 전화번호 → `[PHONE]`, JWT 토큰 → `[JWT]`, API 키 → `[APIKEY]`, 비밀번호 → `[PASSWORD]`

#### 우선순위 예시

```typescript
// 키 기반 마스킹이 우선 적용됩니다
const data = {
  email: 'user@example.com', // 키 매칭 → '[REDACTED]' ('[EMAIL]' 아님)
  userInfo: 'user@example.com', // 키 미매칭 → '[EMAIL]'
};
```

#### 상세 마스킹 동작

1. **키 기반 마스킹 (최우선 체크)**: 속성 키가 민감한 키워드와 일치하면, 값의 내용과 관계없이 전체 값이 `[REDACTED]`로 대체됩니다.

2. **패턴 기반 마스킹 (대체 방법)**: 키가 민감하지 않은 경우, 값에서 패턴을 검색합니다:
   - 이메일 주소: `user@example.com` → `[EMAIL]`
   - 신용카드: `1234-5678-9012-3456` → `[CARD]`
   - 전화번호: `010-1234-5678` → `[PHONE]`
   - JWT 토큰: `Bearer eyJ...` → `Bearer [JWT]`
   - API 키: 32자 이상 문자열 → `[APIKEY]`
   - 비밀번호: `password: "..."` 포함 문자열 → `[PASSWORD]`

3. **내장 객체**: Map, Set, Date, TypedArray, Buffer는 특별히 처리됩니다 ([내장 객체 처리](#-내장-객체-처리) 섹션 참조).

4. **중첩 객체**: 순환 참조를 방지하기 위해 최대 10 레벨까지 재귀적으로 sanitize됩니다.

5. **키 변경 시 캐시 무효화**: 민감 키를 추가·제거·초기화하면 정화 캐시를 비워 새 설정이 즉시 반영됩니다.

### 민감 키 Cookbook

```typescript
import {
  addSensitiveKey,
  removeSensitiveKey,
  resetSensitiveKeys,
  getSensitiveKeys,
} from '@cp949/web-logger';

// 커스텀 키 추가 (즉시 적용)
addSensitiveKey('customSecret');
addSensitiveKey('apiSecret');

// 기본 키를 노출해야 할 때만 제거
removeSensitiveKey('email');

// 현재 키 확인
console.log(getSensitiveKeys());

// 기본값으로 되돌리기
resetSensitiveKeys();
```

### 옵션으로 기본값 교체하기

```typescript
import { WebLogger, setSensitivePatterns, addSensitivePatterns } from '@cp949/web-logger';

// 생성 시 기본 키를 교체
const logger = new WebLogger({
  prefix: '[Secure]',
  sensitiveKeys: ['customSecret', 'apiSecret'], // 기본 목록을 대체
  suppressPatternWarnings: true, // 기본 패턴 제거 시 경고를 숨김
});

// 기본 패턴을 전역으로 교체
setSensitivePatterns({
  ticket: /TICKET-\d+/g,
  hash: /\b[a-f0-9]{40}\b/gi,
});

// 기본 패턴을 유지한 채 추가
addSensitivePatterns({
  ticket: /TICKET-\d+/g,
});

// 빌드 타임 vs 런타임
// - 기본값은 빌드 타임 define(__INITIAL_LOG_LEVEL__ 등)으로 주입
// - 라이브 토글/실험은 런타임 API(setLogLevel, addSensitivePatterns 등)를 사용

// 기본 패턴 제거 시 경고 제어
setSensitivePatternWarnings(true); // 경고 숨김
setSensitivePatternWarnings(false); // 경고 표시 (기본)
setSensitivePatternWarnings(true); // 일시적으로 경고 숨기기
setSensitivePatterns({ ticket: /TICKET-\d+/g });
setSensitivePatternWarnings(false); // 다시 켜기

// 타입이 있는 메타데이터 예제
type UserMeta = { userId: string; email?: string };
const typedLogger = new WebLogger<UserMeta>('[Typed]');
// 정상
typedLogger.info('사용자', { userId: 'u1' });
// @ts-expect-error - email은 문자열이어야 함
typedLogger.info('사용자', { userId: 'u2', email: 123 });
```

> `setSensitivePatterns`는 기본 패턴을 모두 대체하며, 기본 패턴을 제거하면 경고를 출력합니다. 기본을 유지하고 확장하려면 `addSensitivePatterns`를 사용하세요.

### 번들러 팁 (Vite / webpack / Rspack)

- 트리 쉐이킹을 위해 빌드 타임 상수를 정의하세요: `__DEV__`, `__NODE_ENV__`, `__INITIAL_LOG_LEVEL__`, 그리고 `process.env.NODE_ENV` / `WEB_LOGGER_LOG_LEVEL` 대체.
- ESM 트리 쉐이킹이 켜져 있는지 확인(`sideEffects: false` 또는 파일별 설정)해 사용하지 않는 코드가 제거되도록 합니다.
- 브라우저 전용이므로 isomorphic 코드에서는 `typeof window !== 'undefined'`로 가드하세요.
- 번들러에서 `process.env`를 별도 처리한다면 define 설정이 중복/충돌하지 않도록 맞춰주세요.

**Vite define 예시**

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

**webpack/Rspack define 예시**

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

### 5. Console API 호환성

```typescript
import { WebLogger, convertToConsoleLogger } from '@cp949/web-logger';

const webLogger = new WebLogger('[App]');
const consoleCompatible = convertToConsoleLogger(webLogger);

// console을 완전히 대체 가능 (console API와 동일한 시그니처)
consoleCompatible.debug('message', obj1, obj2);
consoleCompatible.info('info', data);
consoleCompatible.warn('warning');
consoleCompatible.error('error', error);
consoleCompatible.log('log message');

// 기존 console 사용 코드를 쉽게 마이그레이션
// const console = convertToConsoleLogger(webLogger);
```

### 6. 고급 기능

```typescript
import { WebLogger } from '@cp949/web-logger';

const logger = new WebLogger('[MyApp]');

// 그룹화된 로깅
logger.group('사용자 정보', userData);
logger.debug('상세 정보...');
logger.groupEnd();

// 성능 측정
logger.time('API 호출');
// ... 비동기 작업 ...
logger.timeEnd('API 호출'); // API 호출: 123ms

// 로그 레벨 동적 제어 (즉시 반영, 새로고침 불필요)
logger.setLogLevel('warn'); // warn, error만 출력
logger.setLogLevel('debug'); // 모든 로그 출력

// 로그 레벨 확인
console.log(logger.currentLogLevel); // 'debug'
console.log(logger.isEnabled); // true

// 여러 파라미터 지원 (console API와 동일)
logger.debug('User data:', userData, requestInfo);
logger.error('Failed to fetch:', error, { endpoint, status });
```

### 7. 컴포넌트별 Prefix (React)

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

## 🌍 SSR 지원

이 라이브러리는 Next.js, Nuxt 등의 서버 사이드 렌더링(SSR) 환경을 완벽하게 지원합니다.

### 작동 원리

환경을 자동으로 감지하여 적절한 전역 객체를 사용합니다:

- **브라우저(CSR)**: `window.__WEB_LOGGER_LOG_LEVEL__` 사용
- **서버(SSR)**: `globalThis.__WEB_LOGGER_LOG_LEVEL__` 사용

### SSR 주요 기능

1. **런타임 에러 없음**: Node.js 환경에서 에러 없이 작동
2. **로그 레벨 공유**: globalThis를 통해 모든 인스턴스가 로그 레벨 공유
3. **동일한 보안 정책**: 서버와 클라이언트에서 민감 데이터 마스킹 동일 작동
4. **설정 불필요**: SSR 프레임워크를 위한 별도 설정 불필요

### SSR 프레임워크에서 사용

```typescript
// 별도 설정 없이 서버와 클라이언트 모두에서 작동
import { logDebug, logInfo, logWarn, logError } from '@cp949/web-logger';

// Next.js 페이지나 API 라우트
export default function Page() {
  logDebug('서버 사이드 디버그 메시지'); // 서버에서 작동
  logInfo('페이지 렌더링됨'); // 서버와 클라이언트 모두에서 작동

  return <div>Hello World</div>;
}

// API 라우트
export async function GET() {
  logDebug('API 라우트 호출됨'); // Node.js에서 작동
  return Response.json({ message: 'Hello' });
}
```

### 동적 임포트 (선택사항)

로거 로딩 시점을 완전히 제어하려면:

```typescript
// 클라이언트 전용 로깅
if (typeof window !== 'undefined') {
  const { logDebug } = await import('@cp949/web-logger');
  logDebug('클라이언트 전용 메시지');
}
```

## 🔧 설정

### 로그 레벨 설정 우선순위

로그 레벨은 다음 우선순위로 결정됩니다:

1. 빌드 타임 환경 변수 (최우선, 빌드 시 주입)

```bash
WEB_LOGGER_LOG_LEVEL=debug npm run build
```

빌드 타임에 상수로 주입되어 Tree Shaking 최적화에 활용됩니다.

2. 런타임 환경 변수 (fallback)

```bash
WEB_LOGGER_LOG_LEVEL=debug npm run dev
```

빌드 타임 상수가 없는 경우 사용됩니다.

3. 전역 변수 (런타임, 즉시 반영)

```javascript
window.__WEB_LOGGER_LOG_LEVEL__ = 'debug';
```

모든 WebLogger 인스턴스에 즉시 반영됩니다.

4. 기본값

- 개발 환경: `debug` (모든 로그 출력)
- 프로덕션 환경: `warn` (warn, error만 출력)

> 참고: `setLogLevel()` 메서드를 사용하면 모든 WebLogger 인스턴스에 즉시 반영되며, 전역 변수에도 저장됩니다.

### 로그 레벨 설명

| 레벨    | 설명                  | 프로덕션 기본값 |
| ------- | --------------------- | --------------- |
| `debug` | 모든 로그 출력        | ❌              |
| `info`  | 정보, 경고, 에러 출력 | ❌              |
| `warn`  | 경고, 에러만 출력     | ✅              |
| `error` | 에러만 출력           | ✅              |
| `none`  | 모든 로그 비활성화    | ❌              |

## 🛡️ 보안 기능

### 자동 필터링되는 정보

| 데이터 유형 | 마스킹 결과  | 예시                                      |
| ----------- | ------------ | ----------------------------------------- |
| 이메일      | `[EMAIL]`    | user@example.com → [EMAIL]                |
| 카드번호    | `[CARD]`     | 1234-5678-9012-3456 → [CARD]              |
| 전화번호    | `[PHONE]`    | 010-1234-5678 → [PHONE]                   |
| JWT 토큰    | `[JWT]`      | Bearer eyJ... → Bearer [JWT]              |
| 패스워드    | `[PASSWORD]` | password: "secret" → password: [PASSWORD] |
| API 키      | `[APIKEY]`   | 32자 이상 문자열 → [APIKEY]               |

### 민감한 객체 속성

다음 키를 가진 객체 속성은 자동으로 `[REDACTED]`로 대체됩니다:

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

### 민감한 키 관리

민감한 키 목록을 동적으로 추가하거나 제거할 수 있습니다:

```typescript
import {
  addSensitiveKey,
  removeSensitiveKey,
  getSensitiveKeys,
  resetSensitiveKeys,
} from '@cp949/web-logger';

// 키 추가
addSensitiveKey('customSecret');
addSensitiveKey('apiSecret');

// 키 제거
removeSensitiveKey('email'); // email 필터링 비활성화

// 현재 키 목록 확인
console.log(getSensitiveKeys());
// ['apiKey', 'api_key', 'authorization', 'cardNumber', ...]

// 기본값으로 초기화
resetSensitiveKeys();
```

> 참고: 모든 WebLogger 인스턴스가 동일한 민감한 키 목록을 공유합니다. 키는 대소문자 구분 없이 저장됩니다.

## 📊 성능

### 벤치마크 결과

| 작업                 | 개선 전 | 개선 후 | 향상률 |
| -------------------- | ------- | ------- | ------ |
| 정규식 매칭          | 230ms   | 23ms    | 90% ⬆️ |
| 대량 로그 (10,000개) | 1,200ms | 450ms   | 62% ⬆️ |
| 메모리 사용량        | 15MB    | 10MB    | 33% ⬇️ |

### 최적화 기법

- 정규식 패턴 캐싱: 컴파일된 정규식 재사용
- 문자열 길이 제한: 5,000자로 제한하여 ReDoS 공격 방지
- 정규식 실행 시간 제한: 100ms 타임아웃으로 성능 보장
- 조건부 실행: 로그 레벨 체크를 먼저 수행하여 불필요한 sanitize 방지
- 빌드 타임 최적화: 환경 변수를 빌드 타임 상수로 주입하여 Tree Shaking 최적화

### 번들 크기

- ESM: ~12.8 KB (unminified, sourcemap 포함)
- CJS: ~13.1 KB (unminified, sourcemap 포함)
- 타입 정의: ~3.5 KB

### Tree Shaking

이 라이브러리는 Tree Shaking을 지원합니다. 빌드 타임에 환경 변수를 상수로 주입하여 데드 코드 제거를 최적화합니다.

빌드 타임 상수 주입:

```typescript
// tsdown.config.ts에서 자동으로 주입됨
__DEV__: boolean; // 개발 모드 여부
__NODE_ENV__: string; // NODE_ENV 값
__INITIAL_LOG_LEVEL__: string; // 초기 로그 레벨
```

> 참고: Tree Shaking은 번들러(Webpack, Vite, Rollup 등)가 빌드 타임 상수를 기반으로 데드 코드를 제거합니다. 런타임에서 로그 레벨을 동적으로 변경하는 방법은 "설정" 섹션을 참조하세요.

## 🗂️ 내장 객체 처리

Web Logger는 Map, Set, Date, TypedArray, Buffer와 같은 JavaScript 내장 객체를 적절히 처리하여 복잡한 구조 내에서도 민감한 데이터가 마스킹되도록 보장합니다.

### Map 객체

Map의 키와 값이 모두 sanitize됩니다. 키가 민감한 키워드와 일치하면 키 자체가 `[REDACTED]`로 대체됩니다:

```typescript
import { logInfo } from '@cp949/web-logger';

const userMap = new Map([
  ['email', 'user@example.com'], // 키 'email' → '[REDACTED]'
  ['password', 'secret123'], // 키 'password' → '[REDACTED]'
  ['username', 'john'], // 일반 키는 보존
  ['contact', 'user@example.com'], // 값 마스킹: '[EMAIL]'
]);

logInfo('사용자 데이터:', userMap);
// 출력: 키가 '[REDACTED]'로 대체되고 값이 sanitize된 Map
```

**중요 사항:**

- Map 키는 민감한 키워드와 비교됩니다 (대소문자 구분 없음)
- 민감한 키는 키 충돌을 방지하기 위해 `[REDACTED]`로 대체됩니다
- Map 값은 일반 객체 속성과 동일한 규칙으로 sanitize됩니다

### Set 객체

Set 요소는 개별적으로 sanitize됩니다. **참고**: 여러 다른 값이 동일한 패턴으로 마스킹되면 (예: 여러 이메일 → `[EMAIL]`), Set의 고유성 특성에 따라 중복 제거됩니다:

```typescript
import { logInfo } from '@cp949/web-logger';

const emailSet = new Set(['user1@example.com', 'user2@example.com', 'admin@example.com']);

logInfo('이메일 목록:', emailSet);
// 출력: Set(['[EMAIL]']) - 모든 이메일이 [EMAIL]로 마스킹되어 하나의 요소로 중복 제거됨
```

**중요 사항:**

- Set 요소는 패턴 기반 마스킹을 사용하여 sanitize됩니다
- 마스킹 후 여러 요소가 동일해지면 (예: 모두 `[EMAIL]`), Set의 고유성으로 인해 크기가 줄어듭니다
- 이는 Set의 특성상 예상되는 동작입니다 - 원래 개수를 유지해야 한다면 Array 사용을 고려하세요

### Date 객체

Date 객체는 ISO 문자열로 변환된 후 민감한 패턴을 검사합니다:

```typescript
import { logInfo } from '@cp949/web-logger';

const eventDate = new Date('2024-12-01');
const customDate = {
  toISOString: () => 'meeting-with-user@example.com-2024',
};

logInfo('이벤트 날짜:', eventDate);
// 출력: "2024-12-01T00:00:00.000Z" (또는 유사한 ISO 형식)

logInfo('커스텀 날짜:', customDate);
// 출력: "meeting-with-[EMAIL]-2024" (ISO 문자열에서 이메일 패턴 감지)
```

### TypedArray와 Buffer

바이너리 데이터 타입은 민감한 바이너리 내용의 의도치 않은 로깅을 방지하기 위해 마스킹됩니다:

```typescript
import { logInfo } from '@cp949/web-logger';

// TypedArray (Uint8Array, Int32Array 등)
const buffer = new Uint8Array([1, 2, 3, 4, 5]);
logInfo('바이너리 데이터:', buffer);
// 출력: "[BINARY_DATA]"

// Node.js Buffer
if (typeof Buffer !== 'undefined') {
  const nodeBuffer = Buffer.from('sensitive data');
  logInfo('Node 버퍼:', nodeBuffer);
  // 출력: "[BUFFER]"
}
```

**중요 사항:**

- TypedArray (Uint8Array, Int32Array, Float64Array 등) → `[BINARY_DATA]`
- Node.js Buffer → `[BUFFER]` (올바른 감지를 위해 TypedArray보다 먼저 체크)
- DataView 객체는 그대로 보존됩니다 (마스킹하지 않음)

### 중첩된 내장 객체

내장 객체는 일반 객체와 배열 내에 중첩될 수 있습니다:

```typescript
import { logInfo } from '@cp949/web-logger';

const complexData = {
  users: new Map([
    ['admin', { email: 'admin@example.com', role: 'admin' }],
    ['user1', { email: 'user1@example.com', role: 'user' }],
  ]),
  emails: new Set(['user@example.com', 'admin@example.com']),
  lastUpdated: new Date(),
  metadata: {
    binaryData: new Uint8Array([1, 2, 3]),
  },
};

logInfo('복잡한 데이터:', complexData);
// 모든 레벨에서 적절한 마스킹이 적용됨
```

## 🧪 테스트

```bash
# 테스트 실행
npm test

# 커버리지 확인
npm test -- --coverage
```

### 테스트 커버리지

- Statements: 85.26%
- Branches: 82.3%
- Functions: 90.36%
- Lines: 86.18%
- 테스트 케이스: 147개 (마스킹 우선순위, 내장 객체, console API, 환경 감지 포함)

## 📝 API 레퍼런스

### WebLogger 클래스

```typescript
class WebLogger {
  constructor(prefix?: string);

  // 로깅 메서드
  debug(message?: unknown, ...params: unknown[]): void;
  info(message?: unknown, ...params: unknown[]): void;
  warn(message?: unknown, ...params: unknown[]): void;
  error(message?: unknown, ...params: unknown[]): void;
  log(...args: unknown[]): void;

  // 그룹 메서드
  group(title: string, data?: LogMetadata): void;
  groupEnd(): void;

  // 성능 측정
  time(label: string): void;
  timeEnd(label: string): void;

  // 설정
  setLogLevel(level: LogLevel): void;
  get currentLogLevel(): LogLevel;
  get isEnabled(): boolean;
}
```

### 유틸리티 함수

```typescript
// 로그 레벨 제어
function setLogLevel(level: LogLevel): void;
function getLogLevel(): LogLevel;
function isDebugEnabled(): boolean;

// 간편 로깅 함수
function logDebug(message?: unknown, ...params: unknown[]): void;
function logInfo(message?: unknown, ...params: unknown[]): void;
function logWarn(message?: unknown, ...params: unknown[]): void;
function logError(message?: unknown, ...params: unknown[]): void;

// Console API 호환성
function convertToConsoleLogger(logger: WebLogger): Partial<Console>;

// 민감한 키 관리
function addSensitiveKey(key: string): void;
function removeSensitiveKey(key: string): void;
function getSensitiveKeys(): string[];
function resetSensitiveKeys(): void;
```

### 타입 정의

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

## 🌐 브라우저 지원

| 브라우저 | 버전 | 지원 |
| -------- | ---- | ---- |
| Chrome   | 90+  | ✅   |
| Firefox  | 88+  | ✅   |
| Safari   | 14+  | ✅   |
| Edge     | 90+  | ✅   |

## 📄 라이선스

MIT License - 자유롭게 사용하고 수정할 수 있습니다.

## 🤝 기여하기

버그 리포트와 기능 제안은 환영합니다!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🏷️ 버전 히스토리

### v1.0.1 (2024-12-01)

- Next.js 및 기타 프레임워크를 위한 완전한 SSR/CSR 호환성 추가
- 서버 환경에서는 globalThis, 브라우저에서는 window 사용
- Node.js 환경에서 런타임 에러 없음
- globalThis를 통한 모든 인스턴스 간 로그 레벨 공유
- 전역 변수를 위한 향상된 타입 선언
- SSR 전용 테스트 케이스 추가

### v1.0.0 (2024-12-01)

- 초기 릴리즈
- 완전한 TypeScript 지원 (any 타입 0개)
- 민감한 정보 자동 필터링
- 정규식 캐싱 및 타임아웃으로 성능 최적화
- 프로토타입 오염 방지
- ReDoS 공격 방지 (문자열 길이 제한 5,000자, 정규식 타임아웃 100ms)
- ESM/CJS 듀얼 패키지 지원
- 빌드 타임 상수 주입으로 Tree Shaking 최적화
- 로그 레벨 즉시 반영 (새로고침 불필요)
- 34개 테스트 케이스 통과
