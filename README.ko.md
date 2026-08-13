# web-logger

브라우저용 로거와 React 훅을 함께 관리하는 TypeScript 모노레포입니다.

**언어:** [English](README.md) | [한국어](README.ko.md)

## 패키지

| 패키지 | 용도 |
| --- | --- |
| [`@cp949/web-logger`](packages/web-logger/README.ko.md) | 로그 레벨, Prefix, 구조화 데이터 출력, 민감 정보 마스킹 |
| [`@cp949/web-logger-react`](packages/web-logger-react/README.ko.md) | 컴포넌트별 로거를 만드는 메모이제이션된 React 훅 |

두 패키지를 브라우저에서 직접 확인할 수 있는 Vite 애플리케이션
[`logger-demo`](apps/logger-demo)도 포함되어 있습니다.

## 패키지 설치

일반 TypeScript 또는 JavaScript 프로젝트에서는 코어 패키지를 설치합니다.

```bash
pnpm add @cp949/web-logger
```

React 애플리케이션에서는 두 패키지가 모두 필요합니다.

```bash
pnpm add @cp949/web-logger @cp949/web-logger-react
```

## 빠른 시작

```typescript
import { logError, logInfo, setLogLevel } from '@cp949/web-logger';

setLogLevel('info');

logInfo('애플리케이션 시작');
logError('요청 실패', { status: 500 });
```

React 컴포넌트에서는 다음과 같이 사용합니다.

```tsx
import { useEffect } from 'react';
import { useWebLogger } from '@cp949/web-logger-react';

function Checkout() {
  const logger = useWebLogger('[Checkout]');

  useEffect(() => {
    logger.info('마운트 완료');
  }, [logger]);

  return null;
}
```

설정 방법과 전체 공개 API는 각 패키지 README에서 확인할 수 있습니다.

## 저장소 설정

필수 환경:

- Node.js `^20.19.0 || >=22.12.0`
- pnpm `10.25.0`

```bash
pnpm install
pnpm dev
```

`pnpm dev`는 두 라이브러리 패키지를 먼저 빌드한 뒤 패키지별 감시 작업과 데모
애플리케이션을 실행합니다.

## 개발 명령

| 명령 | 설명 |
| --- | --- |
| `pnpm build` | Turborepo를 통해 모든 워크스페이스 패키지 빌드 |
| `pnpm dev` | 라이브러리 빌드 후 개발용 상시 작업 실행 |
| `pnpm test` | 패키지별 테스트 실행 |
| `pnpm typecheck` | 모든 워크스페이스 패키지 타입 검사 |
| `pnpm lint` | 패키지별 린트 작업 실행 |
| `pnpm format:check` | Biome으로 저장소 포맷 검사 |
| `pnpm size` | 두 라이브러리를 빌드하고 번들 크기 출력 |
| `pnpm size:ci` | 설정된 size-limit 검사를 실행하고 JSON 출력 |

특정 패키지만 검사하려면 pnpm 필터를 사용합니다.

```bash
pnpm --filter @cp949/web-logger test
pnpm --filter @cp949/web-logger-react typecheck
```

## 저장소 구조

```text
apps/
  logger-demo/             브라우저 데모
packages/
  web-logger/              코어 로거
  web-logger-react/        React 훅
```

패키지별 빌드 결과는 각 패키지의 `dist/` 디렉터리에 생성됩니다.

## 보안

마스킹은 실수로 콘솔에 출력된 민감 정보를 줄이기 위한 보조 수단입니다. 자격증명이나 비밀값을
의도적으로 로거에 전달하지 말고, 기본 규칙으로 부족한 값은 애플리케이션 전용 키와 패턴으로
추가 설정하십시오.

## 라이선스

각 패키지는 MIT 라이선스로 배포됩니다.
