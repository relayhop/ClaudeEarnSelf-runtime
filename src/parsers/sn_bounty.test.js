'use strict';

var assert = require('assert');
var snBounty = require('./sn_bounty');

var parseBountyLine = snBounty.parseBountyLine;
var parseBountyData = snBounty.parseBountyData;
var serializeBounty = snBounty.serializeBounty;


describe('sn_bounty parser', function () {

  describe('parseBountyLine', function () {

    it('should parse a valid bounty line with all fields including emoji and float rate', function () {
      var line = '1549793\tbitcoin\t5000\t17\t15.8\tOPEN_BOUNTY,HOT\t⚡Best tips for running a profitable lighting node?⚡';
      var result = parseBountyLine(line);

      assert.strictEqual(result.id, 1549793);
      assert.strictEqual(result.currency, 'bitcoin');
      assert.strictEqual(result.amount, 5000);
      assert.strictEqual(result.count, 17);
      assert.strictEqual(result.rate, 15.8);
      assert.deepStrictEqual(result.tags, ['HOT', 'OPEN_BOUNTY']);
      assert.strictEqual(result.title, '⚡Best tips for running a profitable lighting node?⚡');
      assert.strictEqual(result.isOpenBounty, true);
      assert.strictEqual(result.isHot, true);
      assert.strictEqual(result.usdValue, 79000);
    });

    it('should parse rate as float, not truncate to int', function () {
      var line = '100\tbitcoin\t1000\t5\t0.5\tOPEN_BOUNTY\tHalf rate';
      var result = parseBountyLine(line);
      assert.strictEqual(result.rate, 0.5);
      assert.strictEqual(result.usdValue, 500);
    });

    it('should handle rate of 15.8 without losing the decimal', function () {
      var line = '200\tbitcoin\t100\t1\t15.8\tOPEN_BOUNTY\tTest';
      var result = parseBountyLine(line);
      assert.strictEqual(result.rate, 15.8);
      assert.strictEqual(result.usdValue, 1580);
    });

    it('should handle emoji at start and end of title', function () {
      var line = '300\tbitcoin\t3000\t3\t3.0\tHOT\t⚡Lightning tips⚡';
      var result = parseBountyLine(line);
      assert.strictEqual(result.title, '⚡Lightning tips⚡');
    });

    it('should handle multiple emoji in title', function () {
      var line = '301\tbitcoin\t3000\t3\t3.0\tHOT\t⚡🚀Best tips for running a profitable lighting node?⚡🚀';
      var result = parseBountyLine(line);
      assert.strictEqual(result.title, '⚡🚀Best tips for running a profitable lighting node?⚡🚀');
    });

    it('should rejoin title fields that contain tab characters', function () {
      var line = '400\tbitcoin\t4000\t4\t4.0\tOPEN_BOUNTY\tPart 1\tPart 2';
      var result = parseBountyLine(line);
      assert.strictEqual(result.title, 'Part 1\tPart 2');
    });

    it('should parse comma-separated tags into an array', function () {
      var line = '500\tbitcoin\t5000\t5\t5.0\tOPEN_BOUNTY,HOT,URGENT\tTitle';
      var result = parseBountyLine(line);
      assert.deepStrictEqual(result.tags, ['HOT', 'OPEN_BOUNTY', 'URGENT']);
    });

    it('should trim whitespace in tags', function () {
      var line = '600\tbitcoin\t6000\t6\t6.0\t OPEN_BOUNTY , HOT \tTitle';
      var result = parseBountyLine(line);
      assert.deepStrictEqual(result.tags, ['HOT', 'OPEN_BOUNTY']);
    });

    it('should handle empty tags field', function () {
      var line = '700\tbitcoin\t7000\t7\t7.0\t\tNo tags';
      var result = parseBountyLine(line);
      assert.deepStrictEqual(result.tags, []);
      assert.strictEqual(result.isOpenBounty, false);
      assert.strictEqual(result.isHot, false);
    });

    it('should return null for null input', function () {
      assert.strictEqual(parseBountyLine(null), null);
    });

    it('should return null for undefined input', function () {
      assert.strictEqual(parseBountyLine(undefined), null);
    });

    it('should return null for empty string', function () {
      assert.strictEqual(parseBountyLine(''), null);
    });

    it('should return null for whitespace-only string', function () {
      assert.strictEqual(parseBountyLine('   \t\t  '), null);
    });

    it('should return null for line with too few fields', function () {
      assert.strictEqual(parseBountyLine('100\tbitcoin\t1000'), null);
    });

    it('should return null for non-numeric id', function () {
      var line = 'abc\tbitcoin\t1000\t5\t5.0\tOPEN_BOUNTY\tTitle';
      assert.strictEqual(parseBountyLine(line), null);
    });

    it('should return null for zero or negative id', function () {
      assert.strictEqual(parseBountyLine('0\tbitcoin\t1000\t5\t5.0\tOPEN_BOUNTY\tTitle'), null);
      assert.strictEqual(parseBountyLine('-1\tbitcoin\t1000\t5\t5.0\tOPEN_BOUNTY\tTitle'), null);
    });

    it('should return null for negative amount', function () {
      var line = '100\tbitcoin\t-1000\t5\t5.0\tOPEN_BOUNTY\tTitle';
      assert.strictEqual(parseBountyLine(line), null);
    });

    it('should allow zero amount', function () {
      var line = '100\tbitcoin\t0\t0\t0.0\tOPEN_BOUNTY\tFree';
      var result = parseBountyLine(line);
      assert.strictEqual(result.amount, 0);
      assert.strictEqual(result.usdValue, 0);
    });

    it('should default missing count to 0', function () {
      var line = '100\tbitcoin\t1000\tabc\t5.0\tOPEN_BOUNTY\tTitle';
      var result = parseBountyLine(line);
      assert.strictEqual(result.count, 0);
    });

    it('should return null for non-numeric rate', function () {
      var line = '100\tbitcoin\t1000\t5\tabc\tOPEN_BOUNTY\tTitle';
      assert.strictEqual(parseBountyLine(line), null);
    });

    it('should handle integer rate without decimals', function () {
      var line = '100\tbitcoin\t1000\t5\t5\tOPEN_BOUNTY\tTitle';
      var result = parseBountyLine(line);
      assert.strictEqual(result.rate, 5);
    });

    it('should handle very small float rate', function () {
      var line = '100\tbitcoin\t1000000\t5\t0.0001\tOPEN_BOUNTY\tTitle';
      var result = parseBountyLine(line);
      assert.strictEqual(result.rate, 0.0001);
    });

    it('should handle large id', function () {
      var line = '9999999999\tbitcoin\t5000\t17\t15.8\tOPEN_BOUNTY,HOT\tTitle';
      var result = parseBountyLine(line);
      assert.strictEqual(result.id, 9999999999);
    });
  });

  describe('parseBountyData', function () {

    it('should parse multiple valid lines', function () {
      var data = [
        '100\tbitcoin\t1000\t5\t5.0\tOPEN_BOUNTY\tTitle 1',
        '200\tbitcoin\t2000\t10\t2.0\tHOT\tTitle 2'
      ].join('\n');
      var results = parseBountyData(data);
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].id, 100);
      assert.strictEqual(results[1].id, 200);
    });

    it('should skip invalid lines and keep valid ones', function () {
      var data = [
        '100\tbitcoin\t1000\t5\t5.0\tOPEN_BOUNTY\tValid',
        'invalid line with no tabs',
        '',
        '200\tbitcoin\t2000\t10\t2.0\tHOT\tAlso valid'
      ].join('\n');
      var results = parseBountyData(data);
      assert.strictEqual(results.length, 2);
      assert.strictEqual(results[0].id, 100);
      assert.strictEqual(results[1].id, 200);
    });

    it('should parse the exact bounty line from the issue', function () {
      var data = '1549793\tbitcoin\t5000\t17\t15.8\tOPEN_BOUNTY,HOT\t⚡Best tips for running a profitable lighting node?⚡';
      var results = parseBountyData(data);
      assert.strictEqual(results.length, 1);
      var b = results[0];
      assert.strictEqual(b.id, 1549793);
      assert.strictEqual(b.rate, 15.8);
      assert.strictEqual(b.title, '⚡Best tips for running a profitable lighting node?⚡');
      assert.strictEqual(b.isOpenBounty, true);
      assert.strictEqual(b.isHot, true);
    });

    it('should return empty array for null input', function () {
      assert.deepStrictEqual(parseBountyData(null), []);
    });

    it('should return empty array for empty string', function () {
      assert.deepStrictEqual(parseBountyData(''), []);
    });

    it('should return empty array for non-string input', function () {
      assert.deepStrictEqual(parseBountyData(12345), []);
    });
  });

  describe('serializeBounty', function () {

    it('should serialize a bounty back to tab-separated format', function () {
      var bounty = {
        id: 1549793,
        currency: 'bitcoin',
        amount: 5000,
        count: 17,
        rate: 15.8,
        tags: ['HOT', 'OPEN_BOUNTY'],
        title: '⚡Best tips for running a profitable lighting node?⚡'
      };
      var line = serializeBounty(bounty);
      assert.strictEqual(
        line,
        '1549793\tbitcoin\t5000\t17\t15.8\tHOT,OPEN_BOUNTY\t⚡Best tips for running a profitable lighting node?⚡'
      );
    });

    it('should handle missing fields gracefully', function () {
      var line = serializeBounty({ id: 100 });
      assert.strictEqual(line, '100\t\t0\t0\t0\t\t');
    });

    it('should return empty string for null input', function () {
      assert.strictEqual(serializeBounty(null), '');
    });

    it('should return empty string for non-object input', function () {
      assert.strictEqual(serializeBounty('not an object'), '');
    });
  });

  describe('round-trip consistency', function () {

    it('should preserve data through parse → serialize → parse cycle', function () {
      var original = '1549793\tbitcoin\t5000\t17\t15.8\tOPEN_BOUNTY,HOT\t⚡Best tips for running a profitable lighting node?⚡';
      var parsed = parseBountyLine(original);
      var serialized = serializeBounty(parsed);
      var reparsed = parseBountyLine(serialized);

      assert.strictEqual(reparsed.id, parsed.id);
      assert.strictEqual(reparsed.currency, parsed.currency);
      assert.strictEqual(reparsed.amount, parsed.amount);
      assert.strictEqual(reparsed.count, parsed.count);
      assert.strictEqual(reparsed.rate, parsed.rate);
      assert.deepStrictEqual(reparsed.tags, parsed.tags);
      assert.strictEqual(reparsed.title, parsed.title);
    });
  });
});
