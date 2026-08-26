'use strict';

const assert = require('assert');
const {
  BountyParseError,
  parseBountyLine,
  parseBountyLines,
  parseAmount,
  sanitizeField,
  parseTags,
  formatIssueBody,
  formatIssueTitle,
  generateIssueLabels,
} = require('../src/sn-bounty-parser');

describe('sn-bounty-parser', () => {
  describe('sanitizeField', () => {
    it('should remove emoji characters', () => {
      assert.strictEqual(sanitizeField('Hello World'), 'Hello World');
      assert.strictEqual(sanitizeField('Best tips for running a profitable lighting node?'), 'Best tips for running a profitable lighting node?');
    });

    it('should remove lightning emoji (U+26A1)', () => {
      const input = '\u26A1Best tips for running a profitable lighting node?\u26A1';
      const result = sanitizeField(input);
      assert.strictEqual(result, 'Best tips for running a profitable lighting node?');
      assert.ok(!result.includes('\u26A1'));
    });

    it('should remove check mark emoji (U+2705)', () => {
      assert.strictEqual(sanitizeField('\u2705Done'), 'Done');
    });

    it('should remove variation selectors', () => {
      assert.strictEqual(sanitizeField('Test\uFE0F\uFE0F'), 'Test');
    });

    it('should remove zero-width joiner', () => {
      assert.strictEqual(sanitizeField('A\u200DB'), 'AB');
    });

    it('should remove null bytes', () => {
      assert.strictEqual(sanitizeField('A\x00B'), 'AB');
    });

    it('should collapse multiple spaces', () => {
      assert.strictEqual(sanitizeField('a   b    c'), 'a b c');
    });

    it('should handle null/undefined', () => {
      assert.strictEqual(sanitizeField(null), '');
      assert.strictEqual(sanitizeField(undefined), '');
    });
  });

  describe('parseTags', () => {
    it('should parse comma-separated tags', () => {
      assert.deepStrictEqual(parseTags('OPEN_BOUNTY,HOT'), ['OPEN_BOUNTY', 'HOT']);
    });

    it('should handle empty string', () => {
      assert.deepStrictEqual(parseTags(''), []);
    });

    it('should handle single tag', () => {
      assert.deepStrictEqual(parseTags('OPEN_BOUNTY'), ['OPEN_BOUNTY']);
    });

    it('should filter empty tags', () => {
      assert.deepStrictEqual(parseTags('OPEN_BOUNTY,,HOT,'), ['OPEN_BOUNTY', 'HOT']);
    });

    it('should sanitize tags', () => {
      assert.deepStrictEqual(parseTags('OPEN_BOUNTY,\u26A1HOT'), ['OPEN_BOUNTY', 'HOT']);
    });
  });

  describe('parseAmount', () => {
    it('should parse plain integer', () => {
      assert.strictEqual(parseAmount('5000'), 5000);
    });

    it('should parse with commas', () => {
      assert.strictEqual(parseAmount('5,000'), 5000);
    });

    it('should parse decimal', () => {
      assert.strictEqual(parseAmount('19.5'), 20); // rounds
    });

    it('should handle empty', () => {
      assert.strictEqual(parseAmount(''), 0);
      assert.strictEqual(parseAmount(null), 0);
      assert.strictEqual(parseAmount(undefined), 0);
    });

    it('should handle invalid', () => {
      assert.strictEqual(parseAmount('abc'), 0);
    });
  });

  describe('parseBountyLine', () => {
    const issueLine = '1549793\tbitcoin\t5000\t18\t19.5\tOPEN_BOUNTY,HOT\t\u26A1Best tips for running a profitable lighting node?\u26A1';

    it('should parse the issue bounty line correctly', () => {
      const bounty = parseBountyLine(issueLine);
      assert.strictEqual(bounty.id, '1549793');
      assert.strictEqual(bounty.currency, 'bitcoin');
      assert.strictEqual(bounty.amount, 5000);
      assert.strictEqual(bounty.commentCount, 18);
      assert.strictEqual(bounty.satsPaid, 19.5);
      assert.deepStrictEqual(bounty.tags, ['OPEN_BOUNTY', 'HOT']);
      assert.strictEqual(bounty.title, 'Best tips for running a profitable lighting node?');
      assert.strictEqual(bounty.isOpenBounty, true);
      assert.strictEqual(bounty.isHot, true);
    });

    it('should compute satsRemaining', () => {
      const bounty = parseBountyLine(issueLine);
      assert.strictEqual(bounty.satsRemaining, 4981); // 5000 - 19.5 rounded
    });

    it('should have a parsedAt ISO string', () => {
      const bounty = parseBountyLine(issueLine);
      assert.ok(bounty.parsedAt);
      assert.strictEqual(typeof bounty.parsedAt, 'string');
      assert.ok(!Number.isNaN(Date.parse(bounty.parsedAt)));
    });

    it('should throw on empty line', () => {
      assert.throws(() => parseBountyLine(''), BountyParseError);
    });

    it('should throw on null', () => {
      assert.throws(() => parseBountyLine(null), BountyParseError);
    });

    it('should throw on too few fields', () => {
      assert.throws(() => parseBountyLine('123\tbtc\t5000'), BountyParseError);
    });

    it('should handle title with embedded tabs', () => {
      const line = '999\tbitcoin\t1000\t5\t0\tOPEN_BOUNTY\tHello\tWorld';
      const bounty = parseBountyLine(line);
      assert.strictEqual(bounty.title, 'Hello World'); // tabs replaced with spaces via sanitize
    });

    it('should handle missing tags field', () => {
      const line = '999\tbitcoin\t1000\t5\t0\t\tSome title';
      const bounty = parseBountyLine(line);
      assert.deepStrictEqual(bounty.tags, []);
      assert.strictEqual(bounty.isOpenBounty, false);
    });

    it('should handle closed bounty', () => {
      const line = '888\tbitcoin\t2000\t10\t2000\tCLOSED_BOUNTY\tDone deal';
      const bounty = parseBountyLine(line);
      assert.strictEqual(bounty.isOpenBounty, false);
      assert.strictEqual(bounty.satsRemaining, 0);
    });
  });

  describe('parseBountyLines', () => {
    it('should parse multiple lines', () => {
      const text = [
        '1549793\tbitcoin\t5000\t18\t19.5\tOPEN_BOUNTY,HOT\tBest tips',
        '1549794\tbitcoin\t3000\t5\t0\tOPEN_BOUNTY\tAnother bounty',
      ].join('\n');
      const bounties = parseBountyLines(text);
      assert.strictEqual(bounties.length, 2);
      assert.strictEqual(bounties[0].id, '1549793');
      assert.strictEqual(bounties[1].id, '1549794');
    });

    it('should skip empty lines and comments', () => {
      const text = [
        '# comment line',
        '',
        '1549793\tbitcoin\t5000\t18\t19.5\tOPEN_BOUNTY,HOT\tBest tips',
        '',
        '// another comment',
      ].join('\n');
      const bounties = parseBountyLines(text);
      assert.strictEqual(bounties.length, 1);
    });

    it('should skip errors by default', () => {
      const text = [
        'bad line',
        '1549793\tbitcoin\t5000\t18\t19.5\tOPEN_BOUNTY,HOT\tBest tips',
      ].join('\n');
      const bounties = parseBountyLines(text);
      assert.strictEqual(bounties.length, 1);
    });

    it('should throw on errors when skipErrors=false', () => {
      const text = 'bad line';
      assert.throws(() => parseBountyLines(text, { skipErrors: false }), BountyParseError);
    });

    it('should handle empty/null input', () => {
      assert.deepStrictEqual(parseBountyLines(''), []);
      assert.deepStrictEqual(parseBountyLines(null), []);
    });
  });

  describe('formatIssueBody', () => {
    it('should generate valid markdown', () => {
      const bounty = parseBountyLine('1549793\tbitcoin\t5000\t18\t19.5\tOPEN_BOUNTY,HOT\tBest tips');
      const body = formatIssueBody(bounty);
      assert.ok(body.includes('## SN Bounty #1549793'));
      assert.ok(body.includes('5000 sats'));
      assert.ok(body.includes('OPEN'));
    });

    it('should return empty for invalid bounty', () => {
      assert.strictEqual(formatIssueBody({}), '');
      assert.strictEqual(formatIssueBody(null), '');
    });
  });

  describe('formatIssueTitle', () => {
    it('should format open bounty title', () => {
      const bounty = parseBountyLine('1549793\tbitcoin\t5000\t18\t19.5\tOPEN_BOUNTY,HOT\tBest tips for running a profitable lighting node?');
      const title = formatIssueTitle(bounty);
      assert.ok(title.includes('[radar]'));
      assert.ok(title.includes('OPEN_BOUNTY'));
      assert.ok(title.includes('#1549793'));
      assert.ok(title.includes('Best tips'));
    });

    it('should truncate long titles', () => {
      const longTitle = 'A'.repeat(120);
      const bounty = parseBountyLine(`999\tbitcoin\t1000\t0\t0\tOPEN_BOUNTY\t${longTitle}`);
      const title = formatIssueTitle(bounty);
      assert.ok(title.length < 150);
      assert.ok(title.endsWith('...'));
    });
  });

  describe('generateIssueLabels', () => {
    it('should generate labels for open hot bitcoin bounty', () => {
      const bounty = parseBountyLine('1549793\tbitcoin\t5000\t18\t19.5\tOPEN_BOUNTY,HOT\tBest tips');
      const labels = generateIssueLabels(bounty);
      assert.ok(labels.includes('radar'));
      assert.ok(labels.includes('sn'));
      assert.ok(labels.includes('open-bounty'));
      assert.ok(labels.includes('hot'));
      assert.ok(labels.includes('bitcoin'));
      assert.ok(labels.includes('funded'));
    });

    it('should not include funded label for zero remaining', () => {
      const bounty = parseBountyLine('888\tbitcoin\t2000\t10\t2000\tCLOSED_BOUNTY\tDone');
      const labels = generateIssueLabels(bounty);
      assert.ok(!labels.includes('funded'));
      assert.ok(!labels.includes('open-bounty'));
    });
  });
});
