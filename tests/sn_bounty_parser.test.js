'use strict';

var assert = require('assert');
var parser = require('../scripts/sn_bounty_parser');

var parseBountyLine = parser.parseBountyLine;
var formatBountyMarkdown = parser.formatBountyMarkdown;
var isOpenBounty = parser.isOpenBounty;

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('  PASS: ' + name);
    passed++;
  } catch (err) {
    console.log('  FAIL: ' + name);
    console.log('    ' + err.message);
    failed++;
  }
}

// --- Bounty from issue #742 ---
test('parses issue #742 bounty with emoji title and decimal score', function () {
  var line = '1549793\tbitcoin\t5000\t18\t18.4\tOPEN_BOUNTY,HOT\t⚡Best tips for running a profitable lighting node?⚡';
  var b = parseBountyLine(line);
  assert.strictEqual(b.id, 1549793);
  assert.strictEqual(b.territory, 'bitcoin');
  assert.strictEqual(b.amount, 5000);
  assert.strictEqual(b.postCount, 18);
  assert.strictEqual(b.score, 18.4);
  assert.deepStrictEqual(b.tags, ['OPEN_BOUNTY', 'HOT']);
  assert.strictEqual(b.title, '⚡Best tips for running a profitable lighting node?⚡');
});

// --- Empty / null input ---
test('throws on null input', function () {
  assert.throws(function () { parseBountyLine(null); }, /must be a string/);
});

test('throws on undefined input', function () {
  assert.throws(function () { parseBountyLine(undefined); }, /must be a string/);
});

test('throws on empty string', function () {
  assert.throws(function () { parseBountyLine(''); }, /empty/);
});

test('throws on whitespace-only string', function () {
  assert.throws(function () { parseBountyLine('   \t  '); }, /empty/);
});

// --- Field count ---
test('throws on too few fields', function () {
  assert.throws(function () { parseBountyLine('1\tbitcoin'); }, /at least 7/);
});

// --- ID validation ---
test('throws on non-numeric ID', function () {
  assert.throws(function () { parseBountyLine('abc\tbitcoin\t100\t5\t1.0\tOPEN_BOUNTY\tTitle'); }, /invalid bounty ID/);
});

test('throws on zero ID', function () {
  assert.throws(function () { parseBountyLine('0\tbitcoin\t100\t5\t1.0\tOPEN_BOUNTY\tTitle'); }, /invalid bounty ID/);
});

test('throws on negative ID', function () {
  assert.throws(function () { parseBountyLine('-1\tbitcoin\t100\t5\t1.0\tOPEN_BOUNTY\tTitle'); }, /invalid bounty ID/);
});

// --- Amount validation ---
test('throws on non-numeric amount', function () {
  assert.throws(function () { parseBountyLine('1\tbitcoin\tabc\t5\t1.0\tOPEN_BOUNTY\tTitle'); }, /invalid amount/);
});

test('throws on negative amount', function () {
  assert.throws(function () { parseBountyLine('1\tbitcoin\t-1\t5\t1.0\tOPEN_BOUNTY\tTitle'); }, /invalid amount/);
});

test('accepts zero amount', function () {
  var b = parseBountyLine('1\tbitcoin\t0\t5\t1.0\tOPEN_BOUNTY\tTitle');
  assert.strictEqual(b.amount, 0);
});

// --- Score (decimal) ---
test('parses integer score', function () {
  var b = parseBountyLine('1\tbitcoin\t100\t5\t3\tOPEN_BOUNTY\tTitle');
  assert.strictEqual(b.score, 3);
});

test('parses decimal score', function () {
  var b = parseBountyLine('1\tbitcoin\t100\t5\t3.14\tOPEN_BOUNTY\tTitle');
  assert.strictEqual(b.score, 3.14);
});

test('parses zero score', function () {
  var b = parseBountyLine('1\tbitcoin\t100\t5\t0\tOPEN_BOUNTY\tTitle');
  assert.strictEqual(b.score, 0);
});

test('parses negative score', function () {
  var b = parseBountyLine('1\tbitcoin\t100\t5\t-2.5\tOPEN_BOUNTY\tTitle');
  assert.strictEqual(b.score, -2.5);
});

// --- Tags ---
test('splits comma-separated tags', function () {
  var b = parseBountyLine('1\tbitcoin\t100\t5\t1.0\tOPEN_BOUNTY,HOT,URGENT\tTitle');
  assert.deepStrictEqual(b.tags, ['OPEN_BOUNTY', 'HOT', 'URGENT']);
});

test('handles single tag', function () {
  var b = parseBountyLine('1\tbitcoin\t100\t5\t1.0\tOPEN_BOUNTY\tTitle');
  assert.deepStrictEqual(b.tags, ['OPEN_BOUNTY']);
});

test('trims whitespace in tags', function () {
  var b = parseBountyLine('1\tbitcoin\t100\t5\t1.0\t OPEN_BOUNTY , HOT \tTitle');
  assert.deepStrictEqual(b.tags, ['OPEN_BOUNTY', 'HOT']);
});

test('filters empty tags', function () {
  var b = parseBountyLine('1\tbitcoin\t100\t5\t1.0\tOPEN_BOUNTY,,\tTitle');
  assert.deepStrictEqual(b.tags, ['OPEN_BOUNTY']);
});

test('throws when no valid tags', function () {
  assert.throws(function () { parseBountyLine('1\tbitcoin\t100\t5\t1.0\t,,\tTitle'); }, /no valid tags/);
});

// --- Title with emoji ---
test('preserves emoji in title', function () {
  var b = parseBountyLine('1\tbitcoin\t100\t5\t1.0\tOPEN_BOUNTY\t⚡Lightning Tips⚡');
  assert.strictEqual(b.title, '⚡Lightning Tips⚡');
});

test('preserves multiple emoji in title', function () {
  var b = parseBountyLine('1\tbitcoin\t100\t5\t1.0\tOPEN_BOUNTY\t⚡🚀 Best Tips 🚀⚡');
  assert.strictEqual(b.title, '⚡🚀 Best Tips 🚀⚡');
});

// --- Title with tabs ---
test('preserves tabs within title', function () {
  var b = parseBountyLine('1\tbitcoin\t100\t5\t1.0\tOPEN_BOUNTY\tTitle\twith\ttabs');
  assert.strictEqual(b.title, 'Title\twith\ttabs');
});

// --- Empty title ---
test('throws on empty title', function () {
  assert.throws(function () { parseBountyLine('1\tbitcoin\t100\t5\t1.0\tOPEN_BOUNTY\t'); }, /title is empty/);
});

test('throws on whitespace-only title', function () {
  assert.throws(function () { parseBountyLine('1\tbitcoin\t100\t5\t1.0\tOPEN_BOUNTY\t   '); }, /title is empty/);
});

// --- Whitespace trimming ---
test('trims leading/trailing whitespace on all fields', function () {
  var b = parseBountyLine('  1 \t bitcoin \t 100 \t 5 \t 1.0 \t OPEN_BOUNTY \t Test Title  ');
  assert.strictEqual(b.id, 1);
  assert.strictEqual(b.territory, 'bitcoin');
  assert.strictEqual(b.title, 'Test Title');
});

// --- Large numbers ---
test('handles large bounty amount', function () {
  var b = parseBountyLine('1\tbitcoin\t1000000\t5\t1.0\tOPEN_BOUNTY\tBig Bounty');
  assert.strictEqual(b.amount, 1000000);
});

test('handles large ID', function () {
  var b = parseBountyLine('9999999\tbitcoin\t100\t5\t1.0\tOPEN_BOUNTY\tTitle');
  assert.strictEqual(b.id, 9999999);
});

// --- formatBountyMarkdown ---
test('formatBountyMarkdown produces markdown table', function () {
  var b = parseBountyLine('1549793\tbitcoin\t5000\t18\t18.4\tOPEN_BOUNTY,HOT\t⚡Best tips for running a profitable lighting node?⚡');
  var md = formatBountyMarkdown(b);
  assert.ok(md.indexOf('| ID | 1549793 |') !== -1);
  assert.ok(md.indexOf('| Amount | 5000 sats |') !== -1);
  assert.ok(md.indexOf('| Tags | OPEN_BOUNTY, HOT |') !== -1);
  assert.ok(md.indexOf('⚡Best tips for running a profitable lighting node?⚡') !== -1);
});

// --- isOpenBounty ---
test('isOpenBounty returns true for OPEN_BOUNTY tag', function () {
  var b = parseBountyLine('1\tbitcoin\t100\t5\t1.0\tOPEN_BOUNTY\tTitle');
  assert.strictEqual(isOpenBounty(b), true);
});

test('isOpenBounty returns false without OPEN_BOUNTY tag', function () {
  var b = parseBountyLine('1\tbitcoin\t100\t5\t1.0\tCLOSED,HOT\tTitle');
  assert.strictEqual(isOpenBounty(b), false);
});

// --- Summary ---
console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  process.exit(1);
}
