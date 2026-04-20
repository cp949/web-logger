# S-003: vitest 업데이트 (vite 전이 취약점)

## 취약점 정보

- 패키지: `vitest` → 내부 전이: `vite`
- 심각도: high + moderate
- 현재 버전: `^4.0.15`
- 권장 패치 버전: `^4.1.4` (내부 vite >=7.3.2 포함)

## 취약점 요약

| Advisory | 패키지 | 심각도 | 설명 | 패치 버전 |
|----------|--------|--------|------|-----------|
| GHSA-v2wj-q39q-566r | vite | high | `server.fs.deny` bypassed with queries | >=7.3.2 |
| GHSA-p9ff-h696-f583 | vite | high | Arbitrary File Read via Vite Dev Server | >=7.3.2 |
| GHSA-4w7w-66w2-5vf9 | vite | moderate | Path Traversal in Optimized Deps | >=7.3.2 |

## 의존성 경로

```
packages__web-logger > vitest > vite
```

## 수정 계획

- `packages/web-logger/package.json`의 `vitest`와 `@vitest/coverage-v8`를 `^4.1.4`로 상향
- 설치 후 `pnpm audit` 재실행으로 해당 advisory 제거 여부 확인

## 수정 내용

- `packages/web-logger/package.json`
  - `vitest`: `^4.0.15` → `^4.1.4`
  - `@vitest/coverage-v8`: `^4.0.15` → `^4.1.4`

## 검증 결과

- vitest@4.1.4의 peer dep(`vite: ^7.0.0`)으로 자동 업그레이드 안 됨 → pnpm overrides(S-004)로 추가 고정
- `pnpm audit` 최종 0건 확인
- `pnpm test` 전체 통과

## 진행 상태

- 상태: 완료
