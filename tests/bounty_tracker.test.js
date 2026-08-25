const assert = require('assert');
const { processBountyData, formatBounty } = require('../src/processors/bounty_tracker');

describe('Bounty Tracker', () => {
  const sampleData = [
    '1548616\tbitcoin\t1000\t14\t7.2\tOPEN_BOUNTY\tAsking \u{1F914} the stackers \u26A1',
    '1548617\tsats\t500\t2\t1.0\tCLOSED_BOUNTY\tResolved',
    '1548618\tlightning\t250\t3\t1.5\tCANCELLED_BOUNTY\tCancelled',
    '1548619\tbitcoin\t2000\t5\t10.0\tOPEN_BOUNTY\tAnother open bounty'
  ].join('\n');

  describe('processBountyData', () => {
    it('should correctly categorize bounties by status', () => {
      const result = processBountyData(sampleData);

      assert.strictEqual(result.openBounties.length, 2);
      assert.strictEqual(result.closedBounties.length, 1);
      assert.strictEqual(result.cancelledBounties.length, 1);
      assert.strictEqual(result.parseErrors.length, 0);
      assert.strictEqual(result.totalParsed, 4);
    });

    it('should correctly identify the SN bounty from issue #619', () => {
      const data = '1548616\tbitcoin\t1000\t14\t7.2\tOPEN_BOUNTY\tAsking \u{1F914} the stackers \u26A1';
      const result = processBountyData(data);

      assert.strictEqual(result.openBounties.length, 1);
      const bounty = result.openBounties[0];
      assert.strictEqual(bounty.id, 1548616);
      assert.strictEqual(bounty.token, 'bitcoin');
      assert.strictEqual(bounty.amount, 1000);
      assert.strictEqual(bounty.count, 14);
      assert.strictEqual(bounty.value, 7.2);
      assert.strictEqual(bounty.status, 'OPEN_BOUNTY');
      assert.strictEqual(bounty.description, 'Asking \u{1F914} the stackers \u26A1');
    });

    it('should handle empty input gracefully', () => {
      assert.throws(() => processBountyData(''), /All lines failed/);
    });

    it('should handle malformed lines and still process valid ones', () => {
      const data = [
        '1548616\tbitcoin\t1000\t14\t7.2\tOPEN_BOUNTY\tValid bounty',
        'bad line',
        '1548619\tbitcoin\t2000\t5\t10.0\tOPEN_BOUNTY\tAlso valid'
      ].join('\n');

      const result = processBountyData(data);
      assert.strictEqual(result.openBounties.length, 2);
      assert.strictEqual(result.parseErrors.length, 1);
    });
  });

  describe('formatBounty', () => {
    it('should format a bounty for display', () => {
      const bounty = {
        id: 1548616,
        token: 'bitcoin',
        amount: 1000,
        count: 14,
        value: 7.2,
        status: 'OPEN_BOUNTY',
        description: 'Asking \u{1F914} the stackers \u26A1'
      };

      const formatted = formatBounty(bounty);
      assert.strictEqual(formatted, '[1548616] 1000 bitcoin | OPEN_BOUNTY | Asking \u{1F914} the stackers \u26A1');
    });
  });
});
