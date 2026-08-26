'use strict';

var assert = require('assert');
var parser = require('../src/sn-bounty-parser');

var describe = typeof describe === 'function' ? describe : function(name, fn) { fn(); };
var it = typeof it === 'function' ? it : function(name, fn) { fn(); };

describe('SN Bounty Parser', function() {

  it('should parse a valid bounty line with emoji in title', function() {
    var line = '1549793\tbitcoin\t5000\t17\t17.1\tOPEN_BOUNTY,HOT\t⚡Best tips for running a profitable lighting node?⚡';
    var result = parser.parseBountyLine(line);

    assert(result !== null, 'Result should not be null');
    assert.strictEqual(result.postId, 1549793);
    assert.strictEqual(result.currency, 'bitcoin');
    assert.strictEqual(result.amount, 5000);
    assert.strictEqual(result.minValue, 17);
    assert.strictEqual(result.maxValue, 17.1);
    assert.strictEqual(result.tags.length, 2);
    assert.strictEqual(result.tags[0], 'OPEN_BOUNTY');
    assert.strictEqual(result.tags[1], 'HOT');
    assert.strictEqual(result.title, '⚡Best tips for running a profitable lighting node?⚡');
  });

  it('should detect open bounty tag', function() {
    var bounty = { tags: ['OPEN_BOUNTY', 'HOT'] };
    assert.strictEqual(parser.isOpenBounty(bounty), true);
  });

  it('should detect hot bounty tag', function() {
    var bounty = { tags: ['OPEN_BOUNTY', 'HOT'] };
    assert.strictEqual(parser.isHotBounty(bounty), true);
  });

  it('should reject invalid lines', function() {
    assert.strictEqual(parser.parseBountyLine(null), null);
    assert.strictEqual(parser.parseBountyLine(''), null);
    assert.strictEqual(parser.parseBountyLine('invalid'), null);
    assert.strictEqual(parser.parseBountyLine('a\tb'), null);
  });

  it('should handle reversed numeric ranges', function() {
    var line = '100\tbitcoin\t1000\t20\t10\tOPEN_BOUNTY\tTest title';
    var result = parser.parseBountyLine(line);
    assert.strictEqual(result.minValue, 10);
    assert.strictEqual(result.maxValue, 20);
  });

  it('should handle titles containing tabs', function() {
    var line = '200\tbitcoin\t2000\t5\t10\tOPEN_BOUNTY\tTitle\twith\ttabs';
    var result = parser.parseBountyLine(line);
    assert.strictEqual(result.title, 'Title\twith\ttabs');
  });

  it('should format bounty back to tab-separated string', function() {
    var bounty = {
      postId: 1549793,
      currency: 'bitcoin',
      amount: 5000,
      minValue: 17,
      maxValue: 17.1,
      tags: ['OPEN_BOUNTY', 'HOT'],
      title: '⚡Best tips for running a profitable lighting node?⚡'
    };
    var formatted = parser.formatBounty(bounty);
    assert(formatted.indexOf('1549793') === 0);
    assert(formatted.indexOf('⚡Best tips for running a profitable lighting node?⚡') > 0);
  });

  it('should parse multiple bounty lines', function() {
    var text = '1549793\tbitcoin\t5000\t17\t17.1\tOPEN_BOUNTY,HOT\t⚡Best tips⚡\n100\tbitcoin\t1000\t10\t20\tOPEN_BOUNTY\tAnother title';
    var results = parser.parseBountyText(text);
    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].postId, 1549793);
    assert.strictEqual(results[1].postId, 100);
  });

  it('should validate bounty objects', function() {
    var valid = {
      postId: 1,
      currency: 'bitcoin',
      amount: 100,
      title: 'Test',
      tags: ['OPEN_BOUNTY']
    };
    assert.strictEqual(parser.validateBounty(valid), true);

    var invalid = { postId: 'not a number' };
    assert.strictEqual(parser.validateBounty(invalid), false);
  });
});
