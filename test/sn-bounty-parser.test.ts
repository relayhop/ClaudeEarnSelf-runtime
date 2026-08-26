import {
  parseSNBountyLine,
  parseSNBountyLines,
  formatBountyForIssue,
  isOpenBountyLine,
  isHotBountyLine,
  getBountyAmount,
  getBountyId,
} from '../src/lib/sn-bounty-parser';

describe('SN Bounty Parser', () => {
  const SAMPLE_LINE =
    '1549793\tbitcoin\t5000\t18\t17.8\tOPEN_BOUNTY,HOT\t\u26A1Best tips for running a profitable lighting node?\u26A1';

  describe('parseSNBountyLine', () => {
    it('parses a valid bounty line with emoji title', () => {
      const result = parseSNBountyLine(SAMPLE_LINE);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(1549793);
      expect(result!.currency).toBe('bitcoin');
      expect(result!.amount).toBe(5000);
      expect(result!.commentCount).toBe(18);
      expect(result!.score).toBe(17.8);
      expect(result!.tags).toEqual(['OPEN_BOUNTY', 'HOT']);
      expect(result!.title).toBe(
        '\u26A1Best tips for running a profitable lighting node?\u26A1'
      );
      expect(result!.status).toBe('OPEN');
      expect(result!.isHot).toBe(true);
      expect(result!.isOpen).toBe(true);
    });

    it('handles emoji in title', () => {
      const line =
        '999\tbitcoin\t1000\t5\t3.2\tOPEN_BOUNTY\t\uD83D\uDE80To the moon!\uD83D\uDE80';
      const result = parseSNBountyLine(line);
      expect(result).not.toBeNull();
      expect(result!.title).toBe('\uD83D\uDE80To the moon!\uD83D\uDE80');
    });

    it('handles multiple comma-separated tags', () => {
      const line =
        '888\tbitcoin\t2000\t3\t1.5\tOPEN_BOUNTY,HOT,URGENT\tTest';
      const result = parseSNBountyLine(line);
      expect(result!.tags).toEqual(['OPEN_BOUNTY', 'HOT', 'URGENT']);
    });

    it('handles tags with spaces after comma', () => {
      const line =
        '887\tbitcoin\t2000\t3\t1.5\tOPEN_BOUNTY, HOT\tTest';
      const result = parseSNBountyLine(line);
      expect(result!.tags).toEqual(['OPEN_BOUNTY', 'HOT']);
    });

    it('handles decimal scores', () => {
      const line =
        '777\tbitcoin\t3000\t10\t22.75\tOPEN_BOUNTY\tTest';
      const result = parseSNBountyLine(line);
      expect(result!.score).toBe(22.75);
    });

    it('handles integer scores', () => {
      const line =
        '776\tbitcoin\t3000\t10\t15\tOPEN_BOUNTY\tTest';
      const result = parseSNBountyLine(line);
      expect(result!.score).toBe(15);
    });

    it('handles closed bounties', () => {
      const line =
        '555\tbitcoin\t1000\t5\t3.2\tCLOSED_BOUNTY\tTest';
      const result = parseSNBountyLine(line);
      expect(result!.status).toBe('CLOSED');
      expect(result!.isOpen).toBe(false);
    });

    it('handles expired bounties', () => {
      const line =
        '554\tbitcoin\t1000\t5\t3.2\tEXPIRED_BOUNTY\tTest';
      const result = parseSNBountyLine(line);
      expect(result!.status).toBe('EXPIRED');
      expect(result!.isOpen).toBe(false);
    });

    it('handles missing comment count gracefully', () => {
      const line =
        '444\tbitcoin\t1000\tabc\t3.2\tOPEN_BOUNTY\tTest';
      const result = parseSNBountyLine(line);
      expect(result!.commentCount).toBe(0);
    });

    it('handles missing score gracefully', () => {
      const line =
        '333\tbitcoin\t1000\t5\tabc\tOPEN_BOUNTY\tTest';
      const result = parseSNBountyLine(line);
      expect(result!.score).toBe(0);
    });

    it('handles empty tags', () => {
      const line = '222\tbitcoin\t1000\t5\t3.2\t\tTest';
      const result = parseSNBountyLine(line);
      expect(result!.tags).toEqual([]);
      expect(result!.isHot).toBe(false);
    });

    it('handles title with embedded tabs', () => {
      const line =
        '111\tbitcoin\t1000\t5\t3.2\tOPEN_BOUNTY\tTitle\twith\ttabs';
      const result = parseSNBountyLine(line);
      expect(result!.title).toBe('Title\twith\ttabs');
    });

    it('handles CRLF line endings', () => {
      const line =
        '100\tbitcoin\t500\t2\t1.0\tOPEN_BOUNTY\tTest\r\n';
      const result = parseSNBountyLine(line);
      expect(result).not.toBeNull();
      expect(result!.title).toBe('Test');
    });

    it('handles whitespace-only line', () => {
      expect(parseSNBountyLine('   ')).toBeNull();
    });

    it('returns null for empty input', () => {
      expect(parseSNBountyLine('')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(parseSNBountyLine(null as any)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(parseSNBountyLine(undefined as any)).toBeNull();
    });

    it('returns null for insufficient fields', () => {
      expect(parseSNBountyLine('123\tbitcoin\t1000')).toBeNull();
    });

    it('returns null for invalid ID', () => {
      expect(
        parseSNBountyLine('abc\tbitcoin\t1000\t5\t3.2\tOPEN_BOUNTY\tTest')
      ).toBeNull();
    });

    it('returns null for negative ID', () => {
      expect(
        parseSNBountyLine('-1\tbitcoin\t1000\t5\t3.2\tOPEN_BOUNTY\tTest')
      ).toBeNull();
    });

    it('returns null for zero ID', () => {
      expect(
        parseSNBountyLine('0\tbitcoin\t1000\t5\t3.2\tOPEN_BOUNTY\tTest')
      ).toBeNull();
    });

    it('returns null for negative amount', () => {
      expect(
        parseSNBountyLine('100\tbitcoin\t-100\t5\t3.2\tOPEN_BOUNTY\tTest')
      ).toBeNull();
    });

    it('returns null for empty currency', () => {
      expect(
        parseSNBountyLine('100\t\t1000\t5\t3.2\tOPEN_BOUNTY\tTest')
      ).toBeNull();
    });

    it('handles zero amount', () => {
      const line =
        '200\tbitcoin\t0\t5\t3.2\tOPEN_BOUNTY\tTest';
      const result = parseSNBountyLine(line);
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(0);
    });

    it('handles large bounty amounts', () => {
      const line =
        '201\tbitcoin\t1000000\t5\t3.2\tOPEN_BOUNTY\tTest';
      const result = parseSNBountyLine(line);
      expect(result!.amount).toBe(1000000);
    });
  });

  describe('parseSNBountyLines', () => {
    it('parses multiple lines', () => {
      const text = [
        '111\tbitcoin\t1000\t5\t3.2\tOPEN_BOUNTY\tTest 1',
        '222\tbitcoin\t2000\t10\t5.5\tOPEN_BOUNTY,HOT\tTest 2',
      ].join('\n');
      const results = parseSNBountyLines(text);
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe(111);
      expect(results[1].id).toBe(222);
    });

    it('skips empty lines', () => {
      const text = [
        '111\tbitcoin\t1000\t5\t3.2\tOPEN_BOUNTY\tTest 1',
        '',
        '   ',
        '222\tbitcoin\t2000\t10\t5.5\tOPEN_BOUNTY,HOT\tTest 2',
      ].join('\n');
      const results = parseSNBountyLines(text);
      expect(results).toHaveLength(2);
    });

    it('handles CRLF', () => {
      const text =
        '111\tbitcoin\t1000\t5\t3.2\tOPEN_BOUNTY\tTest 1\r\n222\tbitcoin\t2000\t10\t5.5\tOPEN_BOUNTY,HOT\tTest 2\r\n';
      const results = parseSNBountyLines(text);
      expect(results).toHaveLength(2);
    });

    it('returns empty array for empty input', () => {
      expect(parseSNBountyLines('')).toEqual([]);
      expect(parseSNBountyLines(null as any)).toEqual([]);
    });

    it('returns empty array for whitespace-only input', () => {
      expect(parseSNBountyLines('   \n   \n   ')).toEqual([]);
    });

    it('filters out invalid lines while keeping valid ones', () => {
      const text = [
        '111\tbitcoin\t1000\t5\t3.2\tOPEN_BOUNTY\tTest 1',
        'invalid line',
        '222\tbitcoin\t2000\t10\t5.5\tOPEN_BOUNTY,HOT\tTest 2',
      ].join('\n');
      const results = parseSNBountyLines(text);
      expect(results).toHaveLength(2);
    });
  });

  describe('formatBountyForIssue', () => {
    it('formats bounty back to TSV', () => {
      const bounty = parseSNBountyLine(SAMPLE_LINE)!;
      const formatted = formatBountyForIssue(bounty);
      expect(formatted).toBe(SAMPLE_LINE);
    });

    it('formats bounty with empty tags', () => {
      const bounty = parseSNBountyLine(
        '222\tbitcoin\t1000\t5\t3.2\t\tTest'
      )!;
      const formatted = formatBountyForIssue(bounty);
      expect(formatted).toBe('222\tbitcoin\t1000\t5\t3.2\t\tTest');
    });
  });

  describe('isOpenBountyLine', () => {
    it('returns true for open bounties', () => {
      expect(isOpenBountyLine(SAMPLE_LINE)).toBe(true);
    });

    it('returns false for closed bounties', () => {
      expect(
        isOpenBountyLine('555\tbitcoin\t1000\t5\t3.2\tCLOSED_BOUNTY\tTest')
      ).toBe(false);
    });

    it('returns false for expired bounties', () => {
      expect(
        isOpenBountyLine('554\tbitcoin\t1000\t5\t3.2\tEXPIRED_BOUNTY\tTest')
      ).toBe(false);
    });

    it('returns false for invalid lines', () => {
      expect(isOpenBountyLine('')).toBe(false);
      expect(isOpenBountyLine('invalid')).toBe(false);
      expect(isOpenBountyLine(null as any)).toBe(false);
    });
  });

  describe('isHotBountyLine', () => {
    it('returns true for hot bounties', () => {
      expect(isHotBountyLine(SAMPLE_LINE)).toBe(true);
    });

    it('returns false for non-hot bounties', () => {
      expect(
        isHotBountyLine('555\tbitcoin\t1000\t5\t3.2\tOPEN_BOUNTY\tTest')
      ).toBe(false);
    });

    it('returns false for invalid lines', () => {
      expect(isHotBountyLine('')).toBe(false);
      expect(isHotBountyLine('invalid')).toBe(false);
    });
  });

  describe('getBountyAmount', () => {
    it('returns the bounty amount', () => {
      expect(getBountyAmount(SAMPLE_LINE)).toBe(5000);
    });

    it('returns 0 for invalid lines', () => {
      expect(getBountyAmount('')).toBe(0);
      expect(getBountyAmount('invalid')).toBe(0);
    });
  });

  describe('getBountyId', () => {
    it('returns the bounty ID', () => {
      expect(getBountyId(SAMPLE_LINE)).toBe(1549793);
    });

    it('returns null for invalid lines', () => {
      expect(getBountyId('')).toBeNull();
      expect(getBountyId('invalid')).toBeNull();
    });
  });
});
