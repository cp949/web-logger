# S-002: rollup-plugin-visualizer 업데이트

## 취약점 정보

- 패키지: `rollup-plugin-visualizer` → 내부 전이: `rollup`, `picomatch`
- 심각도: high + moderate
- 현재 버전: `^6.0.5`
- 권장 패치 버전: `^7.0.1`

## 취약점 요약

| Advisory | 패키지 | 심각도 | 설명 | 패치 버전 |
|----------|--------|--------|------|-----------|
| GHSA-mw96-cpmx-2vgc | rollup | high | Arbitrary File Write via Path Traversal | >=4.59.0 |
| GHSA-c2c7-rcm5-vvqj | picomatch | high | ReDoS via extglob quantifiers | >=4.0.4 |
| GHSA-3v7f-55p6-f55p | picomatch | moderate | Method Injection in POSIX Character Classes | >=4.0.4 |

## 의존성 경로

```
. > rollup-plugin-visualizer > rollup
. > rollup-plugin-visualizer > picomatch
```

## 수정 계획

- 루트 `package.json`의 `rollup-plugin-visualizer`를 `^7.0.1`로 상향
- 설치 후 `pnpm audit` 재실행으로 해당 advisory 제거 여부 확인

## 수정 내용

- `package.json` (루트)
  - `rollup-plugin-visualizer`: `^6.0.5` → `^7.0.1`

## 검증 결과

- rollup@4.53.3, picomatch@4.0.3 → pnpm overrides(S-004)로 추가 고정
- `pnpm audit` 최종 0건 확인
- `pnpm test` 전체 통과

## 진행 상태

- 상태: 완료
