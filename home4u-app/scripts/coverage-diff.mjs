// @ts-check
import { readFileSync, writeFileSync } from 'node:fs';

/**
 * mobile vitest coverage 의 base ↔ current 비교 → PR 코멘트용 markdown 생성.
 *
 * 입력 파일:
 *  - coverage/coverage-summary.json (현재 PR HEAD)
 *  - ../.coverage-base/coverage-summary.json (PR base = main 의 가장 최근 빌드 아티팩트, 옵션)
 *
 * 출력 파일:
 *  - cov-comment.md
 *
 * sticky-pull-request-comment 가 같은 header 로 single-comment 유지.
 */

const read = (p) => {
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
};

const cur = read('coverage/coverage-summary.json');
const base = read('../.coverage-base/coverage-summary.json');

if (!cur) {
  console.log('::notice::current coverage-summary.json not found, skip');
  process.exit(0);
}

const trend = (c, b) => {
  if (b == null) return '';
  const d = +(c - b).toFixed(2);
  if (d > 0) return ' ▲' + d.toFixed(2);
  if (d < 0) return ' ▼' + Math.abs(d).toFixed(2);
  return ' =';
};

const fmt = (k) => {
  const c = cur.total[k]?.pct ?? 0;
  const b = base?.total?.[k]?.pct ?? null;
  return '| ' + k + ' | ' + c.toFixed(2) + '%' + trend(c, b) + ' |';
};

const lines = [
  '## 📊 Mobile coverage (vitest)',
  '',
  '| metric | % (vs base) |',
  '|:------|:------------|',
  fmt('lines'),
  fmt('statements'),
  fmt('functions'),
  fmt('branches'),
];

// ---- file-level hot file diff (top 3) ----
// total 키 외의 모든 file 키 를 lines.pct 기준으로 변동 폭이 큰 순으로 표시. 최소 1pp 이상 변화만.
if (base) {
  const files = Object.keys(cur).filter((k) => k !== 'total');
  const HOT_THRESHOLD = 1.0; // pp 미만 변화는 노이즈로 무시
  const hot = files
    .map((file) => {
      const curLines = cur[file]?.lines?.pct ?? 0;
      const baseLines = base[file]?.lines?.pct ?? null;
      if (baseLines == null) return { file, delta: null, curLines, isNew: true };
      const delta = +(curLines - baseLines).toFixed(2);
      return { file, delta, curLines, baseLines, isNew: false };
    })
    .filter((x) => x.isNew || (x.delta != null && Math.abs(x.delta) >= HOT_THRESHOLD))
    .sort((a, b) => {
      // 신규 파일 우선, 그 다음 |delta| 내림차순
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      return Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0);
    })
    .slice(0, 3);

  if (hot.length > 0) {
    // <details> 로 접어두기 — 기본은 totals 만 노출, reviewer 가 펼칠 때만 file-level 디테일 표시
    // (코멘트 noise 절감 + 알림 본문 짧게 유지)
    lines.push('', '<details>', '<summary>🔥 Hot files (lines % 변동 ≥ 1pp, top 3)</summary>', '');
    lines.push('| file | lines % | Δ vs base |');
    lines.push('|:-----|:--------|:----------|');
    for (const h of hot) {
      // 표 셀에서 줄바꿈/파이프 충돌 방지
      const filePath = h.file.replace(/\|/g, '\\|');
      if (h.isNew) {
        lines.push(`| ${filePath} | ${h.curLines.toFixed(2)}% | _new_ |`);
      } else {
        const arrow = h.delta > 0 ? '▲' : h.delta < 0 ? '▼' : '=';
        lines.push(`| ${filePath} | ${h.curLines.toFixed(2)}% | ${arrow}${Math.abs(h.delta).toFixed(2)} |`);
      }
    }
    lines.push('', '</details>');
  }
} else {
  lines.push('', '_base 아티팩트가 비어있어 추세 비교 없음 — 현재 값만 표시._');
}

const body = lines.join('\n');
writeFileSync('cov-comment.md', body);
console.log(body);
