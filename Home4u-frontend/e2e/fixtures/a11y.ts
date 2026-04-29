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

// 프로세스 스코프 캐시 — playwright worker 1개 안에서만 공유 (workers > 1 이면 worker 별 독립).
// 같은 (path + DOM length) 키가 다시 들어오면 이전 결과를 재사용해 axe 호출 비용을 줄인다.
interface CachedScan { violations: Violation[] }
const scanCache = new Map<string, CachedScan>();

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
    cacheKey = await page.evaluate(() => `${location.pathname}::${document.body.innerHTML.length}`);
    cacheKey = `${tags.join(',')}@${skipRules.join(',')}#${cacheKey}`;
    const cached = scanCache.get(cacheKey);
    if (cached) {
      const blocking = cached.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
      expect(blocking, `axe scan (cached) found blocking violations`).toEqual([]);
      return;
    }
  }

  let builder = new AxeBuilder({ page }).withTags(tags);
  if (skipRules.length > 0) {
    builder = builder.disableRules(skipRules);
  }

  const result = await builder.analyze();
  if (cacheKey) scanCache.set(cacheKey, { violations: result.violations as Violation[] });

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

/** 테스트 격리용 — 다른 테스트 파일 사이 캐시 잔존이 의심될 때 호출. */
export function __clearA11yCache(): void {
  scanCache.clear();
}
