# S-001: next / eslint-config-next 업데이트

## 취약점 정보

- 패키지: `next`, `eslint-config-next`
- 심각도: high + moderate + low
- 현재 버전: `16.0.8`
- 권장 패치 버전: `>=16.2.3` (가장 많은 high 항목 포함)

## 취약점 요약

| Advisory | 심각도 | 설명 | 패치 버전 |
|----------|--------|------|-----------|
| GHSA-mwv6-3258-q52c | high | Server Components DoS | >=16.0.9 |
| GHSA-h25m-26qc-wcjf | high | HTTP request deserialization DoS | >=16.0.11 |
| GHSA-q4gf-8mx6-v5v3 | high | Server Components DoS | >=16.2.3 |
| GHSA-w37m-7fhw-fmv9 | moderate | Server Actions Source Code Exposure | >=16.0.9 |
| GHSA-9g9p-9gw9-jx7f | moderate | Self-hosted DoS | >=16.1.5 |
| GHSA-ggv3-7p47-pfv8 | moderate | HTTP request smuggling in rewrites | >=16.1.7 |
| GHSA-3x4c-7xq6-9pq8 | moderate | next/image disk cache growth | >=16.1.7 |
| GHSA-h27x-g6w4-24gq | moderate | Postponed resume buffering DoS | >=16.1.7 |
| GHSA-mq59-m269-xvcx | moderate | null origin Server Actions CSRF | >=16.1.7 |
| GHSA-5f7q-jpqc-wp7h | moderate | PPR Unbounded Memory | >=16.1.5 |
| GHSA-jcc7-9wpm-mj36 | low | null origin HMR websocket CSRF | >=16.1.7 |

또한 `eslint-config-next`를 통해 전이되는 하위 취약점:
- `minimatch` (ReDoS) via `eslint-config-next>typescript-eslint>...>minimatch`
- `picomatch` (ReDoS) via `eslint-config-next>@next/eslint-plugin-next>fast-glob>micromatch>picomatch`
- `brace-expansion` (DoS) via `eslint-config-next>typescript-eslint>...>brace-expansion`

## 의존성 경로

```
apps__logger-demo > next
apps__logger-demo > eslint-config-next > typescript-eslint > @typescript-eslint/typescript-estree > minimatch
apps__logger-demo > eslint-config-next > @next/eslint-plugin-next > fast-glob > micromatch > picomatch
apps__logger-demo > eslint-config-next > typescript-eslint > ... > brace-expansion
```

## 수정 계획

- `apps/logger-demo/package.json`의 `next`를 `16.2.4`로 상향
- `eslint-config-next`는 버전 업데이트 대신 biome 전환(→ S-004 참고)으로 제거

## 수정 내용

- `apps/logger-demo/package.json`
  - `next`: `16.0.8` → `16.2.4`
  - `eslint-config-next`: 제거 (biome 전환으로 불필요)
  - `eslint`: 제거 (biome 전환으로 불필요)
  - `lint` 스크립트: `next lint` → `biome lint .`

## biome 전환 효과

`eslint-config-next` 제거로 해당 패키지를 통해 전이되던 하위 취약점이 모두 해소되었다.
- `minimatch@9.x` 취약점 (typescript-eslint 경로) → 의존성 제거로 해소
- `picomatch@2.x` 취약점 (fast-glob 경로) → 의존성 제거로 해소
- `brace-expansion@2.x` 취약점 → 의존성 제거로 해소

## 검증 결과

- `pnpm audit` 재실행 후 next 및 eslint-config-next 관련 advisory 제거 확인
- `pnpm test` 전체 통과 (16 tests)
- 최종 취약점 0건 확인

## 진행 상태

- 상태: 완료
