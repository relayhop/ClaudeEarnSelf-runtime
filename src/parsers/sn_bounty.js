'use strict';

/**
 * Parser for Stacker News (SN) bounty data.
 *
 * Data format (tab-separated):
 *   id\tcurrency\tamount\tcount\trate\ttags\ttitle
 *
 * Example:
 *   1549793\tbitcoin\t5000\t17\t15.8\tOPEN_BOUNTY,HOT\t⚡Best tips for running a profitable lighting node?⚡
 *
 * Edge cases handled:
 *   - Float values in rate field (e.g. 15.8 must not be truncated to 15)
 *   - Emoji / multi-byte Unicode in title field (e.g. ⚡)
 *   - Comma-separated tags (e.g. OPEN_BOUNTY,HOT → ["OPEN_BOUNTY", "HOT"])
 *   - Titles that themselves contain tab characters (rejoined after field split)
 *   - Empty lines, whitespace-only lines, and malformed entries
 *   - Negative or non-numeric ids / amounts
 */

var FIELD_DELIMITER = '\t';
var TAG_DELIMITER = ',';
var MIN_FIELDS = 7;

/**
 * Parse a single SN bounty data line.
 *
 * @param {string} line - Tab-separated bounty data line
 * @returns {Object|null} Parsed bounty object, or null if line is invalid
 */
function parseBountyLine(line) {
  if (!line || typeof line !== 'string') {
    return null;
  }

  var trimmed = line.trim();
  if (trimmed === '') {
    return null;
  }

  var fields = trimmed.split(FIELD_DELIMITER);
  if (fields.length < MIN_FIELDS) {
    return null;
  }

  /*
   * Fields 0-5 are fixed.  The title (field 6+) is everything that remains
   * after the first six tab-separated columns, rejoined with tabs so that
   * a title containing a literal tab character is preserved.
   */
  var id = parseInt(fields[0], 10);
  var currency = fields[1].trim();
  var amount = parseInt(fields[2], 10);
  var count = parseInt(fields[3], 10);
  /*
   * CRITICAL FIX: use parseFloat, NOT parseInt.
   * parseInt('15.8') returns 15, silently dropping the decimal.
   * parseFloat('15.8') correctly returns 15.8.
   */
  var rate = parseFloat(fields[4]);
  var tagsRaw = fields[5];
  var title = fields.slice(6).join(FIELD_DELIMITER).trim();

  // Validate required numeric fields
  if (isNaN(id) || id <= 0) {
    return null;
  }
  if (!currency) {
    return null;
  }
  if (isNaN(amount) || amount < 0) {
    return null;
  }
  if (isNaN(rate)) {
    return null;
  }

  // Parse comma-separated tags: trim each, drop empties, sort for stable comparison
  var tags = tagsRaw
    .split(TAG_DELIMITER)
    .map(function (t) { return t.trim(); })
    .filter(function (t) { return t.length > 0; });
  tags.sort();

  return {
    id: id,
    currency: currency,
    amount: amount,
    count: isNaN(count) ? 0 : count,
    rate: rate,
    tags: tags,
    title: title,
    // Derived convenience fields
    isOpenBounty: tags.indexOf('OPEN_BOUNTY') !== -1,
    isHot: tags.indexOf('HOT') !== -1,
    usdValue: Math.round(amount * rate * 100) / 100
  };
}

/**
 * Parse multiple SN bounty data lines from a multi-line string.
 *
 * @param {string} data - Multi-line, tab-separated bounty data
 * @returns {Array<Object>} Array of parsed bounty objects (invalid lines skipped)
 */
function parseBountyData(data) {
  if (!data || typeof data !== 'string') {
    return [];
  }

  return data
    .split('\n')
    .map(parseBountyLine)
    .filter(function (b) { return b !== null; });
}

/**
 * Serialize a bounty object back to tab-separated format.
 *
 * @param {Object} bounty - Bounty object
 * @returns {string} Tab-separated line
 */
function serializeBounty(bounty) {
  if (!bounty || typeof bounty !== 'object') {
    return '';
  }

  var parts = [
    String(bounty.id || ''),
    bounty.currency || '',
    String(bounty.amount || 0),
    String(bounty.count || 0),
    String(bounty.rate || 0),
    (bounty.tags || []).join(TAG_DELIMITER),
    bounty.title || ''
  ];

  return parts.join(FIELD_DELIMITER);
}

module.exports = {
  parseBountyLine: parseBountyLine,
  parseBountyData: parseBountyData,
  serializeBounty: serializeBounty,
  FIELD_DELIMITER: FIELD_DELIMITER,
  TAG_DELIMITER: TAG_DELIMITER,
  MIN_FIELDS: MIN_FIELDS
};
