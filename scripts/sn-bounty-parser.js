/**
 * SN (Stack Network) Open Bounty Parser
 * Parses tab-separated bounty radar lines and normalizes them into structured objects.
 *
 * Expected line format (tab-separated):
 *   <id>\t<site>\t<bounty_amount>\t<answer_count>\t<score>\t<tags>\t<title>
 *
 * Example:
 *   1549793\tbitcoin\t5000\t18\t21.6\tOPEN_BOUNTY,HOT\t⚡Best tips for running a profitable lighting node?⚡
 */

'use strict';

/**
 * Default field count expected in a well-formed bounty line.
 * @type {number}
 */
const EXPECTED_FIELD_COUNT = 7;

/**
 * Valid bounty status tags we recognize.
 * @type {Set<string>}
 */
const VALID_STATUS_TAGS = new Set([
  'OPEN_BOUNTY',
  'CLOSED_BOUNTY',
  'EXPIRED_BOUNTY',
  'GRACE_PERIOD',
]);

/**
 * Parse a single tab-separated bounty radar line into a structured object.
 *
 * @param {string} line — raw tab-separated line from the SN radar feed
 * @returns {Object|null} parsed bounty object, or null if the line is invalid
 */
function parseBountyLine(line) {
  if (typeof line !== 'string') {
    return null;
  }

  // Trim trailing whitespace/newlines but preserve internal content.
  const trimmed = line.replace(/\r?\n$/, '').trimEnd();

  if (trimmed.length === 0) {
    return null;
  }

  // Split on tab characters. We use a limit-free split so the title field
  // (which may itself contain tabs in rare edge cases) is captured fully.
  const fields = trimmed.split('\t');

  if (fields.length < EXPECTED_FIELD_COUNT) {
    return null;
  }

  // Destructure with explicit indices for clarity.
  const rawId = fields[0];
  const rawSite = fields[1];
  const rawBountyAmount = fields[2];
  const rawAnswerCount = fields[3];
  const rawScore = fields[4];
  const rawTags = fields[5];
  // The title is everything after the 6th tab — rejoin in case it contained tabs.
  const rawTitle = fields.slice(6).join('\t');

  // --- Validate and coerce numeric fields ---

  const id = parseInt(rawId, 10);
  if (isNaN(id) || id <= 0) {
    return null;
  }

  const bountyAmount = parseInt(rawBountyAmount, 10);
  if (isNaN(bountyAmount) || bountyAmount < 0) {
    return null;
  }

  const answerCount = parseInt(rawAnswerCount, 10);
  if (isNaN(answerCount) || answerCount < 0) {
    return null;
  }

  const score = parseFloat(rawScore);
  if (isNaN(score)) {
    return null;
  }

  // --- Validate string fields ---

  const site = (rawSite || '').trim().toLowerCase();
  if (site.length === 0) {
    return null;
  }

  // Site must be alphanumeric (allows subdomains like "bitcoin" or "ethereum").
  if (!/^[a-z0-9]+(\.[a-z0-9]+)*$/.test(site)) {
    return null;
  }

  // --- Parse tags (comma-separated, may contain unicode) ---
  const tags = (rawTags || '')
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  // Determine bounty status from tags.
  const statusTags = tags.filter((t) => VALID_STATUS_TAGS.has(t.toUpperCase()));
  const status = statusTags.length > 0 ? statusTags[0].toUpperCase() : 'UNKNOWN';

  // Non-status tags are category/feature tags.
  const categoryTags = tags.filter((t) => !VALID_STATUS_TAGS.has(t.toUpperCase()));

  // --- Normalize title (strip surrounding whitespace, keep unicode emojis) ---
  const title = (rawTitle || '').trim();
  if (title.length === 0) {
    return null;
  }

  return {
    id,
    site,
    bountyAmount,
    answerCount,
    score,
    tags: categoryTags,
    status,
    title,
    // Preserve the raw line for audit/debugging purposes.
    raw: trimmed,
    // ISO timestamp of when this line was parsed.
    parsedAt: new Date().toISOString(),
  };
}

/**
 * Parse multiple bounty lines from a multi-line string (e.g., a radar feed dump).
 *
 * @param {string} input — multi-line string with one bounty per line
 * @returns {Array<Object>} array of parsed bounty objects (invalid lines skipped)
 */
function parseBountyFeed(input) {
  if (typeof input !== 'string' || input.length === 0) {
    return [];
  }

  const lines = input.split(/\r?\n/);
  const results = [];

  for (const line of lines) {
    const parsed = parseBountyLine(line);
    if (parsed !== null) {
      results.push(parsed);
    }
  }

  return results;
}

/**
 * Serialize a parsed bounty object back into the tab-separated radar format.
 *
 * @param {Object} bounty — parsed bounty object
 * @returns {string} tab-separated line
 */
function serializeBounty(bounty) {
  if (!bounty || typeof bounty !== 'object') {
    return '';
  }

  const allTags = [bounty.status, ...bounty.tags].filter((t) => t && t.length > 0);

  return [
    bounty.id,
    bounty.site,
    bounty.bountyAmount,
    bounty.answerCount,
    bounty.score,
    allTags.join(','),
    bounty.title,
  ].join('\t');
}

/**
 * Filter bounties by status.
 *
 * @param {Array<Object>} bounties — array of parsed bounty objects
 * @param {string} status — status to filter by (e.g., 'OPEN_BOUNTY')
 * @returns {Array<Object>} filtered bounties
 */
function filterByStatus(bounties, status) {
  const normalizedStatus = (status || '').toUpperCase();
  return bounties.filter((b) => b.status === normalizedStatus);
}

/**
 * Sort bounties by bounty amount descending (highest bounty first).
 *
 * @param {Array<Object>} bounties — array of parsed bounty objects
 * @returns {Array<Object>} sorted copy
 */
function sortByBountyAmount(bounties) {
  return [...bounties].sort((a, b) => b.bountyAmount - a.bountyAmount);
}

module.exports = {
  parseBountyLine,
  parseBountyFeed,
  serializeBounty,
  filterByStatus,
  sortByBountyAmount,
  EXPECTED_FIELD_COUNT,
  VALID_STATUS_TAGS,
};
