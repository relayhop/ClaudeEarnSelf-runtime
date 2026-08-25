/**
 * Tests for SN bounty parser.
 * Run with: node scripts/sn-bounty-parser.test.js
 */

'use strict';

const assert = require('assert');
const {
  parseBountyLine,
  parseBountyFeed,
  serializeBounty,
  filterByStatus,
  sortByBountyAmount,
} = require('./sn-bounty-parser');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('\nRunning SN bounty parser tests...\n');

// --- parseBountyLine: valid input ---

test('parses a well-formed bounty line with unicode title', () => {
  const line = '1549793\tbitcoin\t5000\t18\t21.6\tOPEN_BOUNTY,HOT\t⚡Best tips for running a profitable lighting node?⚡';
  const result = parseBountyLine(line);
  assert.strictEqual(result.id, 1549793);
  assert.strictEqual(result.site, 'bitcoin');
  assert.strictEqual(result.bountyAmount, 5000);
  assert.strictEqual(result.answerCount, 18);
  assert.strictEqual(result.score, 21.6);
  assert.strictEqual(result.status, 'OPEN_BOUNTY');
  assert.deepStrictEqual(result.tags, ['HOT']);
  assert.strictEqual(result.title, '⚡Best tips for running a profitable lighting node?⚡');
});

test('parses a line with only status tag (no category tags)', () => {
  const line = '100\tethereum\t500\t3\t5.0\tOPEN_BOUNTY\tSimple question';
  const result = parseBountyLine(line);
  assert.strictEqual(result.status, 'OPEN_BOUNTY');
  assert.deepStrictEqual(result.tags, []);
});

test('parses a line with multiple category tags', () => {
  const line = '200\tbitcoin\t1000\t5\t10.0\tOPEN_BOUNTY,HOT,TRENDING,FEATURED\tMulti tag question';
  const result = parseBountyLine(line);
  assert.strictEqual(result.status, 'OPEN_BOUNTY');
  assert.deepStrictEqual(result.tags, ['HOT', 'TRENDING', 'FEATURED']);
});

test('handles score as integer', () => {
  const line = '300\tbitcoin\t200\t1\t42\tOPEN_BOUNTY\tInteger score';
  const result = parseBountyLine(line);
  assert.strictEqual(result.score, 42);
});

test('normalizes site to lowercase', () => {
  const line = '400\tBitCoin\t100\t0\t1.0\tOPEN_BOUNTY\tSite case';
  const result = parseBountyLine(line);
  assert.strictEqual(result.site, 'bitcoin');
});

test('preserves raw line in result', () => {
  const line = '500\tbitcoin\t50\t2\t3.5\tOPEN_BOUNTY\tRaw test';
  const result = parseBountyLine(line);
  assert.ok(result.raw.includes('500'));
  assert.ok(result.raw.includes('Raw test'));
});

test('includes parsedAt ISO timestamp', () => {
  const line = '600\tbitcoin\t50\t2\t3.5\tOPEN_BOUNTY\tTimestamp test';
  const result = parseBountyLine(line);
  assert.ok(result.parsedAt);
  assert.ok(!isNaN(new Date(result.parsedAt).getTime()));
});

// --- parseBountyLine: edge cases ---

test('returns null for empty string', () => {
  assert.strictEqual(parseBountyLine(''), null);
});

test('returns null for whitespace-only string', () => {
  assert.strictEqual(parseBountyLine('   \t   \t   '), null);
});

test('returns null for non-string input', () => {
  assert.strictEqual(parseBountyLine(null), null);
  assert.strictEqual(parseBountyLine(undefined), null);
  assert.strictEqual(parseBountyLine(123), null);
  assert.strictEqual(parseBountyLine({}), null);
});

test('returns null for line with too few fields', () => {
  assert.strictEqual(parseBountyLine('123\tbitcoin'), null);
  assert.strictEqual(parseBountyLine('123\tbitcoin\t5000'), null);
});

test('returns null for invalid id (non-numeric)', () => {
  assert.strictEqual(parseBountyLine('abc\tbitcoin\t5000\t18\t21.6\tOPEN_BOUNTY\tBad ID'), null);
});

test('returns null for id of zero', () => {
  assert.strictEqual(parseBountyLine('0\tbitcoin\t5000\t18\t21.6\tOPEN_BOUNTY\tZero ID'), null);
});

test('returns null for negative id', () => {
  assert.strictEqual(parseBountyLine('-1\tbitcoin\t5000\t18\t21.6\tOPEN_BOUNTY\tNegative ID'), null);
});

test('returns null for negative bounty amount', () => {
  assert.strictEqual(parseBountyLine('700\tbitcoin\t-100\t18\t21.6\tOPEN_BOUNTY\tNegative bounty'), null);
});

test('returns null for negative answer count', () => {
  assert.strictEqual(parseBountyLine('800\tbitcoin\t5000\t-5\t21.6\tOPEN_BOUNTY\tNegative answers'), null);
});

test('returns null for non-numeric score', () => {
  assert.strictEqual(parseBountyLine('900\tbitcoin\t5000\t18\tabc\tOPEN_BOUNTY\tBad score'), null);
});

test('returns null for empty site', () => {
  assert.strictEqual(parseBountyLine('1000\t\t5000\t18\t21.6\tOPEN_BOUNTY\tEmpty site'), null);
});

test('returns null for invalid site characters', () => {
  assert.strictEqual(parseBountyLine('1100\tbit coin\t5000\t18\t21.6\tOPEN_BOUNTY\tSpace in site'), null);
  assert.strictEqual(parseBountyLine('1200\tbitcoin!\t5000\t18\t21.6\tOPEN_BOUNTY\tSpecial char site'), null);
});

test('returns null for empty title', () => {
  assert.strictEqual(parseBountyLine('1300\tbitcoin\t5000\t18\t21.6\tOPEN_BOUNTY\t'), null);
});

test('handles title with embedded tabs (edge case)', () => {
  const line = '1400\tbitcoin\t5000\t18\t21.6\tOPEN_BOUNTY\tTitle\twith\ttabs';
  const result = parseBountyLine(line);
  assert.strictEqual(result.id, 1400);
  assert.strictEqual(result.title, 'Title\twith\ttabs');
});

test('handles empty tags field', () => {
  const line = '1500\tbitcoin\t5000\t18\t21.6\t\tNo tags';
  const result = parseBountyLine(line);
  assert.strictEqual(result.id, 1500);
  assert.strictEqual(result.status, 'UNKNOWN');
  assert.deepStrictEqual(result.tags, []);
});

test('handles unknown status tag gracefully', () => {
  const line = '1600\tbitcoin\t5000\t18\t21.6\tWEIRD_TAG\tUnknown status';
  const result = parseBountyLine(line);
  assert.strictEqual(result.status, 'UNKNOWN');
  assert.deepStrictEqual(result.tags, ['WEIRD_TAG']);
});

test('handles CLOSED_BOUNTY status', () => {
  const line = '1700\tbitcoin\t5000\t18\t21.6\tCLOSED_BOUNTY\tClosed bounty';
  const result = parseBountyLine(line);
  assert.strictEqual(result.status, 'CLOSED_BOUNTY');
});

test('handles EXPIRED_BOUNTY status', () => {
  const line = '1800\tbitcoin\t5000\t18\t21.6\tEXPIRED_BOUNTY\tExpired bounty';
  const result = parseBountyLine(line);
  assert.strictEqual(result.status, 'EXPIRED_BOUNTY');
});

test('handles GRACE_PERIOD status', () => {
  const line = '1900\tbitcoin\t5000\t18\t21.6\tGRACE_PERIOD\tGrace period';
  const result = parseBountyLine(line);
  assert.strictEqual(result.status, 'GRACE_PERIOD');
});

test('handles zero bounty amount', () => {
  const line = '2000\tbitcoin\t0\t0\t0.0\tOPEN_BOUNTY\tZero everything';
  const result = parseBountyLine(line);
  assert.strictEqual(result.bountyAmount, 0);
  assert.strictEqual(result.answerCount, 0);
  assert.strictEqual(result.score, 0);
});

test('handles very large bounty amount', () => {
  const line = '2100\tbitcoin\t999999999\t999\t9999.99\tOPEN_BOUNTY\tLarge values';
  const result = parseBountyLine(line);
  assert.strictEqual(result.bountyAmount, 999999999);
  assert.strictEqual(result.answerCount, 999);
  assert.strictEqual(result.score, 9999.99);
});

test('trims trailing newline from line', () => {
  const line = '2200\tbitcoin\t5000\t18\t21.6\tOPEN_BOUNTY\tTrailing newline\n';
  const result = parseBountyLine(line);
  assert.strictEqual(result.id, 2200);
  assert.strictEqual(result.title, 'Trailing newline');
});

test('trims trailing carriage return from line', () => {
  const line = '2300\tbitcoin\t5000\t18\t21.6\tOPEN_BOUNTY\tTrailing CR\r\n';
  const result = parseBountyLine(line);
  assert.strictEqual(result.id, 2300);
  assert.strictEqual(result.title, 'Trailing CR');
});

// --- parseBountyFeed ---

test('parses multi-line feed correctly', () => {
  const feed = [
    '2400\tbitcoin\t5000\t18\t21.6\tOPEN_BOUNTY,HOT\tFirst question',
    '2500\tethereum\t3000\t5\t15.0\tOPEN_BOUNTY\tSecond question',
    '2600\tbitcoin\t2000\t10\t8.5\tCLOSED_BOUNTY\tThird question',
  ].join('\n');
  const results = parseBountyFeed(feed);
  assert.strictEqual(results.length, 3);
  assert.strictEqual(results[0].id, 2400);
  assert.strictEqual(results[1].site, 'ethereum');
  assert.strictEqual(results[2].status, 'CLOSED_BOUNTY');
});

test('parseBountyFeed skips invalid lines', () => {
  const feed = [
    '2700\tbitcoin\t5000\t18\t21.6\tOPEN_BOUNTY\tValid line',
    '',
    'invalid\tbitcoin\t5000',
    '2800\tbitcoin\t3000\t5\t10.0\tOPEN_BOUNTY\tAnother valid line',
  ].join('\n');
  const results = parseBountyFeed(feed);
  assert.strictEqual(results.length, 2);
  assert.strictEqual(results[0].id, 2700);
  assert.strictEqual(results[1].id, 2800);
});

test('parseBountyFeed returns empty array for empty input', () => {
  assert.deepStrictEqual(parseBountyFeed(''), []);
  assert.deepStrictEqual(parseBountyFeed(null), []);
  assert.deepStrictEqual(parseBountyFeed(undefined), []);
});

test('parseBountyFeed handles Windows line endings (\\r\\n)', () => {
  const feed = '2900\tbitcoin\t5000\t18\t21.6\tOPEN_BOUNTY\tWindows\r\n3000\tbitcoin\t5000\t18\t21.6\tOPEN_BOUNTY\tLine2\r\n';
  const results = parseBountyFeed(feed);
  assert.strictEqual(results.length, 2);
  assert.strictEqual(results[0].id, 2900);
  assert.strictEqual(results[1].id, 3000);
});

// --- serializeBounty ---

test('serializeBounty produces valid tab-separated output', () => {
  const bounty = {
    id: 3100,
    site: 'bitcoin',
    bountyAmount: 5000,
    answerCount: 18,
    score: 21.6,
    tags: ['HOT'],
    status: 'OPEN_BOUNTY',
    title: 'Serialization test',
  };
  const serialized = serializeBounty(bounty);
  const reparsed = parseBountyLine(serialized);
  assert.strictEqual(reparsed.id, 3100);
  assert.strictEqual(reparsed.site, 'bitcoin');
  assert.strictEqual(reparsed.bountyAmount, 5000);
  assert.strictEqual(reparsed.answerCount, 18);
  assert.strictEqual(reparsed.score, 21.6);
  assert.strictEqual(reparsed.status, 'OPEN_BOUNTY');
  assert.deepStrictEqual(reparsed.tags, ['HOT']);
  assert.strictEqual(reparsed.title, 'Serialization test');
});

test('serializeBounty handles empty tags', () => {
  const bounty = {
    id: 3200,
    site: 'bitcoin',
    bountyAmount: 1000,
    answerCount: 0,
    score: 1.0,
    tags: [],
    status: 'OPEN_BOUNTY',
    title: 'No category tags',
  };
  const serialized = serializeBounty(bounty);
  const reparsed = parseBountyLine(serialized);
  assert.strictEqual(reparsed.status, 'OPEN_BOUNTY');
  assert.deepStrictEqual(reparsed.tags, []);
});

test('serializeBounty returns empty string for invalid input', () => {
  assert.strictEqual(serializeBounty(null), '');
  assert.strictEqual(serializeBounty(undefined), '');
  assert.strictEqual(serializeBounty({}), '');
});

// --- filterByStatus ---

test('filterByStatus returns only OPEN_BOUNTY entries', () => {
  const bounties = [
    { id: 1, status: 'OPEN_BOUNTY', bountyAmount: 5000 },
    { id: 2, status: 'CLOSED_BOUNTY', bountyAmount: 3000 },
    { id: 3, status: 'OPEN_BOUNTY', bountyAmount: 2000 },
  ];
  const filtered = filterByStatus(bounties, 'OPEN_BOUNTY');
  assert.strictEqual(filtered.length, 2);
  assert.strictEqual(filtered[0].id, 1);
  assert.strictEqual(filtered[1].id, 3);
});

test('filterByStatus is case-insensitive', () => {
  const bounties = [
    { id: 1, status: 'OPEN_BOUNTY', bountyAmount: 5000 },
  ];
  const filtered = filterByStatus(bounties, 'open_bounty');
  assert.strictEqual(filtered.length, 1);
});

test('filterByStatus returns empty array for no matches', () => {
  const bounties = [
    { id: 1, status: 'CLOSED_BOUNTY', bountyAmount: 5000 },
  ];
  const filtered = filterByStatus(bounties, 'OPEN_BOUNTY');
  assert.strictEqual(filtered.length, 0);
});

// --- sortByBountyAmount ---

test('sortByBountyAmount sorts descending (highest first)', () => {
  const bounties = [
    { id: 1, bountyAmount: 1000 },
    { id: 2, bountyAmount: 5000 },
    { id: 3, bountyAmount: 3000 },
  ];
  const sorted = sortByBountyAmount(bounties);
  assert.strictEqual(sorted[0].id, 2);
  assert.strictEqual(sorted[0].bountyAmount, 5000);
  assert.strictEqual(sorted[1].id, 3);
  assert.strictEqual(sorted[2].id, 1);
});

test('sortByBountyAmount does not mutate original array', () => {
  const bounties = [
    { id: 1, bountyAmount: 1000 },
    { id: 2, bountyAmount: 5000 },
  ];
  const sorted = sortByBountyAmount(bounties);
  assert.strictEqual(bounties[0].id, 1);
  assert.strictEqual(sorted[0].id, 2);
});

// --- Round-trip test with the exact issue data ---

test('round-trips the exact bounty line from issue #749', () => {
  const originalLine = '1549793\tbitcoin\t5000\t18\t21.6\tOPEN_BOUNTY,HOT\t⚡Best tips for running a profitable lighting node?⚡';
  const parsed = parseBountyLine(originalLine);
  assert.strictEqual(parsed.id, 1549793);
  assert.strictEqual(parsed.site, 'bitcoin');
  assert.strictEqual(parsed.bountyAmount, 5000);
  assert.strictEqual(parsed.answerCount, 18);
  assert.strictEqual(parsed.score, 21.6);
  assert.strictEqual(parsed.status, 'OPEN_BOUNTY');
  assert.deepStrictEqual(parsed.tags, ['HOT']);
  assert.strictEqual(parsed.title, '⚡Best tips for running a profitable lighting node?⚡');

  const serialized = serializeBounty(parsed);
  const reparsed = parseBountyLine(serialized);
  assert.strictEqual(reparsed.id, parsed.id);
  assert.strictEqual(reparsed.site, parsed.site);
  assert.strictEqual(reparsed.bountyAmount, parsed.bountyAmount);
  assert.strictEqual(reparsed.answerCount, parsed.answerCount);
  assert.strictEqual(reparsed.score, parsed.score);
  assert.strictEqual(reparsed.status, parsed.status);
  assert.deepStrictEqual(reparsed.tags, parsed.tags);
  assert.strictEqual(reparsed.title, parsed.title);
});

// --- Summary ---

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error('\n❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
}
