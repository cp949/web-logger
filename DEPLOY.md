# 배포 가이드

이 저장소에서는 `@cp949/web-logger`와 `@cp949/web-logger-react`를 각각 npm에 배포합니다.
현재 배포 후보 버전은 두 패키지 모두 `1.0.6`입니다.

## 이번 릴리스

이번 릴리스의 1차 목적은 개발 의존성에서 보고된 `pnpm audit` 취약점을 해소하는 것입니다.
Vite 8, esbuild 0.28.2 및 관련 도구 업데이트가 포함되며, 라이브러리 공개 API 변경은 없습니다.

## 배포 전 확인

저장소 루트에서 다음 명령을 실행합니다.

```bash
pnpm install --frozen-lockfile
pnpm audit
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm size:ci
```

확인할 항목:

- `pnpm audit` 취약점 0건
- 두 패키지 버전이 `1.0.6`
- 테스트, 타입 검사, 린트, 포맷, 빌드, 번들 크기 검사 통과
- Git 작업 트리에 의도하지 않은 파일이 없는지 확인
- npm 계정이 `@cp949` 스코프에 두 패키지를 배포할 권한이 있는지 확인

npm 로그인 상태는 다음 명령으로 확인할 수 있습니다.

```bash
pnpm whoami
```

## 패키지 내용 확인

실제 배포 전에 tarball의 파일 목록과 package.json을 확인합니다.

```bash
pnpm --dir packages/web-logger pack --json
pnpm --dir packages/web-logger-react pack --json
```

각 tarball에는 다음 파일만 포함되어야 합니다.

- `package.json`
- `README.md`와 `README.ko.md`
- `dist/index.js`와 소스맵
- `dist/index.cjs`와 소스맵
- `dist/index.d.ts`
- `dist/index.d.cts`

생성된 `*.tgz`는 검사 후 커밋하지 않습니다.

## 배포 순서

코어 패키지를 먼저 배포하고 npm에서 `1.0.6`이 조회되는지 확인한 다음 React 패키지를 배포합니다.

```bash
cd packages/web-logger
pnpm publish --access public

cd ../web-logger-react
pnpm publish --access public
```

React 패키지의 peer dependency `@cp949/web-logger@^1.0.4`는 코어 `1.0.6`을 포함합니다.

## 배포 후 확인

```bash
pnpm view @cp949/web-logger version
pnpm view @cp949/web-logger-react version
```

두 명령이 모두 `1.0.6`을 반환하는지 확인합니다. 별도의 빈 디렉터리에서 설치 테스트까지 하면
패키지 메타데이터와 peer dependency 해석을 함께 확인할 수 있습니다.

```bash
pnpm add @cp949/web-logger@1.0.6 @cp949/web-logger-react@1.0.6 react@19
```

Git 태그와 원격 푸시는 npm 배포 결과를 확인한 후 진행합니다. 현재 저장소에는 두 패키지가 같은
버전을 사용하므로 태그는 `v1.0.6` 하나를 사용합니다.

```bash
git tag v1.0.6
git push origin main
git push origin v1.0.6
```

## 실패 시

- 같은 버전이 이미 존재하면 덮어쓸 수 없습니다. package.json과 CHANGELOG를 다음 패치 버전으로
  올린 후 다시 검증합니다.
- 코어 배포 후 React 배포만 실패했다면 코어를 다시 배포하지 않습니다. 원인을 수정하고 React
  패키지만 새 버전으로 배포합니다.
- npm에 게시된 버전은 일반적인 Git 롤백으로 제거되지 않습니다. 문제가 있는 버전은 npm에서
  deprecate하고 수정 버전을 새로 배포하는 방식을 우선합니다.

위험도: 높음
롤백: npm에 게시한 동일 버전은 덮어쓸 수 없으며, 보통 deprecate 후 새 패치 버전 배포가 필요함
