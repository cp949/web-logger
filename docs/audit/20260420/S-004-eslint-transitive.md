# S-004: 전이 의존성 pnpm overrides 처리

## 취약점 정보

직접 의존성 업데이트 후에도 eslint / vitest / rollup-plugin-visualizer의 전이 의존성이 잔류한다.
`pnpm.overrides`로 최솟값을 강제 고정하여 해결한다.

## 잔여 취약점 요약

| 패키지 | 심각도 | 설치된 취약 버전 | 필요 버전 | 의존 경로 |
|--------|--------|----------------|-----------|-----------|
| `vite` | high + moderate | 7.2.7 | >=7.3.2 | packages__web-logger>vitest>vite |
| `rollup` | high | 4.53.3 | >=4.59.0 | .>rollup-plugin-visualizer>rollup |
| `minimatch` (v3) | high | 3.1.2 | >=3.1.4 | apps__logger-demo>eslint>minimatch |
| `minimatch` (v9) | high | 9.0.5 | >=9.0.7 | apps__logger-demo>eslint-config-next>typescript-eslint>...>minimatch |
| `flatted` | high | 3.3.3 | >=3.4.2 | apps__logger-demo>eslint>file-entry-cache>flat-cache>flatted |
| `ajv` | moderate | 6.12.6 | >=6.14.0 | apps__logger-demo>eslint>ajv |
| `brace-expansion` (v1) | moderate | 1.1.12 | >=1.1.13 | apps__logger-demo>eslint>minimatch>brace-expansion |
| `brace-expansion` (v2) | moderate | 2.0.2 | >=2.0.3 | apps__logger-demo>eslint-config-next>typescript-eslint>...>brace-expansion |
| `picomatch` (v2) | high + moderate | 2.3.1 | >=2.3.2 | apps__logger-demo>eslint-config-next>...>picomatch |
| `picomatch` (v4) | high + moderate | 4.0.3 | >=4.0.4 | .>rollup-plugin-visualizer>picomatch |

## 해결 경로 요약

| 패키지 | 해결 방법 | 비고 |
|--------|-----------|------|
| `minimatch` (v3, v9) | ESLint 제거 (biome 전환) | eslint, eslint-config-next 의존성 제거 |
| `flatted` | ESLint 제거 (biome 전환) | eslint 의존성 제거 |
| `ajv` | ESLint 제거 (biome 전환) | eslint 의존성 제거 |
| `brace-expansion` (v1, v2) | ESLint 제거 (biome 전환) | eslint, eslint-config-next 의존성 제거 |
| `picomatch` (v2) | ESLint 제거 (biome 전환) | eslint-config-next 의존성 제거 |
| `vite` | pnpm overrides | vitest peer dep 자동 업그레이드 불가 |
| `rollup` | pnpm overrides | rollup-plugin-visualizer peer dep |
| `picomatch` (v4) | pnpm overrides | rollup-plugin-visualizer 전이 |

## biome 전환으로 해소된 항목

ESLint / Prettier를 `@biomejs/biome`으로 대체하면서 다음 패키지들이 완전히 제거되었다.

**제거된 패키지:**
- `eslint`, `eslint-config-next` (apps/logger-demo)
- `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-plugin-react`, `eslint-plugin-react-hooks` (packages/web-logger-react)
- `eslint` (packages/web-logger)
- `prettier` (루트, packages/web-logger, packages/web-logger-react)

**제거된 설정 파일:**
- `.prettierrc` (루트)
- `apps/logger-demo/.eslintrc.json`
- `packages/web-logger/.eslintrc.json`, `.prettierrc`
- `packages/web-logger-react/.eslintrc.json`, `.prettierrc`

이로 인해 최초 계획했던 10개 override 중 ESLint 체인 관련 7개가 불필요해졌다.

## 최종 pnpm.overrides (biome 전환 이후)

ESLint 제거 후 남은 전이 의존성 3개만 override로 유지한다.

```json
"pnpm": {
  "overrides": {
    "vite": "^7.3.2",
    "rollup": "^4.59.0",
    "picomatch@>=4 <4.0.4": "4.0.4"
  }
}
```

## 검증 결과

- ESLint 체인 전이 취약점 7건: biome 전환으로 의존성 제거하여 해소
- 나머지 3건(`vite`, `rollup`, `picomatch@4.x`): pnpm overrides로 해소
- `pnpm audit` 최종 0건 확인
- `pnpm test` 전체 통과 (16 tests)

## 진행 상태

- 상태: 완료
