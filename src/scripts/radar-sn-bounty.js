'use strict';

const { parseBountyData, formatBountyIssue } = require('../lib/sn-bounty-parser');
const fs = require('fs');
const path = require('path');

const KNOWN_BOUNTIES_FILE = path.join(__dirname, '..', '..', 'data', 'sn-bounties', 'known-bounties.json');

function loadKnownBounties() {
  try {
    const content = fs.readFileSync(KNOWN_BOUNTIES_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    return { bounties: [] };
  }
}

function saveKnownBounties(data) {
  const dir = path.dirname(KNOWN_BOUNTIES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(KNOWN_BOUNTIES_FILE, JSON.stringify(data, null, 2) + '\n');
}

function findNewBounties(bounties, knownIds) {
  return bounties.filter(function (b) { return knownIds.indexOf(b.id) === -1; });
}

async function main() {
  const sourceUrl = process.env.SN_BOUNTY_FEED_URL || '';
  const githubToken = process.env.GITHUB_TOKEN || '';
  const repo = process.env.GITHUB_REPOSITORY || '';

  if (!sourceUrl) {
    console.error('SN_BOUNTY_FEED_URL not set');
    process.exit(1);
  }

  if (!githubToken) {
    console.error('GITHUB_TOKEN not set');
    process.exit(1);
  }

  if (!repo) {
    console.error('GITHUB_REPOSITORY not set');
    process.exit(1);
  }

  const response = await fetch(sourceUrl);
  if (!response.ok) {
    console.error('Failed to fetch bounty data: ' + response.status);
    process.exit(1);
  }

  const content = await response.text();
  const bounties = parseBountyData(content);

  if (bounties.length === 0) {
    console.log('No bounties found in feed.');
    return;
  }

  const openBounties = bounties.filter(function (b) { return b.isOpenBounty; });

  if (openBounties.length === 0) {
    console.log('No open bounties found.');
    return;
  }

  const knownData = loadKnownBounties();
  const knownIds = knownData.bounties.map(function (b) { return b.id; });
  const newBounties = findNewBounties(openBounties, knownIds);

  if (newBounties.length === 0) {
    console.log('No new bounties detected.');
    return;
  }

  const apiBase = 'https://api.github.com';

  for (var i = 0; i < newBounties.length; i++) {
    var bounty = newBounties[i];
    var issueData = formatBountyIssue(bounty);

    var issueResponse = await fetch(apiBase + '/repos/' + repo + '/issues', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + githubToken,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(issueData)
    });

    if (issueResponse.ok) {
      var issue = await issueResponse.json();
      console.log('Created issue #' + issue.number + ' for bounty ' + bounty.id);
      knownData.bounties.push({
        id: bounty.id,
        issueNumber: issue.number,
        detectedAt: new Date().toISOString()
      });
    } else {
      console.error('Failed to create issue for bounty ' + bounty.id + ': ' + issueResponse.status);
    }
  }

  saveKnownBounties(knownData);
  console.log('Processed ' + newBounties.length + ' new bounties.');
}

main().catch(function (err) {
  console.error('Radar failed:', err);
  process.exit(1);
});
