'use strict';

/**
 * Stacker News (SN) bounty data parser.
 *
 * Parses tab-separated bounty data lines produced by the SN radar
 * monitoring script. Handles edge cases including:
 *   - Unicode emoji in bounty titles
 *   - Decimal numbers in score fields
 *   - Comma-separated status tags
 *   - Titles containing tab characters
 *   - Leading/trailing whitespace in any field
 */

var FIELD_COUNT = 7;

/**
 * Parse a single tab-separated SN bounty line into a structured object.
 *
 * Expected field order:
 *   id  territory  amount  postCount  score  tags  title
 *
 * @param {string} line - Raw tab-separated bounty line
 * @returns {Object} Parsed bounty: { id, territory, amount, postCount, score, tags, title }
 * @throws {Error} If the line is empty, has too few fields, or contains invalid data
 */
function parseBountyLine(line) {
  if (typeof line !== 'string') {
    throw new Error('parseBountyLine: input must be a string');
  }

  var trimmed = line.trim();
  if (trimmed.length === 0) {
    throw new Error('parseBountyLine: input line is empty');
  }

  var fields = trimmed.split('\t');
  if (fields.length < FIELD_COUNT) {
    throw new Error('parseBountyLine: expected at least ' + FIELD_COUNT + ' fields, got ' + fields.length);
  }

  var idStr = fields[0];
  var territory = fields[1];
  var amountStr = fields[2];
  var countStr = fields[3];
  var scoreStr = fields[4];
  var tagsStr = fields[5];
  var titleParts = fields.slice(6);
  var title = titleParts.join('\t').trim();

  var id = parseInt(idStr, 10);
  if (isNaN(id) || id <= 0) {
    throw new Error('parseBountyLine: invalid bounty ID "' + idStr + '"');
  }

  if (!territory || territory.trim().length === 0) {
    throw new Error('parseBountyLine: territory is empty');
  }
  territory = territory.trim();

  var amount = parseInt(amountStr, 10);
  if (isNaN(amount) || amount < 0) {
    throw new Error('parseBountyLine: invalid amount "' + amountStr + '"');
  }

  var postCount = parseInt(countStr, 10);
  if (isNaN(postCount) || postCount < 0) {
    throw new Error('parseBountyLine: invalid post count "' + countStr + '"');
  }

  var score = parseFloat(scoreStr);
  if (isNaN(score)) {
    throw new Error('parseBountyLine: invalid score "' + scoreStr + '"');
  }

  var tags = tagsStr.split(',').map(function (t) { return t.trim(); }).filter(function (t) { return t.length > 0; });

  if (tags.length === 0) {
    throw new Error('parseBountyLine: no valid tags found');
  }

  if (title.length === 0) {
    throw new Error('parseBountyLine: title is empty');
  }

  return {
    id: id,
    territory: territory,
    amount: amount,
    postCount: postCount,
    score: score,
    tags: tags,
    title: title
  };
}

/**
 * Format a parsed bounty object as a markdown table for GitHub issue bodies.
 *
 * @param {Object} bounty - Parsed bounty from parseBountyLine
 * @returns {string} Markdown table
 */
function formatBountyMarkdown(bounty) {
  var tagsStr = bounty.tags.join(', ');
  return [
    '| Field | Value |',
    '|-------|-------|',
    '| ID | ' + bounty.id + ' |',
    '| Territory | ' + bounty.territory + ' |',
    '| Amount | ' + bounty.amount + ' sats |',
    '| Posts | ' + bounty.postCount + ' |',
    '| Score | ' + bounty.score + ' |',
    '| Tags | ' + tagsStr + ' |',
    '| Title | ' + bounty.title + ' |'
  ].join('\n');
}

/**
 * Check whether a bounty object is "open" (has OPEN_BOUNTY tag).
 *
 * @param {Object} bounty - Parsed bounty from parseBountyLine
 * @returns {boolean}
 */
function isOpenBounty(bounty) {
  return bounty.tags.indexOf('OPEN_BOUNTY') !== -1;
}

module.exports = {
  parseBountyLine: parseBountyLine,
  formatBountyMarkdown: formatBountyMarkdown,
  isOpenBounty: isOpenBounty
};
