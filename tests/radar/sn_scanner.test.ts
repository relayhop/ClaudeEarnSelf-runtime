import { assertEquals, assertRejects } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { SNScaner } from '../../src/radar/sn_scanner.ts';
import { parseRadarLine, normalizeBountyTitle, determinePriority } from '../../src/radar/normalize.ts';

Deno.test('parseRadarLine - parses valid bounty line', () => {
  const line = '1549793\tbitcoin\t5000\t18\t20.8\tOPEN_BOUNTY,HOT\t⚡Best tips for running a profitable lighting node?⚡';
  const result = parseRadarLine(line);

  assertEquals(result?.item_id, 1549793);
  assertEquals(result?.currency, 'bitcoin');
  assertEquals(result?.amount, 5000);
  assertEquals(result?.upvotes, 18);
  assertEquals(result?.score, 20.8);
  assertEquals(result?.tags, ['OPEN_BOUNTY', 'HOT']);
  assertEquals(result?.title, 'Best tips for running a profitable lighting node?');
  assertEquals(result?.raw_title, '⚡Best tips for running a profitable lighting node?⚡');
  assertEquals(result?.status, 'open');
});

Deno.test('parseRadarLine - returns null for invalid line', () => {
  const line = 'invalid data';
  const result = parseRadarLine(line);
  assertEquals(result, null);
});

Deno.test('parseRadarLine - returns null for empty line', () => {
  const result = parseRadarLine('');
  assertEquals(result, null);
});

Deno.test('parseRadarLine - handles missing title', () => {
  const line = '12345\tbitcoin\t1000\t5\t10.0\tOPEN_BOUNTY';
  const result = parseRadarLine(line);
  assertEquals(result?.item_id, 12345);
  assertEquals(result?.title, '');
});

Deno.test('normalizeBountyTitle - strips emoji and trims', () => {
  const result = normalizeBountyTitle('⚡Best tips for running a profitable lighting node?⚡');
  assertEquals(result, 'Best tips for running a profitable lighting node?');
});

Deno.test('normalizeBountyTitle - handles empty string', () => {
  const result = normalizeBountyTitle('');
  assertEquals(result, '');
});

Deno.test('normalizeBountyTitle - collapses multiple spaces', () => {
  const result = normalizeBountyTitle('Hello   World');
  assertEquals(result, 'Hello World');
});

Deno.test('determinePriority - returns high for HOT tag with large bounty', () => {
  const bounty = {
    item_id: 1,
    currency: 'bitcoin',
    amount: 5000,
    upvotes: 18,
    score: 20.8,
    tags: ['OPEN_BOUNTY', 'HOT'],
    title: 'test',
    raw_title: 'test',
    url: '',
    status: 'open',
    category: 'general',
    keywords: [],
  };
  assertEquals(determinePriority(bounty), 'high');
});

Deno.test('determinePriority - returns medium for HOT tag with smaller bounty', () => {
  const bounty = {
    item_id: 1,
    currency: 'bitcoin',
    amount: 1000,
    upvotes: 5,
    score: 5.0,
    tags: ['OPEN_BOUNTY', 'HOT'],
    title: 'test',
    raw_title: 'test',
    url: '',
    status: 'open',
    category: 'general',
    keywords: [],
  };
  assertEquals(determinePriority(bounty), 'medium');
});

Deno.test('determinePriority - returns low for small bounty without HOT tag', () => {
  const bounty = {
    item_id: 1,
    currency: 'bitcoin',
    amount: 500,
    upvotes: 2,
    score: 2.0,
    tags: ['OPEN_BOUNTY'],
    title: 'test',
    raw_title: 'test',
    url: '',
    status: 'open',
    category: 'general',
    keywords: [],
  };
  assertEquals(determinePriority(bounty), 'low');
});

Deno.test('parseRadarLine - handles line with extra tabs in title', () => {
  const line = '999\tbitcoin\t2000\t3\t5.0\tOPEN_BOUNTY\tTitle with\ttabs\tin it';
  const result = parseRadarLine(line);
  assertEquals(result?.item_id, 999);
  assertEquals(result?.amount, 2000);
});

Deno.test('parseRadarLine - handles negative score', () => {
  const line = '555\tbitcoin\t100\t0\t-5.0\tOPEN_BOUNTY\tNegative test';
  const result = parseRadarLine(line);
  assertEquals(result?.score, -5.0);
});
