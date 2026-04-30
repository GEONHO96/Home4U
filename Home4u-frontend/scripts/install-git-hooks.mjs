// @ts-check
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * git core.hooksPath 를 repo root 의 .husky 로 가리키도록 설정.
 *
 * Home4u-frontend/package.json 의 prepare 스크립트에서 자동 호출 — `npm install` 후 한 번만 실행되면
 * 모든 git 작업이 .husky/ 밑의 hook 을 사용한다.
 *
 * 의도:
 *  - .git 이 repo root 에 있고 .husky/ 도 root 에 있는 monorepo 구조에 맞춤
 *  - HUSKY=0 환경변수로 스킵 가능 (CI 또는 의도적 disable)
 *  - 이미 동일한 hooksPath 라면 no-op
 *  - .git 이 없는 디렉토리 (npm pack tarball 등) 에서는 silent skip
 */

if (process.env.HUSKY === '0') {
  console.log('install-git-hooks: HUSKY=0 — skip');
  process.exit(0);
}

// repo root = Home4u-frontend/.. (이 스크립트는 Home4u-frontend/scripts 에서 실행됨)
const repoRoot = resolve(process.cwd(), '..');
const gitDir = resolve(repoRoot, '.git');

if (!existsSync(gitDir)) {
  console.log(`install-git-hooks: ${gitDir} 가 없음 — skip (tarball / submodule / sparse 환경 추정)`);
  process.exit(0);
}

const desired = '.husky';
let current = '';
try {
  current = execSync('git config --local --get core.hooksPath', {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
} catch { /* not set yet */ }

if (current === desired) {
  console.log(`install-git-hooks: core.hooksPath 이미 '${desired}' — no-op`);
  process.exit(0);
}

execSync(`git config --local core.hooksPath ${desired}`, { cwd: repoRoot, stdio: 'inherit' });
console.log(`install-git-hooks: core.hooksPath → '${desired}' (was: '${current || '(unset)'}')`);
