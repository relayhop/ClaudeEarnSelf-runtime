'use strict';

/**
 * Parser for SN (Stacker News) bounty data in TSV format.
 *
 * Expected TSV format:
 * <id>\t<currency>\t<amount>\t<metric1>\t<metric2>\t<tags>\t<title>
 *
 * Example:
 * 1549793\tbitcoin\t5000\t18\t19.5\tOPEN_BOUNTY,HOT\t⚡Best tips for running a profitable lighting node?⚡
 */

const REQUIRED_FIELD_COUNT = 7;
const VALID_CURRENCIES = new Set(['bitcoin', 'sats', 'lightning']);

/**
 * Parse a single TSV line into a structured bounty object.
 *
 * @param {string} line - Raw TSV line
 * @returns {Object|null} Parsed bounty or null if invalid
 */
function parseBountyLine(line) {
  if (!line || typeof line !== 'string') {
    return null;
  }

  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  const fields = trimmed.split('\t');
  if (fields.length < REQUIRED_FIELD_COUNT) {
    return null;
  }

  const id = parseInt(fields[0], 10);
  if (isNaN(id) || id <= 0) {
    return null;
  }

  const currency = fields[1].toLowerCase().trim();
  if (!VALID_CURRENCIES.has(currency)) {
    return null;
  }

  const amount = parseInt(fields[2], 10);
  if (isNaN(amount) || amount < 0) {
    return null;
  }

  const metric1 = parseFloat(fields[3]);
  if (isNaN(metric1)) {
    return null;
  }

  const metric2 = parseFloat(fields[4]);
  if (isNaN(metric2)) {
    return null;
  }

  const tags = fields[5]
    .split(',')
    .map(function (t) { return t.trim(); })
    .filter(function (t) { return t.length > 0; });

  if (tags.length === 0) {
    return null;
  }

  const title = fields.slice(REQUIRED_FIELD_COUNT - 1).join('\t').trim();
  if (!title) {
    return null;
  }

  return {
    id: id,
    currency: currency,
    amount: amount,
    metric1: metric1,
    metric2: metric2,
    tags: tags,
    title: title,
    isOpenBounty: tags.some(function (t) { return t.toUpperCase() === 'OPEN_BOUNTY'; }),
    isHot: tags.some(function (t) { return t.toUpperCase() === 'HOT'; })
  };
}

/**
 * Parse multiple TSV lines into bounty objects.
 *
 * @param {string} content - Raw TSV content
 * @returns {Array} Array of parsed bounty objects
 */
function parseBountyData(content) {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const lines = content.split('\n');
  const bounties = [];

  for (var i = 0; i < lines.length; i++) {
    var bounty = parseBountyLine(lines[i]);
    if (bounty) {
      bounties.push(bounty);
    }
  }

  return bounties;
}

/**
 * Format a bounty for GitHub issue creation.
 *
 * @param {Object} bounty - Parsed bounty object
 * @returns {Object} Object with title, body, and labels for issue creation
 */
function formatBountyIssue(bounty) {
  var tagsStr = bounty.tags.join(', ');

  var bodyParts = [
    'New SN OPEN_BOUNTY detected:',
    '',
    '```',
    [bounty.id, bounty.currency, bounty.amount, bounty.metric1, bounty.metric2, tagsStr, bounty.title].join('\t'),
    '```',
    '',
    '| Field | Value |',
    '| --- | --- |',
    '| Bounty ID | ' + bounty.id + ' |',
    '| Currency | ' + bounty.currency + ' |',
    '| Amount | ' + bounty.amount + ' sats |',
    '| Metrics | ' + bounty.metric1 + ' / ' + bounty.metric2 + ' |',
    '| Tags | ' + tagsStr + ' |',
    '| Title | ' + bounty.title + ' |',
    ''
  ];

  if (bounty.isHot) {
    bodyParts.push('---');
    bodyParts.push('');
    bodyParts.push('This bounty is marked as **HOT**.');
    bodyParts.push('');
  }

  var labels = ['radar', 'sn'];
  if (bounty.isOpenBounty) {
    labels.push('open-bounty');
  }
  if (bounty.isHot) {
    labels.push('hot');
  }

  return {
    title: '[radar] SN open bounty ' + new Date().toISOString().slice(0, 16),
    body: bodyParts.join('\n'),
    labels: labels
  };
}

module.exports = {
  parseBountyLine: parseBountyLine,
  parseBountyData: parseBountyData,
  formatBountyIssue: formatBountyIssue,
  REQUIRED_FIELD_COUNT: REQUIRED_FIELD_COUNT,
  VALID_CURRENCIES: VALID_CURRENCIES
};
