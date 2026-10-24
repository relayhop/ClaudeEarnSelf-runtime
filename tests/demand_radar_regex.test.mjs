import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const scriptContent = fs.readFileSync('scripts/demand_radar.mjs', 'utf8');
const regexMatch = scriptContent.match(/const PAYOUT_HINT = (\/.*?\/[a-z]*);/);

if (!regexMatch) {
  throw new Error('PAYOUT_HINT regex definition not located in scripts/demand_radar.mjs');
}

const PAYOUT_HINT = eval(regexMatch[1]);

test('PAYOUT_HINT regex accurately captures comma-separated satoshis', () => {
  const sample = 'OPEN_BOUNTY 10,000 SATS PROOF-OF-WORK RUN: Who can run the furthest?';
  const match = sample.match(PAYOUT_HINT);
  assert.ok(match, 'Expected match for 10,000 SATS');
  assert.equal(match[0], '10,000 SATS');
});

test('PAYOUT_HINT regex extracts USDC with decimal amounts', () => {
  const sample = 'sell all XLM if the price drops below 0.09 USDC';
  const match = sample.match(PAYOUT_HINT);
  assert.ok(match, 'Expected match for 0.09 USDC');
  assert.equal(match[0], '0.09 USDC');
});

test('PAYOUT_HINT regex extracts whole USDC bounty', () => {
  const sample = 'docs: 10 USDC reward for configuration guide';
  const match = sample.match(PAYOUT_HINT);
  assert.ok(match, 'Expected match for 10 USDC');
  assert.equal(match[0], '10 USDC');
});

test('PAYOUT_HINT regex extracts fiat dollar bounties', () => {
  const sample = 'Fix critical memory leak in worker: $2,500';
  const match = sample.match(PAYOUT_HINT);
  assert.ok(match, 'Expected match for $2,500');
  assert.equal(match[0], '$2,500');
});
