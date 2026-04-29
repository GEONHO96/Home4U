import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * 페이지의 axe-core wcag2a/aa critical/serious 위반 0건 강제 — 어떤 e2e 시나리오에서도 동일 게이트.
 *
 * 사용:
 *   import { expectNoBlockingA11yViolations } from './fixtures/a11y';
 *   await expectNoBlockingA11yViolations(page);
 *
 * minor / moderate 는 허용 — 자잘한 룰 노이즈가 e2e flaky 의 원인이 되지 않게 (a11y.e2e.ts 와 동일 정책).
 *
 * 옵션:
 *   - tags: 기본 ['wcag2a', 'wcag2aa']. 신규 룰 도입 시 ['wcag21aa'] 추가 등 확장.
 *   - skipRules: 특정 페이지에서 의도적으로 비활성화할 룰 id (예: 'page-has-heading-one' — 모달 페이지)
 *   - cache: 기본 true. (URL pathname + DOM body innerHTML 길이) 키로 같은 결과를 재사용 — 같은 페이지/상태를
 *     여러 테스트가 스캔할 때 axe 호출(~1s)을 절감. DOM 길이가 같지만 내용이 다른 케이스가 우려되면 false.
 *
 * 위반 발견 시:
 *   - 각 위반의 impact / rule id / help / 첫 노드 html 을 console.log
 *   - 전체 violations 배열을 testInfo.attach 로 첨부 — Playwright HTML report + test-results/ 에 저장,
 *     PR review 단계에서 즉시 진단 가능.
 */

interface ViolationNode {
  html?: string;
  failureSummary?: string;
}
interface Violation {
  id: string;
  impact?: string | null;
  help?: string;
  nodes: ViolationNode[];
}

// 캐시 — 2단계:
//  1) in-memory (process scope) — 같은 worker 안에서 빠른 hit
//  2) on-disk (worker-shared, .axe-cache/{hash}.json) — workers > 1 또는 다음 run 까지 공유
// 키: tags + skipRules + path + DOM body innerHTML 길이.
// 캐시 디렉토리는 process.env.AXE_CACHE_DIR 또는 기본 e2e/.axe-cache.
// CI 에서 actions/cache 로 .axe-cache 디렉토리를 보존하면 빌드 간에도 공유 가능.
interface CachedScan { violations: Violation[] }
const memCache = new Map<string, CachedScan>();
const CACHE_DIR = process.env.AXE_CACHE_DIR
  ?? join(process.cwd(), 'e2e', '.axe-cache');
let cacheDirReady = false;

function ensureCacheDir(): void {
  if (cacheDirReady) return;
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    cacheDirReady = true;
  } catch { /* permission / readonly fs — fall back to mem only */ }
}

function diskKeyToPath(key: string): string {
  // sha1 으로 안전한 파일명 — 한글 path / 특수문자 충돌 방지
  const hash = createHash('sha1').update(key).digest('hex');
  return join(CACHE_DIR, `${hash}.json`);
}

function loadFromDisk(key: string): CachedScan | null {
  ensureCacheDir();
  if (!cacheDirReady) return null;
  const p = diskKeyToPath(key);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as CachedScan;
  } catch { return null; }
}

function saveToDisk(key: string, scan: CachedScan): void {
  ensureCacheDir();
  if (!cacheDirReady) return;
  try {
    writeFileSync(diskKeyToPath(key), JSON.stringify(scan));
  } catch { /* readonly fs — silent */ }
}

export async function expectNoBlockingA11yViolations(
  page: Page,
  options: { tags?: string[]; skipRules?: string[]; cache?: boolean } = {},
): Promise<void> {
  const tags = options.tags ?? ['wcag2a', 'wcag2aa'];
  const skipRules = options.skipRules ?? [];
  const useCache = options.cache !== false;

  // 캐시 키 — 페이지 path + DOM body innerHTML 길이. 정확한 hash 까진 아니어도 충분히 구분력 있음
  // (DOM 길이가 같은데 내용만 바뀐 경우는 드물고, opt-out (`cache: false`) 로 회피 가능).
  let cacheKey: string | null = null;
  if (useCache) {
    const pageKey = await page.evaluate(() => `${location.pathname}::${document.body.innerHTML.length}`);
    cacheKey = `${tags.join(',')}@${skipRules.join(',')}#${pageKey}`;

    // L1: memory — 같은 worker 의 후속 호출
    const memHit = memCache.get(cacheKey);
    if (memHit) {
      const blocking = memHit.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
      expect(blocking, `axe scan (mem cache) found blocking violations`).toEqual([]);
      return;
    }
    // L2: disk — workers > 1 또는 이전 run 의 결과
    const diskHit = loadFromDisk(cacheKey);
    if (diskHit) {
      memCache.set(cacheKey, diskHit); // 다음 호출 빠르게
      const blocking = diskHit.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
      expect(blocking, `axe scan (disk cache) found blocking violations`).toEqual([]);
      return;
    }
  }

  let builder = new AxeBuilder({ page }).withTags(tags);
  if (skipRules.length > 0) {
    builder = builder.disableRules(skipRules);
  }

  const result = await builder.analyze();
  if (cacheKey) {
    const entry: CachedScan = { violations: result.violations as Violation[] };
    memCache.set(cacheKey, entry);
    saveToDisk(cacheKey, entry);
  }

  const blocking = (result.violations as Violation[]).filter((v) => v.impact === 'critical' || v.impact === 'serious');

  if (blocking.length > 0) {
    for (const v of blocking) {
      // eslint-disable-next-line no-console
      console.log(`[a11y] ${v.impact} ${v.id} — ${v.help}\n  ${v.nodes[0]?.html?.slice(0, 200)}`);
    }
    // PR review 단계에서 즉시 디테일 보도록 — testInfo.attach 가 test-results/<test>/<filename>.json 로 저장 + HTML report 에도 노출
    try {
      const testInfo = test.info();
      await testInfo.attach(`a11y-violations-${testInfo.title.replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 80)}.json`, {
        body: Buffer.from(JSON.stringify(result.violations, null, 2), 'utf8'),
        contentType: 'application/json',
      });
    } catch {
      /* test.info() 가 호출 가능 시점이 아닐 수 있음 — silent */
    }
  }
  expect(blocking).toEqual([]);
}

/** 테스트 격리용 — 다른 테스트 파일 사이 캐시 잔존이 의심될 때 호출 (in-memory 만). */
export function __clearA11yCache(): void {
  memCache.clear();
}
