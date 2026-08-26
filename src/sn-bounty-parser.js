'use strict';

/**
 * SN (Stacker News) Bounty Parser
 * Parses tab-separated bounty data lines from the SN radar feed.
 *
 * Expected line format (tab-separated):
 *   id	currency	amount	commentCount	satsPaid	tags	title
 *
 * Example:
 *   1549793	bitcoin	5000	18	19.5	OPEN_BOUNTY,HOT	Best tips for running a profitable lighting node?
 */

const FIELDS = ['id', 'currency', 'amount', 'commentCount', 'satsPaid', 'tags', 'title'];
const MIN_FIELDS = 5;

class BountyParseError extends Error {
  constructor(message, line) {
    super(message);
    this.name = 'BountyParseError';
    this.line = line;
  }
}

/**
 * Sanitize a raw string field: trim whitespace, remove null bytes,
 * strip emoji and other non-printable control chars that can
 * break downstream JSON serialization or GitHub issue creation.
 *
 * Emoji range covered:
 *   U+1F000-U+1FAFF  (Misc Symbols & Pictographs, Supplemental, etc.)
 *   U+2600-U+27BF     (Misc Symbols, Dingbats)
 *   U+2190-U+21FF     (Arrows – sometimes used in titles)
 *   U+FE00-U+FE0F     (Variation Selectors)
 *   U+200D            (Zero Width Joiner)
 *   U+2705            (White Heavy Check Mark – common in SN titles)
 *   U+26A1            (High Voltage Sign – the lightning emoji in this issue)
 *
 * We also collapse multiple spaces and trim.
 */
function sanitizeField(raw) {
  if (raw === null || raw === undefined) {
    return '';
  }
  let s = String(raw);
  // Remove null bytes and other C0 control chars except tab/newline (already split)
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // Remove emoji and pictographic symbols
  s = s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{FE00}-\u{FE0F}\u{200D}\u{2705}\u{26A1}]/gu, '');
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * Parse a comma-separated tags field into an array of tag strings.
 * e.g. "OPEN_BOUNTY,HOT" => ["OPEN_BOUNTY", "HOT"]
 */
function parseTags(rawTags) {
  if (!rawTags) {
    return [];
  }
  return rawTags
    .split(',')
    .map(t => sanitizeField(t))
    .filter(t => t.length > 0);
}

/**
 * Parse a single SN bounty line.
 *
 * @param {string} line - Raw tab-separated bounty line
 * @returns {object} Parsed bounty object
 * @throws {BountyParseError} If the line is empty or has too few fields
 */
function parseBountyLine(line) {
  if (!line || typeof line !== 'string') {
    throw new BountyParseError('Line is empty or not a string', line);
  }

  const trimmed = line.trim();
  if (trimmed.length === 0) {
    throw new BountyParseError('Line is empty after trimming', line);
  }

  // Split on tab characters; also handle multiple consecutive tabs
  const parts = trimmed.split(/\t+/).map(p => p.trim());

  if (parts.length < MIN_FIELDS) {
    throw new BountyParseError(
      `Line has ${parts.length} fields, expected at least ${MIN_FIELDS}`,
      line
    );
  }

  // Map fields by position
  // Format: id  currency  amount  commentCount  satsPaid  tags  title
  const rawId = parts[0];
  const rawCurrency = parts[1] || '';
  const rawAmount = parts[2] || '0';
  const rawCommentCount = parts[3] || '0';
  const rawSatsPaid = parts[4] || '0';
  const rawTags = parts[5] || '';
  // Title is everything after field index 5, joined back with tabs in case
  // the title itself contained tabs
  const rawTitle = parts.length > 6 ? parts.slice(6).join('\t') : '';

  // Sanitize all string fields
  const id = sanitizeField(rawId);
  const currency = sanitizeField(rawCurrency).toLowerCase();
  const title = sanitizeField(rawTitle);
  const tags = parseTags(rawTags);

  // Parse numeric fields
  const amount = parseAmount(rawAmount);
  const commentCount = parseInt(sanitizeField(rawCommentCount), 10);
  const satsPaid = parseFloat(sanitizeField(rawSatsPaid));

  // Validate critical fields
  if (!id) {
    throw new BountyParseError('Bounty ID is missing or empty', line);
  }
  if (!title) {
    throw new BountyParseError('Bounty title is missing or empty', line);
  }

  // Determine bounty status from tags
  const isOpenBounty = tags.some(t => t.toUpperCase() === 'OPEN_BOUNTY');
  const isHot = tags.some(t => t.toUpperCase() === 'HOT');

  // Build the bounty object
  const bounty = {
    id,
    currency,
    amount,
    commentCount: Number.isNaN(commentCount) ? 0 : commentCount,
    satsPaid: Number.isNaN(satsPaid) ? 0 : satsPaid,
    tags,
    title,
    isOpenBounty,
    isHot,
    // Sats remaining = total amount - sats already paid
    satsRemaining: Math.max(0, amount - (Number.isNaN(satsPaid) ? 0 : satsPaid)),
    // Original raw line for debugging / audit
    rawLine: trimmed,
    // Parsed timestamp of when this was processed
    parsedAt: new Date().toISOString(),
  };

  return bounty;
}

/**
 * Parse an amount string that may contain commas, units, or be in sats.
 * Handles: "5000", "5,000", "5000 sats", "0.00005 BTC"
 * Returns the value in satoshis for bitcoin amounts.
 */
function parseAmount(rawAmount) {
  if (!rawAmount) {
    return 0;
  }
  const cleaned = sanitizeField(rawAmount).replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : Math.round(parsed);
}

/**
 * Parse multiple bounty lines (e.g., the full radar feed output).
 * Returns an array of parsed bounty objects, skipping lines that fail.
 *
 * @param {string} text - Multi-line text containing bounty lines
 * @param {object} [options] - Options
 * @param {boolean} [options.skipErrors=true] - Skip lines that fail to parse
 * @returns {Array<object>} Array of parsed bounty objects
 */
function parseBountyLines(text, options) {
  const opts = options || {};
  const skipErrors = opts.skipErrors !== false; // default true
  const results = [];

  if (!text || typeof text !== 'string') {
    return results;
  }

  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    // Skip empty or comment lines
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
      continue;
    }

    try {
      const bounty = parseBountyLine(line);
      results.push(bounty);
    } catch (err) {
      if (err instanceof BountyParseError) {
        if (!skipErrors) {
          throw err;
        }
        // Log and continue (in production, would log to console or a logger)
        if (process.env.DEBUG_SN_PARSER) {
          console.error(`[sn-bounty-parser] Skipped line: ${err.message}`);
        }
      } else {
        throw err;
      }
    }
  }

  return results;
}

/**
 * Format a parsed bounty as a GitHub issue body (markdown).
 *
 * @param {object} bounty - Parsed bounty object
 * @returns {string} Markdown-formatted issue body
 */
function formatIssueBody(bounty) {
  if (!bounty || !bounty.id) {
    return '';
  }

  const tagsStr = bounty.tags.length > 0 ? bounty.tags.join(', ') : 'none';
  const statusEmoji = bounty.isOpenBounty ? '🟢' : '⚪';
  const hotBadge = bounty.isHot ? ' 🔥HOT' : '';

  return [
    `## SN Bounty #${bounty.id}${hotBadge}`,
    '',
    `| Field | Value |`,
    `| --- | --- |`,
    `| ID | ${bounty.id} |`,
    `| Title | ${bounty.title} |`,
    `| Currency | ${bounty.currency} |`,
    `| Amount | ${bounty.amount} sats |`,
    `| Sats Paid | ${bounty.satsPaid} |`,
    `| Sats Remaining | ${bounty.satsRemaining} |`,
    `| Comments | ${bounty.commentCount} |`,
    `| Tags | ${tagsStr} |`,
    `| Status | ${statusEmoji} ${bounty.isOpenBounty ? 'OPEN' : 'CLOSED'} |`,
    `| Detected | ${bounty.parsedAt} |`,
    '',
    '---',
    '',
    `### Raw Data`,
    '```',
    bounty.rawLine,
    '```',
  ].join('\n');
}

/**
 * Generate a GitHub issue title from a parsed bounty.
 *
 * @param {object} bounty - Parsed bounty object
 * @returns {string} Issue title string
 */
function formatIssueTitle(bounty) {
  if (!bounty || !bounty.id) {
    return '[radar] Unknown bounty';
  }
  const statusTag = bounty.isOpenBounty ? 'OPEN_BOUNTY' : 'BOUNTY';
  const hotTag = bounty.isHot ? ' HOT' : '';
  const truncatedTitle = bounty.title.length > 80
    ? bounty.title.substring(0, 77) + '...'
    : bounty.title;
  return `[radar] SN ${statusTag}${hotTag} #${bounty.id} - ${truncatedTitle}`;
}

/**
 * Generate labels for a GitHub issue from a parsed bounty.
 *
 * @param {object} bounty - Parsed bounty object
 * @returns {string[]} Array of label strings
 */
function generateIssueLabels(bounty) {
  const labels = ['radar', 'sn'];
  if (bounty.isOpenBounty) {
    labels.push('open-bounty');
  }
  if (bounty.isHot) {
    labels.push('hot');
  }
  if (bounty.currency === 'bitcoin' || bounty.currency === 'btc') {
    labels.push('bitcoin');
  }
  if (bounty.satsRemaining > 0 && bounty.isOpenBounty) {
    labels.push('funded');
  }
  return labels;
}

module.exports = {
  BountyParseError,
  parseBountyLine,
  parseBountyLines,
  parseAmount,
  sanitizeField,
  parseTags,
  formatIssueBody,
  formatIssueTitle,
  generateIssueLabels,
  FIELDS,
  MIN_FIELDS,
};
