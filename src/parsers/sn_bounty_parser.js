/**
 * SN (Stacker News) Bounty Parser
 * Parses tab-separated bounty data from SN radar feed.
 * Handles edge cases including emoji in description fields.
 */

const VALID_STATUSES = ['OPEN_BOUNTY', 'CLOSED_BOUNTY', 'CANCELLED_BOUNTY'];
const VALID_TOKENS = ['bitcoin', 'sats', 'lightning'];

/**
 * Parses a single tab-separated bounty line into a structured object.
 * Expected format: id<TAB>token<TAB>amount<TAB>count<TAB>value<TAB>status<TAB>description
 *
 * @param {string} line - Raw tab-separated bounty string
 * @returns {Object} Parsed bounty object
 * @throws {Error} If the line is malformed or has invalid fields
 */
function parseBountyLine(line) {
  if (typeof line !== 'string') {
    throw new Error('Input must be a string');
  }

  const trimmed = line.trim();
  if (trimmed.length === 0) {
    throw new Error('Empty bounty line');
  }

  const parts = trimmed.split('\t');
  if (parts.length < 7) {
    throw new Error(`Expected at least 7 tab-separated fields, got ${parts.length}`);
  }

  const id = parseInt(parts[0], 10);
  if (isNaN(id) || id <= 0) {
    throw new Error(`Invalid bounty ID: ${parts[0]}`);
  }

  const token = parts[1].toLowerCase();
  if (!VALID_TOKENS.includes(token)) {
    throw new Error(`Invalid token: ${parts[1]}`);
  }

  const amount = parseInt(parts[2], 10);
  if (isNaN(amount) || amount <= 0) {
    throw new Error(`Invalid amount: ${parts[2]}`);
  }

  const count = parseInt(parts[3], 10);
  if (isNaN(count) || count < 0) {
    throw new Error(`Invalid count: ${parts[3]}`);
  }

  const value = parseFloat(parts[4]);
  if (isNaN(value) || value < 0) {
    throw new Error(`Invalid value: ${parts[4]}`);
  }

  const status = parts[5];
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${parts[5]}`);
  }

  // Join remaining parts as description (handles edge case where description contains tabs)
  const description = parts.slice(6).join('\t');
  if (description.length === 0) {
    throw new Error('Empty description field');
  }

  return {
    id,
    token,
    amount,
    count,
    value,
    status,
    description
  };
}

/**
 * Parses multiple tab-separated bounty lines.
 *
 * @param {string} data - Raw multi-line bounty data
 * @returns {Array<Object>} Array of parsed bounty objects
 */
function parseBountyData(data) {
  if (typeof data !== 'string') {
    throw new Error('Input must be a string');
  }

  const lines = data.split('\n').filter(l => l.trim().length > 0);
  const results = [];
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      const bounty = parseBountyLine(lines[i]);
      results.push(bounty);
    } catch (err) {
      errors.push({ line: i + 1, error: err.message, raw: lines[i] });
    }
  }

  if (errors.length > 0 && results.length === 0) {
    throw new Error(`All lines failed to parse. First error: ${errors[0].error}`);
  }

  return { bounties: results, errors };
}

module.exports = {
  parseBountyLine,
  parseBountyData,
  VALID_STATUSES,
  VALID_TOKENS
};
