'use strict';

/**
 * SN Bounty Scanner
 * Fetches the latest bounties from Stacker News and outputs new ones
 * as a JSON array for the GitHub Actions workflow.
 */

const { parseBountyLine, parseBountyLines } = require('./sn-bounty-parser');

async function fetchBounties(apiUrl) {
  const url = apiUrl || process.env.SN_API_URL || 'https://stacker.news';
  const query = `
    query {
      items(
        type: BOUNTY
        status: ACTIVE
        orderBy: RANK
        limit: 50
      ) {
        id
        bounty
        title
        text
        sats
        boost
        comments
        meSats
        status
        company
        sub {
          name
        }
        user {
          name
        }
      }
    }
  `;

  const response = await fetch(`${url}/api/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`SN API returned ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  return json.data?.items || [];
}

/**
 * Convert an SN API bounty item to the tab-separated radar format.
 * Format: id  currency  amount  commentCount  satsPaid  tags  title
 */
function itemToRadarLine(item) {
  const id = item.id || '';
  const currency = 'bitcoin';
  const amount = item.bounty || 0;
  const commentCount = item.comments || 0;
  const satsPaid = item.meSats || 0;
  const tags = item.status === 'ACTIVE' ? 'OPEN_BOUNTY' : 'CLOSED_BOUNTY';
  const title = item.title || item.text || '';
  return [id, currency, amount, commentCount, satsPaid, tags, title].join('\t');
}

async function main() {
  try {
    const items = await fetchBounties();
    const lines = items.map(itemToRadarLine);
    const bounties = parseBountyLines(lines.join('\n'));
    const newBounties = bounties.filter(b => b.isOpenBounty);

    // Output for GitHub Actions
    const output = newBounties.map(b => b.rawLine);
    if (output.length > 0) {
      // Use ::set-output for GitHub Actions
      const jsonStr = JSON.stringify(output);
      // Escape for shell
      const escaped = jsonStr.replace(/'/g, "'\\''");
      console.log(`::set-output name=new-bounties::${escaped}`);
    } else {
      console.log('::set-output name=new-bounties::');
    }
    console.log(`Scanned ${items.length} items, found ${newBounties.length} new open bounties`);
  } catch (err) {
    console.error(`Error scanning bounties: ${err.message}`);
    // Don't fail the workflow on API errors
    console.log('::set-output name=new-bounties::');
  }
}

main();
