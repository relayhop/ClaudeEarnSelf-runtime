import { describe, it, expect } from 'vitest';
import {
  parseBountyLine,
  parseBountyText,
  filterOpenBounties,
  filterByTag,
  sortByScore,
  summarizeBounties,
  BountyParseError,
} from '../../src/radar/bountyParser';

describe('parseBountyLine', () => {
  const validLine =
    '1549793\tbitcoin\t5000\t18\t19.0\tOPEN_BOUNTY,HOT\t\u26a1Best tips for running a profitable lighting node?\u26a1';

  it('parses a valid bounty line with emoji title', () => {
    const bounty = parseBountyLine(validLine);
    expect(bounty.id).toBe(1549793);
    expect(bounty.currency).toBe('bitcoin');
    expect(bounty.amount).toBe(5000);
    expect(bounty.replies).toBe(18);
    expect(bounty.score).toBe(19.0);
    expect(bounty.tags).toContain('OPEN_BOUNTY');
    expect(bounty.tags).toContain('HOT');
    expect(bounty.status).toBe('OPEN_BOUNTY');
    expect(bounty.title).toBe(
      '\u26a1Best tips for running a profitable lighting node?\u26a1'
    );
  });

  it('throws on empty line', () => {
    expect(() => parseBountyLine('')).toThrow(BountyParseError);
  });

  it('throws on whitespace-only line', () => {
    expect(() => parseBountyLine('   ')).toThrow(BountyParseError);
  });

  it('throws on comment line', () => {
    expect(() => parseBountyLine('# this is a comment')).toThrow(BountyParseError);
  });

  it('throws on too few fields', () => {
    expect(() =>
      parseBountyLine('123\tbitcoin\t5000')
    ).toThrow(BountyParseError);
  });

  it('throws on too many fields', () => {
    const extra = validLine + '\textra';
    expect(() => parseBountyLine(extra)).toThrow(BountyParseError);
  });

  it('throws on non-numeric id', () => {
    const line = validLine.replace('1549793', 'abc');
    expect(() => parseBountyLine(line)).toThrow(BountyParseError);
  });

  it('throws on negative amount', () => {
    const parts = validLine.split('\t');
    parts[2] = '-5000';
    expect(() => parseBountyLine(parts.join('\t'))).toThrow(BountyParseError);
  });

  it('throws on empty currency', () => {
    const parts = validLine.split('\t');
    parts[1] = '';
    expect(() => parseBountyLine(parts.join('\t'))).toThrow(BountyParseError);
  });

  it('throws on currency with special chars', () => {
    const parts = validLine.split('\t');
    parts[1] = 'bit-coin';
    expect(() => parseBountyLine(parts.join('\t'))).toThrow(BountyParseError);
  });

  it('throws on unknown tag', () => {
    const parts = validLine.split('\t');
    parts[5] = 'OPEN_BOUNTY,UNKNOWN_TAG';
    expect(() => parseBountyLine(parts.join('\t'))).toThrow(BountyParseError);
  });

  it('throws on missing status tag', () => {
    const parts = validLine.split('\t');
    parts[5] = 'HOT,VERIFIED';
    expect(() => parseBountyLine(parts.join('\t'))).toThrow(BountyParseError);
  });

  it('throws on conflicting status tags', () => {
    const parts = validLine.split('\t');
    parts[5] = 'OPEN_BOUNTY,CLOSED_BOUNTY';
    expect(() => parseBountyLine(parts.join('\t'))).toThrow(BountyParseError);
  });

  it('throws on empty title', () => {
    const parts = validLine.split('\t');
    parts[6] = '   ';
    expect(() => parseBountyLine(parts.join('\t'))).toThrow(BountyParseError);
  });

  it('handles integer overflow on id', () => {
    const parts = validLine.split('\t');
    parts[0] = '99999999999999999999';
    expect(() => parseBountyLine(parts.join('\t'))).toThrow(BountyParseError);
  });

  it('handles duplicate tags by deduplicating', () => {
    const parts = validLine.split('\t');
    parts[5] = 'OPEN_BOUNTY,HOT,HOT';
    const bounty = parseBountyLine(parts.join('\t'));
    const hotCount = bounty.tags.filter((t) => t === 'HOT').length;
    expect(hotCount).toBe(1);
  });

  it('parses multiple tags correctly', () => {
    const parts = validLine.split('\t');
    parts[5] = 'OPEN_BOUNTY,HOT,VERIFIED,URGENT';
    const bounty = parseBountyLine(parts.join('\t'));
    expect(bounty.tags).toHaveLength(4);
  });

  it('handles score with no decimal', () => {
    const parts = validLine.split('\t');
    parts[4] = '42';
    const bounty = parseBountyLine(parts.join('\t'));
    expect(bounty.score).toBe(42);
  });

  it('throws on invalid score format', () => {
    const parts = validLine.split('\t');
    parts[4] = 'abc';
    expect(() => parseBountyLine(parts.join('\t'))).toThrow(BountyParseError);
  });

  it('throws on null input', () => {
    expect(() => parseBountyLine(null as unknown as string)).toThrow(
      BountyParseError
    );
  });

  it('throws on undefined input', () => {
    expect(() => parseBountyLine(undefined as unknown as string)).toThrow(
      BountyParseError
    );
  });
});

describe('parseBountyText', () => {
  it('parses multiple lines', () => {
    const text = [
      '111\tbitcoin\t1000\t5\t10.0\tOPEN_BOUNTY\tFirst bounty',
      '222\tbitcoin\t2000\t10\t20.0\tOPEN_BOUNTY,HOT\tSecond bounty',
    ].join('\n');
    const bounties = parseBountyText(text);
    expect(bounties).toHaveLength(2);
    expect(bounties[0].id).toBe(111);
    expect(bounties[1].id).toBe(222);
  });

  it('skips empty lines', () => {
    const text = [
      '111\tbitcoin\t1000\t5\t10.0\tOPEN_BOUNTY\tFirst bounty',
      '',
      '   ',
      '222\tbitcoin\t2000\t10\t20.0\tOPEN_BOUNTY,HOT\tSecond bounty',
    ].join('\n');
    const bounties = parseBountyText(text);
    expect(bounties).toHaveLength(2);
  });

  it('throws on empty text', () => {
    expect(() => parseBountyText('')).toThrow(BountyParseError);
  });
});

describe('filterOpenBounties', () => {
  it('returns only open bounties', () => {
    const text = [
      '111\tbitcoin\t1000\t5\t10.0\tOPEN_BOUNTY\tOpen one',
      '222\tbitcoin\t2000\t10\t20.0\tCLOSED_BOUNTY\tClosed one',
    ].join('\n');
    const bounties = parseBountyText(text);
    const open = filterOpenBounties(bounties);
    expect(open).toHaveLength(1);
    expect(open[0].id).toBe(111);
  });
});

describe('filterByTag', () => {
  it('filters by HOT tag', () => {
    const text = [
      '111\tbitcoin\t1000\t5\t10.0\tOPEN_BOUNTY,HOT\tHot one',
      '222\tbitcoin\t2000\t10\t20.0\tOPEN_BOUNTY\tNot hot',
    ].join('\n');
    const bounties = parseBountyText(text);
    const hot = filterByTag(bounties, 'HOT');
    expect(hot).toHaveLength(1);
    expect(hot[0].id).toBe(111);
  });
});

describe('sortByScore', () => {
  it('sorts descending by default', () => {
    const text = [
      '111\tbitcoin\t1000\t5\t5.0\tOPEN_BOUNTY\tLow score',
      '222\tbitcoin\t2000\t10\t50.0\tOPEN_BOUNTY\tHigh score',
      '333\tbitcoin\t3000\t15\t25.0\tOPEN_BOUNTY\tMid score',
    ].join('\n');
    const bounties = parseBountyText(text);
    const sorted = sortByScore(bounties);
    expect(sorted[0].id).toBe(222);
    expect(sorted[1].id).toBe(333);
    expect(sorted[2].id).toBe(111);
  });

  it('sorts ascending when descending=false', () => {
    const text = [
      '111\tbitcoin\t1000\t5\t5.0\tOPEN_BOUNTY\tLow score',
      '222\tbitcoin\t2000\t10\t50.0\tOPEN_BOUNTY\tHigh score',
    ].join('\n');
    const bounties = parseBountyText(text);
    const sorted = sortByScore(bounties, false);
    expect(sorted[0].id).toBe(111);
    expect(sorted[1].id).toBe(222);
  });
});

describe('summarizeBounties', () => {
  it('produces correct summary', () => {
    const text = [
      '111\tbitcoin\t1000\t5\t10.0\tOPEN_BOUNTY,HOT\tBounty 1',
      '222\tmonero\t2000\t10\t20.0\tOPEN_BOUNTY\tBounty 2',
      '333\tbitcoin\t3000\t15\t30.0\tCLOSED_BOUNTY\tBounty 3',
    ].join('\n');
    const bounties = parseBountyText(text);
    const summary = summarizeBounties(bounties);
    expect(summary.total).toBe(3);
    expect(summary.openCount).toBe(2);
    expect(summary.hotCount).toBe(1);
    expect(summary.totalAmount).toBe(6000);
    expect(summary.currencies).toContain('bitcoin');
    expect(summary.currencies).toContain('monero');
    expect(summary.currencies).toHaveLength(2);
  });
});
