const {
  parseBountyLine,
  constructBounty,
  categorizeBounty,
  generateResponse,
  generateLightningNodeTips,
  processBounty,
  BOUNTY_FIELDS
} = require('./bounty-handler');

describe('bounty-handler', () => {
  const SAMPLE_LINE = '1549793\tbitcoin\t5000\t18\t19.8\tOPEN_BOUNTY,HOT\tBest tips for running a profitable lighting node?';

  describe('parseBountyLine', () => {
    test('parses a valid tab-separated bounty line', () => {
      const result = parseBountyLine(SAMPLE_LINE);
      expect(result).not.toBeNull();
      expect(result.id).toBe(1549793);
      expect(result.currency).toBe('bitcoin');
      expect(result.amount).toBe(5000);
      expect(result.upvotes).toBe(18);
      expect(result.rank).toBe(19.8);
      expect(result.tags).toEqual(['OPEN_BOUNTY', 'HOT']);
      expect(result.title).toBe('Best tips for running a profitable lighting node?');
      expect(result.isOpen).toBe(true);
      expect(result.isHot).toBe(true);
    });

    test('handles titles with embedded tabs', () => {
      const line = '100\tbitcoin\t1000\t5\t10.5\tOPEN_BOUNTY\tSome\ttitle\twith\ttabs';
      const result = parseBountyLine(line);
      expect(result).not.toBeNull();
      expect(result.id).toBe(100);
      expect(result.title).toBe('Some\ttitle\twith\ttabs');
    });

    test('returns null for empty input', () => {
      expect(parseBountyLine('')).toBeNull();
      expect(parseBountyLine('   ')).toBeNull();
      expect(parseBountyLine(null)).toBeNull();
      expect(parseBountyLine(undefined)).toBeNull();
    });

    test('returns null for insufficient fields', () => {
      expect(parseBountyLine('100\tbitcoin\t1000')).toBeNull();
    });

    test('returns null for invalid ID', () => {
      const line = 'abc\tbitcoin\t1000\t5\t10.5\tOPEN_BOUNTY\tSome title';
      expect(parseBountyLine(line)).toBeNull();
    });

    test('returns null for negative amount', () => {
      const line = '100\tbitcoin\t-1000\t5\t10.5\tOPEN_BOUNTY\tSome title';
      expect(parseBountyLine(line)).toBeNull();
    });

    test('returns null for empty title', () => {
      const line = '100\tbitcoin\t1000\t5\t10.5\tOPEN_BOUNTY\t';
      expect(parseBountyLine(line)).toBeNull();
    });
  });

  describe('categorizeBounty', () => {
    test('categorizes lightning node bounties', () => {
      const bounty = parseBountyLine(SAMPLE_LINE);
      expect(categorizeBounty(bounty)).toBe('lightning_node');
    });

    test('categorizes lightning with typo (lighting)', () => {
      const line = '1\tbitcoin\t100\t1\t1\tOPEN_BOUNTY\tprofitable lighting node?';
      const bounty = parseBountyLine(line);
      expect(categorizeBounty(bounty)).toBe('lightning_node');
    });

    test('categorizes bitcoin bounties', () => {
      const line = '1\tbitcoin\t100\t1\t1\tOPEN_BOUNTY\tBest bitcoin mining setup';
      const bounty = parseBountyLine(line);
      expect(categorizeBounty(bounty)).toBe('bitcoin');
    });

    test('categorizes nostr bounties', () => {
      const line = '1\tbitcoin\t100\t1\t1\tOPEN_BOUNTY\tSetting up a nostr relay';
      const bounty = parseBountyLine(line);
      expect(categorizeBounty(bounty)).toBe('nostr');
    });

    test('categorizes coding bounties', () => {
      const line = '1\tbitcoin\t100\t1\t1\tOPEN_BOUNTY\tBest programming languages 2026';
      const bounty = parseBountyLine(line);
      expect(categorizeBounty(bounty)).toBe('coding');
    });

    test('defaults to general', () => {
      const line = '1\tbitcoin\t100\t1\t1\tOPEN_BOUNTY\tBest restaurants in Tokyo';
      const bounty = parseBountyLine(line);
      expect(categorizeBounty(bounty)).toBe('general');
    });
  });

  describe('generateLightningNodeTips', () => {
    test('generates comprehensive lightning node tips', () => {
      const bounty = parseBountyLine(SAMPLE_LINE);
      const tips = generateLightningNodeTips(bounty);
      
      expect(tips).toContain('Lightning Network node');
      expect(tips).toContain('Channel Selection');
      expect(tips).toContain('Liquidity Management');
      expect(tips).toContain('Fee Strategy');
      expect(tips).toContain('Automation');
      expect(tips).toContain('Reliability');
      expect(tips).toContain('Cost Management');
      expect(tips).toContain('Backup');
      expect(tips.length).toBeGreaterThan(500);
    });
  });

  describe('generateResponse', () => {
    test('generates response for lightning_node category', () => {
      const bounty = parseBountyLine(SAMPLE_LINE);
      const response = generateResponse(bounty);
      expect(response).toContain('Lightning Network node');
    });

    test('generates response for general category', () => {
      const line = '1\tbitcoin\t100\t1\t1\tOPEN_BOUNTY\tBest restaurants';
      const bounty = parseBountyLine(line);
      const response = generateResponse(bounty);
      expect(response).toContain('Tips for');
    });
  });

  describe('processBounty', () => {
    test('processes a valid open bounty successfully', () => {
      const result = processBounty(SAMPLE_LINE);
      expect(result.status).toBe('success');
      expect(result.bounty.id).toBe(1549793);
      expect(result.category).toBe('lightning_node');
      expect(result.response).toContain('Lightning Network');
    });

    test('skips non-open bounties', () => {
      const line = '1\tbitcoin\t100\t1\t1\tCLOSED\tSome title';
      const result = processBounty(line);
      expect(result.status).toBe('skipped');
      expect(result.reason).toContain('not open');
    });

    test('returns error for invalid input', () => {
      const result = processBounty('invalid');
      expect(result.status).toBe('error');
    });

    test('returns error for null input', () => {
      const result = processBounty(null);
      expect(result.status).toBe('error');
    });
  });

  describe('BOUNTY_FIELDS', () => {
    test('contains all expected fields', () => {
      expect(BOUNTY_FIELDS).toEqual(['id', 'currency', 'amount', 'upvotes', 'rank', 'tags', 'title']);
    });
  });
});
