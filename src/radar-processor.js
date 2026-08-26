/**
 * Radar Processor - integrates bounty detection with the ClaudeEarnSelf runtime.
 * Reads radar-detected bounty issues and processes them through the bounty handler.
 */

const { processBounty } = require('./handlers/bounty-handler');

/**
 * Extract the raw bounty data line from a GitHub issue body.
 * The issue body contains the bounty data in a code block.
 *
 * @param {string} issueBody - The GitHub issue body text
 * @returns {string|null} The extracted bounty line
 */
function extractBountyLine(issueBody) {
  if (!issueBody || typeof issueBody !== 'string') {
    return null;
  }

  // Look for content between triple backticks
  const codeBlockMatch = issueBody.match(/```[\s\S]*?\n([\s\S]*?)```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    const line = codeBlockMatch[1].trim();
    if (line) {
      return line;
    }
  }

  // Fallback: look for a line that looks like bounty data (starts with a number, has tabs)
  const lines = issueBody.split('\n');
  for (const l of lines) {
    const trimmed = l.trim();
    if (/^\d+\t/.test(trimmed) && trimmed.split('\t').length >= 7) {
      return trimmed;
    }
  }

  return null;
}

/**
 * Process a radar issue and generate a bounty response.
 *
 * @param {Object} issue - GitHub issue object with body, title, number, labels
 * @returns {Object} Processing result
 */
function processRadarIssue(issue) {
  if (!issue || !issue.body) {
    return {
      status: 'error',
      error: 'Invalid issue object'
    };
  }

  const bountyLine = extractBountyLine(issue.body);
  if (!bountyLine) {
    return {
      status: 'error',
      error: 'Could not extract bounty data from issue body',
      issueNumber: issue.number
    };
  }

  const result = processBounty(bountyLine);

  return {
    ...result,
    issueNumber: issue.number,
    issueTitle: issue.title,
    bountyLine
  };
}

/**
 * Format a bounty response for submission as a Stack News comment.
 *
 * @param {Object} processingResult - Result from processRadarIssue
 * @returns {Object} Formatted submission payload
 */
function formatSubmission(processingResult) {
  if (processingResult.status !== 'success') {
    return {
      status: processingResult.status,
      error: processingResult.error || processingResult.reason,
      issueNumber: processingResult.issueNumber
    };
  }

  const { bounty, response, category } = processingResult;

  return {
    status: 'ready',
    issueNumber: processingResult.issueNumber,
    bountyId: bounty.id,
    currency: bounty.currency,
    amount: bounty.amount,
    category,
    comment: response,
    metadata: {
      tags: bounty.tags,
      upvotes: bounty.upvotes,
      rank: bounty.rank,
      isHot: bounty.isHot
    }
  };
}

module.exports = {
  extractBountyLine,
  processRadarIssue,
  formatSubmission
};
