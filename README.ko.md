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

const logger = new WebLogger('[MyApp]');
logger.debug('디버깅');
logger.info('정보');
logger.warn('경고');
logger.error('에러');
```

### 3. 로그 레벨 제어

```typescript
import { setLogLevel, getLogLevel } from '@cp949/web-logger';

// 로그 레벨 변경 (즉시 반영)
setLogLevel('warn'); // warn, error만 출력
setLogLevel('debug'); // 모든 로그 출력

// 현재 레벨 확인
console.log(getLogLevel()); // 'debug'
```

### 4. 민감한 정보 자동 필터링

```typescript
// 자동으로 민감한 정보가 마스킹됩니다
logDebug('User email: user@example.com');
// 출력: User email: [EMAIL]

logDebug('Card: 1234-5678-9012-3456');
// 출력: Card: [CARD]

logDebug('User data:', { password: 'secret123', email: 'user@example.com' });
// 출력: User data: { password: '[REDACTED]', email: '[REDACTED]' }
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

| 레벨 | 설명 | 프로덕션 기본값 |
|------|------|----------------|
| `debug` | 모든 로그 출력 | ❌ |
| `info` | 정보, 경고, 에러 출력 | ❌ |
| `warn` | 경고, 에러만 출력 | ✅ |
| `error` | 에러만 출력 | ✅ |
| `none` | 모든 로그 비활성화 | ❌ |

## 🛡️ 보안 기능

### 자동 필터링되는 정보

| 데이터 유형 | 마스킹 결과 | 예시 |
|------------|------------|------|
| 이메일 | `[EMAIL]` | user@example.com → [EMAIL] |
| 카드번호 | `[CARD]` | 1234-5678-9012-3456 → [CARD] |
| 전화번호 | `[PHONE]` | 010-1234-5678 → [PHONE] |
| JWT 토큰 | `[JWT]` | Bearer eyJ... → Bearer [JWT] |
| 패스워드 | `[PASSWORD]` | password: "secret" → password: [PASSWORD] |
| API 키 | `[APIKEY]` | 32자 이상 문자열 → [APIKEY] |

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
import { addSensitiveKey, removeSensitiveKey, getSensitiveKeys, resetSensitiveKeys } from '@cp949/web-logger';

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

| 작업 | 개선 전 | 개선 후 | 향상률 |
|-----|--------|--------|--------|
| 정규식 매칭 | 230ms | 23ms | 90% ⬆️ |
| 대량 로그 (10,000개) | 1,200ms | 450ms | 62% ⬆️ |
| 메모리 사용량 | 15MB | 10MB | 33% ⬇️ |

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
// tsup.config.ts에서 자동으로 주입됨
__DEV__: boolean        // 개발 모드 여부
__NODE_ENV__: string   // NODE_ENV 값
__INITIAL_LOG_LEVEL__: string  // 초기 로그 레벨
```

> 참고: Tree Shaking은 번들러(Webpack, Vite, Rollup 등)가 빌드 타임 상수를 기반으로 데드 코드를 제거합니다. 런타임에서 로그 레벨을 동적으로 변경하는 방법은 "설정" 섹션을 참조하세요.

## 🧪 테스트

```bash
# 테스트 실행
npm test

# 커버리지 확인
npm test -- --coverage
```

### 테스트 커버리지
- Statements: 72.63%
- Branches: 62.42%
- Functions: 82.35%
- Lines: 74.07%
- 테스트 케이스: 34개

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
|---------|------|------|
| Chrome | 90+ | ✅ |
| Firefox | 88+ | ✅ |
| Safari | 14+ | ✅ |
| Edge | 90+ | ✅ |

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

