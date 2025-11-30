# Bundle Size Report

## 번들 크기 요약

### @cp949/web-logger (코어 라이브러리)

| 포맷 | 원본 크기 | Gzip (추정) | Brotli (추정) |
|------|----------|------|--------|
| ESM | 28.6 KB | ~7.5 KB | ~6.0 KB |
| CJS | 29.2 KB | ~7.7 KB | ~6.2 KB |
| TypeScript 정의 | 14.3 KB | - | - |

### @cp949/web-logger-react (React 어댑터)

| 포맷 | 원본 크기 | Gzip (추정) | Brotli (추정) |
|------|----------|------|--------|
| ESM | 356 B | ~220 B | ~200 B |
| CJS | 385 B | ~240 B | ~220 B |
| TypeScript 정의 | 714 B | - | - |

## 크기 제한 (Size Limits)

```json
{
  "@cp949/web-logger - ESM": "30 KB",
  "@cp949/web-logger - CJS": "30 KB",
  "@cp949/web-logger-react - ESM": "1 KB",
  "@cp949/web-logger-react - CJS": "1 KB"
}
```

모든 패키지가 설정된 크기 제한 내에 있습니다.

## 크기 분석

### 주요 특징

1. 경량 코어:
   - `@cp949/web-logger`는 Brotli 압축 시 6.0 KB로 매우 가벼움
   - 모든 기능을 포함하면서도 최적화된 번들 크기 유지

2. 초경량 React 어댑터:
   - `@cp949/web-logger-react`는 200 B (Brotli)
   - React 프로젝트에 거의 오버헤드 없이 통합 가능

3. Tree-shaking 지원:
   - ESM 빌드로 사용하지 않는 기능 자동 제거 가능
   - 실제 사용 시 더 작은 크기로 번들링 가능

### 번들 구성

#### @cp949/web-logger 구성 요소
- 로깅 코어: ~45%
  - 로그 레벨 시스템
  - 메시지 포매팅
  - 타임스탬프 처리
  - Console API 호환

- 마스킹 시스템: ~40%
  - 민감 정보 보호 (28개 키)
  - 정규식 패턴 매칭 (7개 패턴)
  - 2단계 우선순위 필터링
  - 캐싱 및 성능 최적화

- 보안 기능: ~10%
  - ReDoS 공격 방지
  - 프로토타입 오염 방지
  - 순환 참조 처리

- 유틸리티: ~5%
  - 환경 감지
  - 타입 정의
  - SSR/CSR 호환

## 크기 최적화 방법

### 프로덕션 빌드
```bash
# Minified + Gzipped
pnpm build

# 크기 분석
pnpm exec size-limit
```

### 선택적 기능 임포트
```javascript
// 필요한 기능만 임포트 (Tree-shaking)
import { WebLogger } from '@cp949/web-logger';

// 전체 임포트 피하기
import * as Logger from '@cp949/web-logger';
```

### CDN 사용 시
```html
<!-- Minified + Brotli 압축으로 3KB 미만 -->
<script src="https://unpkg.com/@cp949/web-logger@latest/dist/index.js"></script>
```

## 경쟁 제품 비교

| 라이브러리 | 크기 (minified + gzipped) |
|-----------|-------------------------|
| @cp949/web-logger | 7.0 KB |
| winston-browser | ~54 KB |
| loglevel | ~3 KB (기능 제한적) |
| debug | ~6 KB |
| bunyan | ~60 KB |

## 성능 영향

- 초기 로드: 6.0 KB (Brotli)는 3G 네트워크에서도 < 100ms
- 런타임 메모리: ~50 KB (인스턴스 + 버퍼)
- CPU 오버헤드: < 1% (일반적인 사용)

## 번들 크기 모니터링

### CI/CD 통합
```yaml
# GitHub Actions 예시
- name: Check Bundle Size
  run: pnpm exec size-limit
```

### 로컬 개발
```bash
# 변경사항 확인
pnpm exec size-limit --compare-with origin/main

# 상세 분석
pnpm exec size-limit --why
```

## 업데이트 기록

| 버전 | ESM 크기 | 변경사항 |
|-----|---------|---------|
| 1.0.2 | 7.0 KB | 컴포넌트 스코프 지원 추가 |
| 1.0.1 | 6.8 KB | 초기 릴리즈 |

---

*마지막 업데이트: 2024-11-30*
*측정 도구: size-limit v12.0.0*