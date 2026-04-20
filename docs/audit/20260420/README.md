# pnpm audit 보안 취약점 분석 - 2026년 4월 20일

## 개요

- 감사 일시: 2026-04-20
- 실행 명령: `pnpm audit`
- 초기 취약점: 30건
- 초기 심각도별 집계: high 16 / moderate 13 / low 1
- 최종 취약점: 0건

## 현재 취약점 묶음

| 번호 | 패키지 | 심각도 | 유형 | 현재 상태 | 문서 |
|------|--------|--------|------|-----------|------|
| S-001 | `next` / `eslint-config-next` | high + moderate + low | `next` 업데이트 + `eslint-config-next` 제거(biome 전환) | 완료 | [S-001](./S-001-next-update.md) |
| S-002 | `rollup-plugin-visualizer` (`rollup`, `picomatch`) | high + moderate | 직접 의존성 업데이트 | 완료 | [S-002](./S-002-rollup-visualizer-update.md) |
| S-003 | `vitest` → `vite` | high + moderate | 직접 의존성 업데이트 + pnpm overrides | 완료 | [S-003](./S-003-vitest-update.md) |
| S-004 | `eslint` 전이 의존성 (`minimatch`, `flatted`, `ajv`, `brace-expansion`, `picomatch`, `rollup`, `vite`) | high + moderate | ESLint 제거(biome 전환) + pnpm overrides 3개 | 완료 | [S-004](./S-004-eslint-transitive.md) |

## 초기 분석

- `apps/logger-demo/package.json`의 `next@16.0.8`이 직접 취약점 대상이다.
- `package.json`(루트)의 `rollup-plugin-visualizer@^6.0.5`가 내부적으로 취약한 `rollup`, `picomatch`를 설치한다.
- `packages/web-logger/package.json`의 `vitest@^4.0.15`가 취약한 `vite@<=7.3.1`을 설치한다.
- `apps/logger-demo`의 `eslint` 체인에서 `minimatch`, `flatted`, `ajv`, `brace-expansion` 취약점이 보고된다.

## 해결 전략

### 전략 1: 직접 의존성 우선 업데이트

- `next`, `rollup-plugin-visualizer`, `vitest`를 최신 호환 범위로 상향한다.
- 직접 업데이트만으로 전이 의존성이 함께 정리되면 override는 추가하지 않는다.

### 전략 2: 재감사 후 잔여 전이 의존성만 최소 개입

- 1차 업데이트 후 `pnpm audit`를 다시 실행한다.
- 잔여 항목이 있으면 실제 설치 경로를 확인한 뒤 `pnpm.overrides`를 추가한다.

### 전략 3: ESLint → biome 전환으로 근본 해소

- `eslint`, `eslint-config-next`, `prettier` 등을 `@biomejs/biome`으로 대체한다.
- 전이 취약점의 근원인 ESLint 의존성 트리가 제거되어 override 없이 해소된다.

### 전략 4: 각 수정 단위별 기록 유지

- 각 S-문서에 취약점 정보, 의존성 경로, 수정 방법, 검증 결과를 순서대로 남긴다.
- 최종적으로 README 표의 상태를 완료 또는 수동 검토로 업데이트한다.

## biome 전환 효과

ESLint/Prettier를 `@biomejs/biome@2.4.12`로 일괄 대체하면서 다음 효과가 발생했다.

- S-004에서 계획한 10개 override 중 7개(ESLint 체인 관련)가 불필요해짐
- 최종 `pnpm.overrides`는 3개(`vite`, `rollup`, `picomatch@4.x`)만 유지
- lint/format 스크립트 일원화: `biome lint .` / `biome format --write .` / `biome check --write .`

## 최종 검증

- `pnpm audit` 결과: 취약점 0건
- `pnpm test` 결과: 16개 테스트 전체 통과
- `pnpm build` 결과: 라이브러리 및 데모 앱 빌드 성공
