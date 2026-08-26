'use strict';

const {
  parseBountyLine,
  parseBountyData,
  formatBountyIssue,
  REQUIRED_FIELD_COUNT
} = require('../src/lib/sn-bounty-parser');

describe('sn-bounty-parser', () => {
  describe('parseBountyLine', () => {
    test('parses valid bounty line with emoji in title', () => {
      const line = '1549793\tbitcoin\t5000\t18\t19.5\tOPEN_BOUNTY,HOT\t⚡Best tips for running a profitable lighting node?⚡';
      const result = parseBountyLine(line);

      expect(result).not.toBeNull();
      expect(result.id).toBe(1549793);
      expect(result.currency).toBe('bitcoin');
      expect(result.amount).toBe(5000);
      expect(result.metric1).toBe(18);
      expect(result.metric2).toBe(19.5);
      expect(result.tags).toEqual(['OPEN_BOUNTY', 'HOT']);
      expect(result.title).toBe('⚡Best tips for running a profitable lighting node?⚡');
      expect(result.isOpenBounty).toBe(true);
      expect(result.isHot).toBe(true);
    });

    test('handles title with embedded tabs', () => {
      const line = '12345\tbitcoin\t1000\t5\t3.2\tOPEN_BOUNTY\tHello\tWorld';
      const result = parseBountyLine(line);

      expect(result).not.toBeNull();
      expect(result.id).toBe(12345);
      expect(result.title).toBe('Hello\tWorld');
    });

    test('returns null for empty line', () => {
      expect(parseBountyLine('')).toBeNull();
      expect(parseBountyLine('   ')).toBeNull();
      expect(parseBountyLine(null)).toBeNull();
      expect(parseBountyLine(undefined)).toBeNull();
    });

    test('returns null for line with too few fields', () => {
      const line = '123\tbitcoin\t1000';
      expect(parseBountyLine(line)).toBeNull();
    });

    test('returns null for non-numeric bounty ID', () => {
      const line = 'abc\tbitcoin\t5000\t18\t19.5\tOPEN_BOUNTY\tTest title';
      expect(parseBountyLine(line)).toBeNull();
    });

    test('returns null for zero bounty ID', () => {
      const line = '0\tbitcoin\t5000\t18\t19.5\tOPEN_BOUNTY\tTest title';
      expect(parseBountyLine(line)).toBeNull();
    });

    test('returns null for negative bounty ID', () => {
      const line = '-1\tbitcoin\t5000\t18\t19.5\tOPEN_BOUNTY\tTest title';
      expect(parseBountyLine(line)).toBeNull();
    });

    test('returns null for invalid currency', () => {
      const line = '123\tdollar\t5000\t18\t19.5\tOPEN_BOUNTY\tTest title';
      expect(parseBountyLine(line)).toBeNull();
    });

    test('accepts sats as currency', () => {
      const line = '123\tsats\t5000\t18\t19.5\tOPEN_BOUNTY\tTest title';
      const result = parseBountyLine(line);
      expect(result).not.toBeNull();
      expect(result.currency).toBe('sats');
    });

    test('accepts lightning as currency', () => {
      const line = '123\tlightning\t5000\t18\t19.5\tOPEN_BOUNTY\tTest title';
      const result = parseBountyLine(line);
      expect(result).not.toBeNull();
      expect(result.currency).toBe('lightning');
    });

    test('returns null for negative amount', () => {
      const line = '123\tbitcoin\t-500\t18\t19.5\tOPEN_BOUNTY\tTest title';
      expect(parseBountyLine(line)).toBeNull();
    });

    test('accepts zero amount', () => {
      const line = '123\tbitcoin\t0\t18\t19.5\tOPEN_BOUNTY\tTest title';
      const result = parseBountyLine(line);
      expect(result).not.toBeNull();
      expect(result.amount).toBe(0);
    });

    test('returns null for empty tags', () => {
      const line = '123\tbitcoin\t5000\t18\t19.5\t\tTest title';
      expect(parseBountyLine(line)).toBeNull();
    });

    test('returns null for empty title', () => {
      const line = '123\tbitcoin\t5000\t18\t19.5\tOPEN_BOUNTY\t';
      expect(parseBountyLine(line)).toBeNull();
    });

    test('handles single tag', () => {
      const line = '123\tbitcoin\t5000\t18\t19.5\tOPEN_BOUNTY\tTest title';
      const result = parseBountyLine(line);
      expect(result.tags).toEqual(['OPEN_BOUNTY']);
      expect(result.isOpenBounty).toBe(true);
      expect(result.isHot).toBe(false);
    });

    test('is case-insensitive for currency', () => {
      const line = '123\tBITCOIN\t5000\t18\t19.5\tOPEN_BOUNTY\tTest title';
      const result = parseBountyLine(line);
      expect(result).not.toBeNull();
      expect(result.currency).toBe('bitcoin');
    });

    test('is case-insensitive for OPEN_BOUNTY tag', () => {
      const line = '123\tbitcoin\t5000\t18\t19.5\topen_bounty\tTest title';
      const result = parseBountyLine(line);
      expect(result.isOpenBounty).toBe(true);
    });

    test('is case-insensitive for HOT tag', () => {
      const line = '123\tbitcoin\t5000\t18\t19.5\tOPEN_BOUNTY,hot\tTest title';
      const result = parseBountyLine(line);
      expect(result.isHot).toBe(true);
    });

    test('trims whitespace from fields', () => {
      const line = '  123  \t  bitcoin  \t  5000  \t  18  \t  19.5  \t  OPEN_BOUNTY , HOT  \t  Test title  ';
      const result = parseBountyLine(line);
      expect(result).not.toBeNull();
      expect(result.id).toBe(123);
      expect(result.currency).toBe('bitcoin');
      expect(result.amount).toBe(5000);
      expect(result.metric1).toBe(18);
      expect(result.metric2).toBe(19.5);
      expect(result.tags).toEqual(['OPEN_BOUNTY', 'HOT']);
      expect(result.title).toBe('Test title');
    });

    test('handles title with special characters', () => {
      const line = '123\tbitcoin\t5000\t18\t19.5\tOPEN_BOUNTY\tTest "quotes" & <html> & symbols!';
      const result = parseBountyLine(line);
      expect(result).not.toBeNull();
      expect(result.title).toBe('Test "quotes" & <html> & symbols!');
    });
  });

  describe('parseBountyData', () => {
    test('parses multiple lines', () => {
      const content = [
        '1549793\tbitcoin\t5000\t18\t19.5\tOPEN_BOUNTY,HOT\t⚡Best tips for running a profitable lighting node?⚡',
        '1549794\tbitcoin\t10000\t5\t12.0\tOPEN_BOUNTY\tAnother bounty title'
      ].join('\n');

      const result = parseBountyData(content);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1549793);
      expect(result[1].id).toBe(1549794);
    });

    test('skips invalid lines', () => {
      const content = [
        '1549793\tbitcoin\t5000\t18\t19.5\tOPEN_BOUNTY,HOT\t⚡Best tips for running a profitable lighting node?⚡',
        'invalid line here',
        '1549794\tbitcoin\t10000\t5\t12.0\tOPEN_BOUNTY\tAnother bounty title'
      ].join('\n');

      const result = parseBountyData(content);
      expect(result).toHaveLength(2);
    });

    test('handles empty content', () => {
      expect(parseBountyData('')).toEqual([]);
      expect(parseBountyData(null)).toEqual([]);
      expect(parseBountyData(undefined)).toEqual([]);
    });

    test('handles content with trailing newline', () => {
      const content = '1549793\tbitcoin\t5000\t18\t19.5\tOPEN_BOUNTY,HOT\t⚡Best tips⚡\n';
      const result = parseBountyData(content);
      expect(result).toHaveLength(1);
    });

    test('handles content with multiple trailing newlines', () => {
      const content = '1549793\tbitcoin\t5000\t18\t19.5\tOPEN_BOUNTY,HOT\t⚡Best tips⚡\n\n\n';
      const result = parseBountyData(content);
      expect(result).toHaveLength(1);
    });
  });

  describe('formatBountyIssue', () => {
    test('formats bounty with HOT tag', () => {
      const bounty = {
        id: 1549793,
        currency: 'bitcoin',
        amount: 5000,
        metric1: 18,
        metric2: 19.5,
        tags: ['OPEN_BOUNTY', 'HOT'],
        title: '⚡Best tips for running a profitable lighting node?⚡',
        isOpenBounty: true,
        isHot: true
      };

      const result = formatBountyIssue(bounty);
      expect(result.title).toContain('[radar] SN open bounty');
      expect(result.body).toContain('1549793');
      expect(result.body).toContain('⚡Best tips for running a profitable lighting node?⚡');
      expect(result.body).toContain('HOT');
      expect(result.labels).toContain('radar');
      expect(result.labels).toContain('sn');
      expect(result.labels).toContain('open-bounty');
      expect(result.labels).toContain('hot');
    });

    test('formats bounty without HOT tag', () => {
      const bounty = {
        id: 12345,
        currency: 'bitcoin',
        amount: 1000,
        metric1: 5,
        metric2: 3.2,
        tags: ['OPEN_BOUNTY'],
        title: 'Simple bounty title',
        isOpenBounty: true,
        isHot: false
      };

      const result = formatBountyIssue(bounty);
      expect(result.body).toContain('Simple bounty title');
      expect(result.labels).toContain('radar');
      expect(result.labels).toContain('sn');
      expect(result.labels).toContain('open-bounty');
      expect(result.labels).not.toContain('hot');
    });
  });
});
