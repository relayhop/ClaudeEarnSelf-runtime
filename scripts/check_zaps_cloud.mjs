#!/usr/bin/env node
// Cloud-side zap detector — runs in GH Actions (ubuntu-latest, no Mac dependency).
// Queries Nostr relays for kind:9735 zap_receipt events targeting relayhop pubkey.
// Persists state in repo: logs/state/zaps_seen.tsv (id<TAB>created_at<TAB>sats<TAB>relay)
// On +delta, exits 1 to signal workflow to commit + open issue.

import WebSocket from 'ws';

const PUBKEY_HEX = '366aad5d389c4abe4af00d04d8b70446cd59fd4285662fc836730429ab269ec4';
if (PUBKEY_HEX.length !== 64) {
  console.error(`PUBKEY_HEX must be exactly 64 hex chars, got ${PUBKEY_HEX.length}`);
  process.exit(2);
}

const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://nostr.bitcoiner.social',
  'wss://relay.nostr.band',
];

const STATE = 'logs/state/zaps_seen.tsv';

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

function parseSats(bolt11) {
  const m = /^lnbc(\d+)([munp]?)/.exec(bolt11 || '');
  if (!m) return null;
  const amt = parseInt(m[1], 10);
  const mult = { m: 1e-3, u: 1e-6, n: 1e-9, p: 1e-12, '': 1 }[m[2]];
  return Math.round(amt * mult * 1e8);
}

async function querySingle(url) {
  return new Promise((resolve) => {
    const events = [];
    let timer;
    let ws;
    try {
      ws = new WebSocket(url, { handshakeTimeout: 8000 });
    } catch (e) {
      return resolve([]);
    }
    const cleanup = () => {
      try { clearTimeout(timer); ws.close(); } catch {}
      resolve(events);
    };
    timer = setTimeout(cleanup, 12000);
    ws.on('error', cleanup);
    ws.on('open', () => {
      ws.send(JSON.stringify(['REQ', 'zaps', { kinds: [9735], '#p': [PUBKEY_HEX], limit: 200 }]));
    });
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg[0] === 'EVENT' && msg[2]) events.push(msg[2]);
        else if (msg[0] === 'EOSE') cleanup();
      } catch {}
    });
  });
}

async function main() {
  const seen = new Map();
  if (existsSync(STATE)) {
    const lines = readFileSync(STATE, 'utf8').trim().split('\n');
    for (const line of lines) {
      if (!line || line.startsWith('#')) continue;
      const [id, created_at, sats, relay] = line.split('\t');
      if (id) seen.set(id, { created_at, sats, relay });
    }
  }

  const all = await Promise.all(RELAYS.map(querySingle));
  const flat = all.flat();

  const fresh = [];
  const seenInRun = new Set();
  for (const e of flat) {
    if (!e.id || seen.has(e.id) || seenInRun.has(e.id)) continue;
    seenInRun.add(e.id);
    let bolt11 = '';
    for (const t of e.tags || []) if (t[0] === 'bolt11') bolt11 = t[1];
    const sats = parseSats(bolt11) ?? 0;
    fresh.push({ id: e.id, created_at: e.created_at, sats, bolt11_prefix: (bolt11 || '').slice(0, 20) });
  }

  if (fresh.length === 0) {
    console.log(`no_new_zaps total_tracked=${seen.size}`);
    process.exit(0);
  }

  // Append to state file
  mkdirSync(dirname(STATE), { recursive: true });
  if (!existsSync(STATE)) {
    writeFileSync(STATE, '# id\tcreated_at\tsats\trelay_first_seen\n');
  }
  const out = fresh
    .map((e) => `${e.id}\t${e.created_at}\t${e.sats}\tcloud-multi\n`)
    .join('');
  // Append (read+write to avoid loading large file twice)
  const cur = readFileSync(STATE, 'utf8');
  writeFileSync(STATE, cur + out);

  // Emit summary as GH Actions output
  const total = fresh.reduce((s, e) => s + e.sats, 0);
  const summaryLines = fresh.map(
    (e) => `  +${e.sats} sats — id=${e.id.slice(0, 16)} ts=${new Date(e.created_at * 1000).toISOString()}`
  );
  console.log(`new_zaps=${fresh.length}`);
  console.log(`total_sats=${total}`);
  console.log(summaryLines.join('\n'));

  // GH Actions outputs
  if (process.env.GITHUB_OUTPUT) {
    const fs = await import('node:fs');
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `new_zaps=${fresh.length}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `total_sats=${total}\n`);
    // multi-line summary needs delimiter pattern
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `summary<<EOF_SUMMARY\n${summaryLines.join('\n')}\nEOF_SUMMARY\n`);
  }
}

main().catch((e) => {
  console.error(e.stack || e.message);
  process.exit(2);
});
