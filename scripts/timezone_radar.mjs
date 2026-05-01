// Improvement #5 — 跨時區套利雷達
// 在 UTC 03:00-06:00（台北 11:00-14:00, 美東 23:00-02:00）特別密集掃
//   * SN ~bitcoin/~bounties/~jobs 新貼文
//   * GitHub bounty issues 新建
//   * Bountycaster 新 bounty
// 只在窗口內活躍；外部時段直接 exit 0（雲端 cron 也只在窗口排程）
//
// 用法:
//   node scripts/timezone_radar.mjs           # 自動依當下 UTC 判斷是否在窗口內
//   node scripts/timezone_radar.mjs --force   # 強制執行（測試用）
//   node scripts/timezone_radar.mjs --json    # JSON 輸出
//
// 輸出 logs/timezone/tz_<utc_ts>.tsv + tz_latest.tsv

import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve(process.env.OUT_DIR || 'logs/timezone');
fs.mkdirSync(OUT_DIR, { recursive: true });

const FORCE = process.argv.includes('--force');
const JSON_MODE = process.argv.includes('--json');

// ── 窗口檢查 (UTC 03:00–06:00) ──
const nowUtcH = new Date().getUTCHours();
const inWindow = nowUtcH >= 3 && nowUtcH < 6;
if (!inWindow && !FORCE) {
  console.log(`[tz-radar] outside window (UTC ${nowUtcH}h, window 03-06). exit.`);
  process.exit(0);
}

// ── 1. SN ──
async function fetchSN() {
  const SUBS = ['bitcoin', 'bounties', 'jobs', 'AGITHON'];
  const Q = `query items($sub:String,$sort:String,$when:String,$limit:Limit){
    items(sub:$sub,sort:$sort,when:$when,limit:$limit){items{
      id title createdAt sats bounty bountyPaidTo ncomments user{name} sub{name}
    }}
  }`;
  const out = [];
  for (const sub of SUBS) {
    try {
      const r = await fetch('https://stacker.news/api/graphql', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'apollographql-client-name': 'web' },
        body: JSON.stringify({ query: Q, variables: { sub, sort: 'recent', when: 'day', limit: 30 }, operationName: 'items' }),
      });
      const j = await r.json();
      for (const it of (j.data?.items?.items || [])) {
        const ageH = (Date.now() - new Date(it.createdAt).getTime()) / 3600000;
        if (ageH > 6) continue; // 視窗策略 → 只看 6h 內
        out.push({
          source: `sn/${sub}`,
          id: it.id,
          title: (it.title || '').slice(0, 120),
          age_h: ageH.toFixed(1),
          bounty: Number(it.bounty || 0),
          ncom: Number(it.ncomments || 0),
          url: `https://stacker.news/items/${it.id}`,
          tag: (Number(it.bounty || 0) > 0 && !it.bountyPaidTo)
            ? 'OPEN_BOUNTY'
            : (it.ncomments <= 1 && ageH <= 1 ? 'FRESH_LOW_COMP' : 'FRESH'),
        });
      }
    } catch (e) {
      console.error(`[tz-radar] sn/${sub}:`, e.message);
    }
  }
  return out;
}

// ── 2. GitHub bounty issues ──
async function fetchGitHub() {
  // 找最近 6h 內含 bounty/sats 的 issue
  const since = new Date(Date.now() - 6 * 3600000).toISOString().split('T')[0];
  const q = `label:bounty state:open created:>=${since}`;
  try {
    const r = await fetch(
      `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&sort=created&order=desc&per_page=15`,
      { headers: { accept: 'application/vnd.github+json', 'user-agent': 'cesf-tz-radar' } }
    );
    if (!r.ok) return [];
    const j = await r.json();
    return (j.items || []).map(it => {
      const ageH = (Date.now() - new Date(it.created_at).getTime()) / 3600000;
      return {
        source: 'github',
        id: String(it.number),
        title: (it.title || '').slice(0, 120),
        age_h: ageH.toFixed(1),
        bounty: 0,
        ncom: it.comments,
        url: it.html_url,
        tag: it.comments === 0 ? 'FRESH_LOW_COMP' : 'FRESH',
      };
    }).filter(x => Number(x.age_h) <= 6);
  } catch (e) {
    console.error('[tz-radar] gh:', e.message);
    return [];
  }
}

// ── main ──
(async () => {
  const all = [];
  const results = await Promise.allSettled([fetchSN(), fetchGitHub()]);
  for (const r of results) if (r.status === 'fulfilled') all.push(...r.value);

  // 排序: FRESH_LOW_COMP > OPEN_BOUNTY > FRESH; 同 tag 按 bounty desc + age asc
  const order = { FRESH_LOW_COMP: 0, OPEN_BOUNTY: 1, FRESH: 2 };
  all.sort((a, b) => {
    const oa = order[a.tag] ?? 9, ob = order[b.tag] ?? 9;
    if (oa !== ob) return oa - ob;
    if (b.bounty !== a.bounty) return b.bounty - a.bounty;
    return Number(a.age_h) - Number(b.age_h);
  });

  const top = all.slice(0, 40);

  if (JSON_MODE) {
    console.log(JSON.stringify(top, null, 2));
    return;
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const tsv = path.join(OUT_DIR, `tz_${ts}.tsv`);
  const lines = [
    '# tag\tsource\tage_h\tbounty\tncom\turl\ttitle',
    ...top.map(it => [it.tag, it.source, it.age_h, it.bounty, it.ncom, it.url, it.title].join('\t')),
  ];
  fs.writeFileSync(tsv, lines.join('\n') + '\n');
  console.log(`[tz-radar] wrote ${tsv} (${top.length} items in window)`);

  const latest = path.join(OUT_DIR, 'tz_latest.tsv');
  try { fs.unlinkSync(latest); } catch {}
  try { fs.symlinkSync(path.basename(tsv), latest); } catch {}

  const flc = top.filter(it => it.tag === 'FRESH_LOW_COMP');
  if (flc.length) {
    console.log(`\n[tz-radar] 🌙 ${flc.length} FRESH_LOW_COMP (亞洲日間 first-mover):`);
    for (const it of flc.slice(0, 6)) {
      console.log(`  ${it.source} ${it.age_h}h ncom=${it.ncom} ${it.title}`);
      console.log(`    ${it.url}`);
    }
  }
})();
