/**
 * Bounty Tracker - processes parsed SN bounties and tracks open ones.
 */

const { parseBountyData } = require('../parsers/sn_bounty_parser');

/**
 * Processes raw bounty data and returns open bounties that need tracking.
 *
 * @param {string} rawData - Raw tab-separated bounty data from SN radar
 * @returns {Object} { openBounties, closedBounties, parseErrors }
 */
function processBountyData(rawData) {
  const { bounties, errors } = parseBountyData(rawData);

  const openBounties = bounties.filter(b => b.status === 'OPEN_BOUNTY');
  const closedBounties = bounties.filter(b => b.status === 'CLOSED_BOUNTY');
  const cancelledBounties = bounties.filter(b => b.status === 'CANCELLED_BOUNTY');

  return {
    openBounties,
    closedBounties,
    cancelledBounties,
    parseErrors: errors,
    totalParsed: bounties.length
  };
}

/**
 * Formats a bounty for display/output.
 *
 * @param {Object} bounty - Parsed bounty object
 * @returns {string} Formatted bounty string
 */
function formatBounty(bounty) {
  return `[${bounty.id}] ${bounty.amount} ${bounty.token} | ${bounty.status} | ${bounty.description}`;
}

module.exports = {
  processBountyData,
  formatBounty
};
