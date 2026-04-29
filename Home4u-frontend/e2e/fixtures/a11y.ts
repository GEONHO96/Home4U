import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

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
 */
export async function expectNoBlockingA11yViolations(
  page: Page,
  options: { tags?: string[]; skipRules?: string[] } = {},
): Promise<void> {
  const tags = options.tags ?? ['wcag2a', 'wcag2aa'];
  const skipRules = options.skipRules ?? [];

  let builder = new AxeBuilder({ page }).withTags(tags);
  if (skipRules.length > 0) {
    builder = builder.disableRules(skipRules);
  }

  const result = await builder.analyze();
  const blocking = result.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');

  if (blocking.length > 0) {
    for (const v of blocking) {
      // eslint-disable-next-line no-console
      console.log(`[a11y] ${v.impact} ${v.id} — ${v.help}\n  ${v.nodes[0]?.html?.slice(0, 200)}`);
    }
  }
  expect(blocking).toEqual([]);
}
