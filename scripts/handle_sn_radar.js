const fs = require('fs');

function handleNewBounty(bountyData) {
  const statePath = './data/radar_bounties.json';
  let state = { bounties: [] };
  if (fs.existsSync(statePath)) {
    state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  }
  state.bounties.push(bountyData);
  state.last_updated = new Date().toISOString();
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  console.log(`Logged new SN bounty: ${bountyData.id}`);
}

module.exports = { handleNewBounty };
