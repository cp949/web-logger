import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
);
const verifyRelease = await import('../../scripts/verify-release.mjs');
const publishNpm = await import('../../scripts/publish-npm.mjs');

test('루트 package.json은 릴리스 검증과 배포 명령을 제공한다', () => {
  assert.equal(packageJson.scripts['test:scripts'], 'node --test tests/scripts/*.test.mjs');
  assert.equal(
    packageJson.scripts['verify:ci'],
    'pnpm audit && pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build && pnpm size:ci',
  );
  assert.equal(packageJson.scripts['verify:release'], 'node ./scripts/verify-release.mjs');
  assert.equal(
    packageJson.scripts['publish:npm'],
    'pnpm verify:release && node ./scripts/publish-npm.mjs',
  );
});

test('릴리스 검증과 npm 배포 스크립트가 존재한다', () => {
  assert.equal(existsSync(new URL('../../scripts/verify-release.mjs', import.meta.url)), true);
  assert.equal(existsSync(new URL('../../scripts/publish-npm.mjs', import.meta.url)), true);
});

test('릴리스 스크립트는 테스트 가능한 실행 함수를 제공한다', () => {
  assert.equal(typeof verifyRelease.createNpmEnvironment, 'function');
  assert.equal(typeof verifyRelease.getReleaseVerificationSteps, 'function');
  assert.equal(typeof verifyRelease.runReleaseVerification, 'function');
  assert.equal(typeof publishNpm.getPublishSteps, 'function');
  assert.equal(typeof publishNpm.runPublish, 'function');
});
