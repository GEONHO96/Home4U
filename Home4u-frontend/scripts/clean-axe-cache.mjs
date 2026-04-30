// @ts-check
import { existsSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

/**
 * e2e/.axe-cache 의 오래된 항목 제거 (mtime 기반 30일+).
 *
 * 의도:
 *  - CI 의 actions/cache 는 7일 미사용 시 자동 만료 — 빌드 환경은 자정리
 *  - 로컬 dev 는 무한 누적 → 디스크 누수 + stale 항목으로 인한 false-positive 위험
 *  - 이 스크립트를 가끔 (개발자 본인 일정 또는 husky 같은 hook) 돌려 정리
 *
 * 사용:
 *   npm run clean:axe-cache              # 30일+ 제거 (기본)
 *   npm run clean:axe-cache -- --days=7  # 7일+ 제거
 *   npm run clean:axe-cache -- --all     # 전체 비우기
 *   npm run clean:axe-cache -- --dry     # 제거 대신 어떤 파일이 대상인지만 출력
 */

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const all = args.includes('--all');
const daysArg = args.find((a) => a.startsWith('--days='));
const days = all ? 0 : (daysArg ? Number(daysArg.split('=')[1]) : 30);

if (Number.isNaN(days) || days < 0) {
  console.error(`잘못된 --days 값: ${daysArg}`);
  process.exit(2);
}

const cacheDir = process.env.AXE_CACHE_DIR ?? join(process.cwd(), 'e2e', '.axe-cache');

if (!existsSync(cacheDir)) {
  console.log(`axe cache 디렉토리 없음 (${cacheDir}) — 정리할 항목 없음.`);
  process.exit(0);
}

const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
let totalCount = 0;
let removeCount = 0;
let totalBytes = 0;
let removedBytes = 0;

const entries = readdirSync(cacheDir).filter((f) => f.endsWith('.json'));
for (const f of entries) {
  totalCount += 1;
  const full = join(cacheDir, f);
  let st;
  try { st = statSync(full); } catch { continue; }
  totalBytes += st.size;
  if (st.mtimeMs < cutoffMs) {
    if (dry) {
      const ageDays = ((Date.now() - st.mtimeMs) / (24 * 60 * 60 * 1000)).toFixed(1);
      console.log(`[dry] ${f}  (${ageDays}d old, ${st.size} B)`);
    } else {
      try { unlinkSync(full); removeCount += 1; removedBytes += st.size; }
      catch (err) { console.error(`failed to remove ${f}:`, err); }
    }
  }
}

const mode = dry ? '[dry-run]' : '';
const target = all ? '전체' : `${days}일+`;
console.log(
  `${mode} axe-cache: ${entries.length}개 entries, ${totalBytes} B 총량 — `
  + `${target} 대상 ${removeCount}개 제거 (${removedBytes} B 회수)`,
);
if (dry) {
  // 실제로 제거되었을 항목 수 도 가시화 (--dry 일 때 console.log 으로 이미 카운트했으나, summary 도 표시)
  let wouldRemove = 0;
  for (const f of entries) {
    try {
      const st = statSync(join(cacheDir, f));
      if (st.mtimeMs < cutoffMs) wouldRemove += 1;
    } catch { /* ignore */ }
  }
  console.log(`[dry] would remove ${wouldRemove} files`);
}
