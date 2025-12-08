# 배포 가이드 (Deployment Guide)

## v1.0.0 첫 배포 절차

### 1. 사전 준비

#### 1.1 npmjs 로그인 확인

```bash
# npmjs에 로그인되어 있는지 확인
pnpm whoami

# 로그인되어 있지 않다면
pnpm login
# 또는
npm login
```

#### 1.2 @cp949 스코프 권한 확인

- npmjs에서 `@cp949` 스코프의 소유자인지 확인
- 스코프가 없다면 npmjs에서 생성하거나 기존 스코프에 추가되어야 함
- 스코프는 무료이며, `--access public` 플래그로 공개 패키지로 배포 가능

#### 1.3 Git 상태 확인

```bash
# 변경사항 확인
git status

# 변경사항이 있다면 커밋 및 푸시 (권장)
git add .
git commit -m "chore: prepare for v1.0.0 release"
git push
```

### 2. 배포 전 검증

#### 2.1 의존성 설치

```bash
pnpm install
```

#### 2.2 타입 체크

```bash
pnpm run typecheck
```

#### 2.3 린트 확인

```bash
pnpm run lint
# 또는 자동 수정
pnpm run lint:fix
```

#### 2.4 테스트 실행

```bash
pnpm run test
```

#### 2.5 빌드 확인

```bash
pnpm run build
```

빌드 후 `dist` 폴더에 다음 파일들이 생성되는지 확인:

- `dist/index.js` (ESM)
- `dist/index.cjs` (CJS)
- `dist/index.d.ts` (TypeScript 타입 정의)

### 3. 배포 실행

#### 방법 1: 스크립트 사용 (권장)

```bash
chmod +x scripts/publish.sh
./scripts/publish.sh
```

스크립트 실행 시:

1. 의존성 설치
2. 타입 체크
3. 빌드
4. 버전 확인 (이미 1.0.0이므로 "no" 선택)
5. 배포 확인 (y 선택)

#### 방법 2: 직접 배포

```bash
# 1. 빌드 및 타입 체크 (prepublishOnly 훅이 자동 실행됨)
pnpm run publish

# 또는 수동으로
pnpm run build
pnpm run typecheck
pnpm publish --access public
```

### 4. 배포 후 확인

#### 4.1 npmjs에서 패키지 확인

배포 후 몇 분 후에 다음 URL에서 확인:

```
https://www.npmjs.com/package/@cp949/web-logger
```

#### 4.2 설치 테스트

다른 프로젝트에서 설치 테스트:

```bash
npm install @cp949/web-logger
# 또는
pnpm add @cp949/web-logger
```

#### 4.3 Git 태그 생성 (권장)

```bash
# 버전 태그 생성
git tag v1.0.0

# 태그 푸시
git push origin v1.0.0
# 또는 모든 태그 푸시
git push --tags
```

### 5. 문제 해결

#### 5.1 "You cannot publish over the previously published versions" 오류

- 이미 해당 버전이 배포된 경우
- 해결: 버전을 올리거나 기존 버전을 unpublish (24시간 이내만 가능)

#### 5.2 "You do not have permission to publish" 오류

- 스코프 권한이 없는 경우
- 해결: npmjs에서 스코프 소유자 확인 또는 `--access public` 플래그 사용

#### 5.3 빌드 실패

- `dist` 폴더가 없거나 파일이 없는 경우
- 해결: `pnpm run build` 실행 후 재시도

### 6. 체크리스트

배포 전 최종 확인:

- [ ] npmjs 로그인 완료
- [ ] @cp949 스코프 권한 확인
- [ ] 타입 체크 통과
- [ ] 린트 통과
- [ ] 테스트 통과
- [ ] 빌드 성공 (dist 폴더 확인)
- [ ] package.json 버전이 1.0.0
- [ ] README.md 내용 확인
- [ ] Git 커밋 완료 (선택사항)

### 7. 빠른 배포 명령어

모든 검증을 완료했다면:

```bash
# 한 줄로 배포
pnpm run build && pnpm run typecheck && pnpm publish --access public
```
