const assert = require('assert');
const { parseBountyLine, parseBountyData } = require('../src/parsers/sn_bounty_parser');

describe('SN Bounty Parser', () => {
  describe('parseBountyLine', () => {
    it('should parse a valid bounty line with emoji description', () => {
      const line = '1548616\tbitcoin\t1000\t14\t7.2\tOPEN_BOUNTY\tAsking \u{1F914} the stackers \u26A1';
      const result = parseBountyLine(line);

      assert.strictEqual(result.id, 1548616);
      assert.strictEqual(result.token, 'bitcoin');
      assert.strictEqual(result.amount, 1000);
      assert.strictEqual(result.count, 14);
      assert.strictEqual(result.value, 7.2);
      assert.strictEqual(result.status, 'OPEN_BOUNTY');
      assert.strictEqual(result.description, 'Asking \u{1F914} the stackers \u26A1');
    });

    it('should handle description with tabs by joining remaining parts', () => {
      const line = '100\tbitcoin\t500\t3\t2.5\tOPEN_BOUNTY\tHello\tWorld\tExtra';
      const result = parseBountyLine(line);
      assert.strictEqual(result.description, 'Hello\tWorld\tExtra');
    });

    it('should throw on empty line', () => {
      assert.throws(() => parseBountyLine(''), /Empty bounty line/);
      assert.throws(() => parseBountyLine('   '), /Empty bounty line/);
    });

    it('should throw on non-string input', () => {
      assert.throws(() => parseBountyLine(123), /Input must be a string/);
      assert.throws(() => parseBountyLine(null), /Input must be a string/);
      assert.throws(() => parseBountyLine(undefined), /Input must be a string/);
    });

    it('should throw on insufficient fields', () => {
      assert.throws(
        () => parseBountyLine('123\tbitcoin\t100'),
        /Expected at least 7 tab-separated fields, got 3/
      );
    });

    it('should throw on invalid ID', () => {
      assert.throws(() => parseBountyLine('abc\tbitcoin\t100\t1\t1.0\tOPEN_BOUNTY\tDesc'), /Invalid bounty ID/);
      assert.throws(() => parseBountyLine('-1\tbitcoin\t100\t1\t1.0\tOPEN_BOUNTY\tDesc'), /Invalid bounty ID/);
      assert.throws(() => parseBountyLine('0\tbitcoin\t100\t1\t1.0\tOPEN_BOUNTY\tDesc'), /Invalid bounty ID/);
    });

    it('should throw on invalid token', () => {
      assert.throws(() => parseBountyLine('1\tdogecoin\t100\t1\t1.0\tOPEN_BOUNTY\tDesc'), /Invalid token/);
    });

    it('should throw on invalid amount', () => {
      assert.throws(() => parseBountyLine('1\tbitcoin\tabc\t1\t1.0\tOPEN_BOUNTY\tDesc'), /Invalid amount/);
      assert.throws(() => parseBountyLine('1\tbitcoin\t-5\t1\t1.0\tOPEN_BOUNTY\tDesc'), /Invalid amount/);
      assert.throws(() => parseBountyLine('1\tbitcoin\t0\t1\t1.0\tOPEN_BOUNTY\tDesc'), /Invalid amount/);
    });

    it('should throw on invalid count', () => {
      assert.throws(() => parseBountyLine('1\tbitcoin\t100\t-1\t1.0\tOPEN_BOUNTY\tDesc'), /Invalid count/);
    });

    it('should allow count of zero', () => {
      const line = '200\tsats\t500\t0\t0\tOPEN_BOUNTY\tNo stackers yet';
      const result = parseBountyLine(line);
      assert.strictEqual(result.count, 0);
    });

    it('should throw on invalid value', () => {
      assert.throws(() => parseBountyLine('1\tbitcoin\t100\t1\tabc\tOPEN_BOUNTY\tDesc'), /Invalid value/);
      assert.throws(() => parseBountyLine('1\tbitcoin\t100\t1\t-1\tOPEN_BOUNTY\tDesc'), /Invalid value/);
    });

    it('should throw on invalid status', () => {
      assert.throws(() => parseBountyLine('1\tbitcoin\t100\t1\t1.0\tPENDING\tDesc'), /Invalid status/);
    });

    it('should throw on empty description', () => {
      const line = '300\tbitcoin\t1000\t5\t3.5\tOPEN_BOUNTY\t';
      assert.throws(() => parseBountyLine(line), /Empty description field/);
    });

    it('should handle lightning token', () => {
      const line = '400\tlightning\t250\t2\t1.0\tCLOSED_BOUNTY\tDone deal';
      const result = parseBountyLine(line);
      assert.strictEqual(result.token, 'lightning');
      assert.strictEqual(result.status, 'CLOSED_BOUNTY');
    });

    it('should handle cancelled bounty status', () => {
      const line = '500\tsats\t100\t1\t0.5\tCANCELLED_BOUNTY\tCancelled by poster';
      const result = parseBountyLine(line);
      assert.strictEqual(result.status, 'CANCELLED_BOUNTY');
    });
  });

  describe('parseBountyData', () => {
    it('should parse multiple lines', () => {
      const data = [
        '1548616\tbitcoin\t1000\t14\t7.2\tOPEN_BOUNTY\tAsking \u{1F914} the stackers \u26A1',
        '1548617\tsats\t500\t2\t1.0\tCLOSED_BOUNTY\tResolved'
      ].join('\n');

      const { bounties, errors } = parseBountyData(data);
      assert.strictEqual(bounties.length, 2);
      assert.strictEqual(errors.length, 0);
      assert.strictEqual(bounties[0].id, 1548616);
      assert.strictEqual(bounties[1].id, 1548617);
    });

    it('should skip empty lines', () => {
      const data = '100\tbitcoin\t100\t1\t1.0\tOPEN_BOUNTY\tDesc\n\n\n200\tsats\t200\t2\t2.0\tOPEN_BOUNTY\tDesc2';
      const { bounties, errors } = parseBountyData(data);
      assert.strictEqual(bounties.length, 2);
      assert.strictEqual(errors.length, 0);
    });

    it('should collect errors but still return valid bounties', () => {
      const data = [
        '100\tbitcoin\t100\t1\t1.0\tOPEN_BOUNTY\tValid',
        'abc\tinvalid\t100\t1\t1.0\tOPEN_BOUNTY\tInvalid',
        '200\tsats\t200\t2\t2.0\tOPEN_BOUNTY\tAlso valid'
      ].join('\n');

      const { bounties, errors } = parseBountyData(data);
      assert.strictEqual(bounties.length, 2);
      assert.strictEqual(errors.length, 1);
      assert.strictEqual(errors[0].line, 2);
    });

    it('should throw if all lines fail', () => {
      const data = 'invalid data';
      assert.throws(() => parseBountyData(data), /All lines failed/);
    });

    it('should throw on non-string input', () => {
      assert.throws(() => parseBountyData(null), /Input must be a string/);
      assert.throws(() => parseBountyData(123), /Input must be a string/);
    });
  });
});
