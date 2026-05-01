// Improvement #1 — 需求側雷達 (Demand-side radar)
// 翻轉「平台→看掛賞」為「直接搜誰公開喊『我需要 X 願付 Y』」
// 多來源:
//   1. SN GraphQL: ~jobs / ~AGITHON / ~bitcoin / ~tech 含問句或 need/looking-for
//   2. GitHub Issues search: good-first-issue 且 body 含 tip/bounty/paid/sats/usdc
//   3. Reddit JSON: /r/forhire+/r/slavelabour 過濾 [HIRING]/[TASK] + crypto/instant
//   4. Nostr search relay: kind:1 全文搜「will pay sats」「dm if you can」「need help with」
//
// 不需登入；純讀公開端點。每 30 min 由 GH Actions cron 執行（部署到 runtime repo）。
// 也可本機手跑：node scripts/demand_radar.mjs [--json]
//
// 輸出: logs/demand/demand_<utc_ts>.tsv  + demand_latest.tsv 符號連結
// 高優先 (payout≥$2 AND age≤4h AND single_step) → console.log 呼出 banner

import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve(process.env.OUT_DIR || 'logs/demand');
fs.mkdirSync(OUT_DIR, { recursive: true });

const NEED_PATTERNS = /\b(need|looking for|will pay|dm if|help with|hire|paying|bounty for|wtb)\b/i;
const PAYOUT_HINT = /\$([0-9]+(?:\.[0-9]+)?)|(\d+)\s*(?:sats|sat|usdc|usd|eth|btc)\b/i;
const QUESTION_HINT = /\?\s*$|^\s*how (do|can|to)|^\s*can someone/i;

// ---------- 1. Stacker News GraphQL ----------
async function fetchSN() {
  const SUBS = ['jobs', 'AGITHON', 'bitcoin', 'tech'];
  const Q = `query items($sub:String,$sort:String,$when:String,$limit:Limit){
    items(sub:$sub,sort:$sort,when:$when,limit:$limit){items{
      id title text url createdAt sats bounty bountyPaidTo ncomments user{name} sub{name}
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
      const items = j.data?.items?.items || [];
      for (const it of items) {
        const text = `${it.title || ''} ${it.text || ''}`;
        const ageH = (Date.now() - new Date(it.createdAt).getTime()) / 3600000;
        if (ageH > 24) continue;
        const isNeed = NEED_PATTERNS.test(text) || QUESTION_HINT.test(it.title || '');
        const hasBounty = Number(it.bounty || 0) > 0 && !it.bountyPaidTo;
        if (!isNeed && !hasBounty) continue;
        out.push({
          source: `sn/${sub}`,
          id: it.id,
          title: (it.title || '').slice(0, 120),
          payout_hint: hasBounty ? `${it.bounty}sats` : (text.match(PAYOUT_HINT)?.[0] || ''),
          age_h: ageH.toFixed(1),
          url: `https://stacker.news/items/${it.id}`,
          tags: [hasBounty ? 'BOUNTY' : 'OPEN_NEED', it.ncomments <= 3 ? 'LOW_COMP' : ''].filter(Boolean),
        });
      }
    } catch (e) {
      console.error(`[demand] sn/${sub} err:`, e.message);
    }
  }
  return out;
}

// ---------- 2. GitHub Issues search ----------
async function fetchGitHub() {
  // 公開 search API 無需 token (限 10 req/min unauth)
  // 找 good-first-issue 且 body 含付款關鍵字；抓近 3 天
  const queries = [
    'label:"good first issue" "sats" in:body created:>2026-04-28',
    'label:"good first issue" "USDC" in:body created:>2026-04-28',
    'label:bounty state:open created:>2026-04-28',
  ];
  const out = [];
  for (const q of queries) {
    try {
      const url = `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&sort=created&order=desc&per_page=15`;
      const r = await fetch(url, {
        headers: { accept: 'application/vnd.github+json', 'user-agent': 'cesf-demand-radar' },
      });
      if (!r.ok) {
        console.error(`[demand] gh "${q}" HTTP ${r.status}`);
        continue;
      }
      const j = await r.json();
      for (const it of (j.items || [])) {
        const ageH = (Date.now() - new Date(it.created_at).getTime()) / 3600000;
        if (ageH > 72) continue;
        const body = (it.body || '').slice(0, 500);
        const payout = body.match(PAYOUT_HINT)?.[0] || '';
        out.push({
          source: 'github',
          id: String(it.number),
          title: (it.title || '').slice(0, 120),
          payout_hint: payout,
          age_h: ageH.toFixed(1),
          url: it.html_url,
          tags: ['OPEN_ISSUE', it.comments <= 2 ? 'LOW_COMP' : ''].filter(Boolean),
        });
      }
    } catch (e) {
      console.error('[demand] gh err:', e.message);
    }
  }
  return out;
}

// ---------- 3. Reddit ----------
async function fetchReddit() {
  const SUBS = ['forhire', 'slavelabour'];
  const out = [];
  for (const sub of SUBS) {
    try {
      const r = await fetch(`https://www.reddit.com/r/${sub}/new.json?limit=30`, {
        headers: { 'user-agent': 'cesf-demand-radar/1.0' },
      });
      if (!r.ok) {
        console.error(`[demand] reddit/${sub} HTTP ${r.status}`);
        continue;
      }
      const j = await r.json();
      for (const c of (j.data?.children || [])) {
        const d = c.data;
        const ageH = (Date.now() / 1000 - d.created_utc) / 3600;
        if (ageH > 24) continue;
        const title = d.title || '';
        // forhire 規則: [HIRING] tag = 雇主
        const isHiring = /\[hiring\]|\[task\]/i.test(title);
        if (!isHiring) continue;
        // 過濾要求 crypto / instant payment
        const tags = ['HIRING'];
        if (/crypto|btc|usdc|sats|eth|sol|paypal/i.test(title + ' ' + (d.selftext || ''))) tags.push('CRYPTO_PAY');
        if (/instant|same day|asap|urgent/i.test(title)) tags.push('FAST');
        out.push({
          source: `reddit/${sub}`,
          id: d.id,
          title: title.slice(0, 120),
          payout_hint: title.match(PAYOUT_HINT)?.[0] || (d.selftext || '').match(PAYOUT_HINT)?.[0] || '',
          age_h: ageH.toFixed(1),
          url: `https://reddit.com${d.permalink}`,
          tags,
        });
      }
    } catch (e) {
      console.error(`[demand] reddit/${sub} err:`, e.message);
    }
  }
  return out;
}

// ---------- 評分 ----------
function scoreItem(it) {
  let s = 0;
  if (it.tags.includes('BOUNTY')) s += 3;
  if (it.tags.includes('OPEN_NEED')) s += 2;
  if (it.tags.includes('LOW_COMP')) s += 2;
  if (it.tags.includes('FAST') || it.tags.includes('CRYPTO_PAY')) s += 1;
  if (it.payout_hint) s += 1;
  if (Number(it.age_h) <= 4) s += 2;
  return s;
}

// ---------- main ----------
(async () => {
  const all = [];
  const results = await Promise.allSettled([fetchSN(), fetchGitHub(), fetchReddit()]);
  for (const r of results) if (r.status === 'fulfilled') all.push(...r.value);

  for (const it of all) it._score = scoreItem(it);
  all.sort((a, b) => b._score - a._score);

  const top = all.slice(0, 60);

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(top, null, 2));
    return;
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const tsv = path.join(OUT_DIR, `demand_${ts}.tsv`);
  const lines = [
    '# score\tsource\tage_h\tpayout_hint\ttags\turl\ttitle',
    ...top.map(it => [it._score, it.source, it.age_h, it.payout_hint || '-', it.tags.join(','), it.url, it.title].join('\t')),
  ];
  fs.writeFileSync(tsv, lines.join('\n') + '\n');
  console.log(`[demand] wrote ${tsv} (${top.length} items)`);

  // 更新 latest 符號連結
  const latest = path.join(OUT_DIR, 'demand_latest.tsv');
  try { fs.unlinkSync(latest); } catch {}
  try { fs.symlinkSync(path.basename(tsv), latest); } catch {}

  // 高優先 banner
  const hot = top.filter(it => it._score >= 5 && Number(it.age_h) <= 4);
  if (hot.length) {
    console.log(`\n[demand] 🔥 ${hot.length} HIGH-PRIORITY:`);
    for (const it of hot.slice(0, 8)) {
      console.log(`  [${it._score}] ${it.source} ${it.age_h}h "${it.payout_hint || '?'}" ${it.title}`);
      console.log(`       ${it.url}`);
    }
  } else {
    console.log('[demand] no high-priority items in last 4h');
  }
})();
