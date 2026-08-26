/**
 * Bounty Handler - processes radar-detected bounties and generates responses
 * Part of ClaudeEarnSelf-runtime
 */

const BOUNTY_FIELDS = ['id', 'currency', 'amount', 'upvotes', 'rank', 'tags', 'title'];

/**
 * Parse a raw bounty radar line into a structured object.
 * Expected format (tab-separated):
 *   <id>\t<currency>\t<amount>\t<upvotes>\t<rank>\t<tags>\t<title>
 *
 * @param {string} rawLine - The raw bounty data line
 * @returns {Object|null} Parsed bounty object or null if invalid
 */
function parseBountyLine(rawLine) {
  if (!rawLine || typeof rawLine !== 'string') {
    return null;
  }

  const trimmed = rawLine.trim();
  if (!trimmed) {
    return null;
  }

  const parts = trimmed.split('\t');
  if (parts.length < 7) {
    // Try comma-separated as fallback
    const commaParts = trimmed.split(',');
    if (commaParts.length >= 7) {
      // Comma-separated with a title at the end that may contain commas
      // Reconstruct: first 6 fields are comma-separated, rest is the title
      const fields = commaParts.slice(0, 6);
      const title = commaParts.slice(6).join(',').trim();
      const bounty = constructBounty(fields.concat(title));
      return bounty;
    }
    return null;
  }

  // The title may contain tabs, so join everything from index 6 onward
  const titleParts = parts.slice(6);
  const allParts = parts.slice(0, 6).concat(titleParts.join('\t'));

  return constructBounty(allParts);
}

/**
 * Construct a bounty object from parsed fields.
 * @param {string[]} fields - Array of field values
 * @returns {Object|null}
 */
function constructBounty(fields) {
  if (fields.length < 7) {
    return null;
  }

  const id = parseInt(fields[0], 10);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  const currency = fields[1].trim().toLowerCase();
  const amount = parseInt(fields[2], 10);
  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  const upvotes = parseFloat(fields[3]);
  const rank = parseFloat(fields[4]);
  const tagsRaw = fields[5].trim();
  const tags = tagsRaw.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
  const title = fields[6].trim();

  if (!title) {
    return null;
  }

  return {
    id,
    currency,
    amount,
    upvotes: Number.isFinite(upvotes) ? upvotes : 0,
    rank: Number.isFinite(rank) ? rank : 0,
    tags,
    title,
    isOpen: tags.includes('OPEN_BOUNTY'),
    isHot: tags.includes('HOT'),
    raw: fields.join('\t')
  };
}

/**
 * Determine the topic category from bounty title and tags.
 * @param {Object} bounty - Parsed bounty object
 * @returns {string} Category identifier
 */
function categorizeBounty(bounty) {
  const text = (bounty.title + ' ' + bounty.tags.join(' ')).toLowerCase();

  if (text.includes('lightning') || text.includes('lighting') || text.includes('ln node')) {
    return 'lightning_node';
  }
  if (text.includes('bitcoin') || text.includes('btc') || text.includes('mining')) {
    return 'bitcoin';
  }
  if (text.includes('nostr') || text.includes('relay')) {
    return 'nostr';
  }
  if (text.includes('coding') || text.includes('programming') || text.includes('developer')) {
    return 'coding';
  }
  if (text.includes('privacy') || text.includes('security')) {
    return 'privacy';
  }

  return 'general';
}

/**
 * Generate a response for a lightning node profitability bounty.
 * @param {Object} bounty - Parsed bounty object
 * @returns {string} Formatted response content
 */
function generateLightningNodeTips(bounty) {
  return `Here are the best tips for running a profitable Lightning Network node:

## 1. Channel Selection & Peer Strategy
- **Choose well-connected peers**: Route to nodes with high betweenness centrality. Use 1ml.com or amboss.space to identify high-traffic nodes.
- **Open channels to routing hubs**: Nodes like Wallet of Satoshi, ACINQ, or LightningLabs often have high forwarding volume.
- **Avoid duplicate routes**: Don't open multiple channels to nodes that are already peers of each other.

## 2. Liquidity Management
- **Balance your channels**: Aim for 50/50 inbound and outbound liquidity. Use circular re-balancing or peer swaps.
- **Acquire inbound liquidity strategically**: Open channels where you expect payment flow back, or use Lightning Pool to sell inbound liquidity.
- **Use submarine swaps**: Tools like Boltz Exchange or Loop Out help convert channel balance to on-chain funds without closing channels.

## 3. Fee Strategy
- **Start with competitive fees**: Begin with a base fee of 1 sat and a fee rate of 1-10 ppm (parts per million), then adjust based on routing volume.
- **Monitor and adjust**: Use LNmetrics or terminal.web to see what competitors charge. Lower fees attract more routing.
- **Use tiered fees**: Charge more for high-value HTLCs and less for micro-transactions.

## 4. Automation & Tools
- **Use Charge-LND or lnd-fee-advance**: These tools automatically adjust fees based on channel utilization.
- **Set up rebalancing automation**: Use Rebalance-lnd or Polar's auto-rebalancer to keep channels balanced.
- **Deploy watchtowers**: Use The Eye of Satoshi or other watchtower implementations to protect your node while offline.

## 5. Reliability & Uptime
- **Run on reliable hardware**: Use a VPS with 99.9%+ uptime or self-host on reliable hardware with UPS backup.
- **Keep your node online 24/7**: Routing requires availability. Use Tor or a static IP for consistent connectivity.
- **Use a watchtower**: Protect against force-close attacks when you're temporarily offline.

## 6. Cost Management
- **Minimize on-chain fees**: Batch channel opens using PSBTs. Open channels during low-fee periods.
- **Choose cost-effective hosting**: Compare VPS providers. A small node can run on 2GB RAM.
- **Track your ROI**: Monitor routing revenue vs. operational costs (hosting, on-chain fees, electricity).

## 7. Implementation Choice
- **LND**: Most widely used, excellent tooling ecosystem, good for beginners.
- **Core Lightning (CLN)**: More modular, plugin-friendly, lower resource usage.
- **Eclair**: Good for mobile-focused deployments.

## 8. Monitoring & Analytics
- **Use RTL or ThunderHub**: Get a dashboard for channel health, routing stats, and fee management.
- **Track forwarding events**: Usegrafana + lnd-async or export data to Lightning Terminal.
- **Analyze routing patterns**: Identify which channels route most and allocate more liquidity there.

## 9. Backup & Security
- **Use SCB (Static Channel Backups)**: Enable automated SCB backups. Store them encrypted off-site.
- **Use seed-phrase + channel backups**: Never rely on just one backup method.
- **Run on a dedicated machine**: Don't expose your node's RPC or REST interfaces publicly.

## 10. Advanced Strategies
- **Participate in Lightning Pool**: Buy or sell channel liquidity to earn or optimize routing.
- **Use MPP (Multi-Path Payments)**: Support MPP to route larger payments through multiple channels.
- **Offer JIT (Just-In-Time) liquidity**: Use Lightning Pool's JIT channels to earn fees on demand.

Profitability in Lightning comes down to: routing volume × fee margin - operational costs. Focus on high-traffic peers, keep channels balanced, automate fee adjustments, and minimize downtime. Start small, learn the patterns, and scale up as you understand your local routing economy.`;
}

/**
 * Generate content based on bounty category.
 * @param {Object} bounty - Parsed bounty object
 * @returns {string} Generated response content
 */
function generateResponse(bounty) {
  const category = categorizeBounty(bounty);

  switch (category) {
    case 'lightning_node':
      return generateLightningNodeTips(bounty);
    case 'bitcoin':
      return generateBitcoinTips(bounty);
    case 'nostr':
      return generateNostrTips(bounty);
    case 'coding':
      return generateCodingTips(bounty);
    case 'privacy':
      return generatePrivacyTips(bounty);
    default:
      return generateGeneralTips(bounty);
  }
}

/**
 * Stub generators for other categories.
 * These can be expanded with domain-specific content.
 */
function generateBitcoinTips(bounty) {
  return `Tips for ${bounty.title}:\n\nThis is a bitcoin-related bounty. Specific content generation for this category is pending implementation.`;
}

function generateNostrTips(bounty) {
  return `Tips for ${bounty.title}:\n\nThis is a Nostr-related bounty. Specific content generation for this category is pending implementation.`;
}

function generateCodingTips(bounty) {
  return `Tips for ${bounty.title}:\n\nThis is a coding-related bounty. Specific content generation for this category is pending implementation.`;
}

function generatePrivacyTips(bounty) {
  return `Tips for ${bounty.title}:\n\nThis is a privacy-related bounty. Specific content generation for this category is pending implementation.`;
}

function generateGeneralTips(bounty) {
  return `Tips for ${bounty.title}:\n\nThis is a general bounty. Please provide more specific requirements for tailored content.`;
}

/**
 * Process a bounty from start to finish.
 * @param {string} rawLine - The raw bounty radar line
 * @returns {Object} Processing result with status, bounty, and response
 */
function processBounty(rawLine) {
  const bounty = parseBountyLine(rawLine);

  if (!bounty) {
    return {
      status: 'error',
      error: 'Failed to parse bounty line',
      rawLine
    };
  }

  if (!bounty.isOpen) {
    return {
      status: 'skipped',
      reason: 'Bounty is not open',
      bounty
    };
  }

  const response = generateResponse(bounty);

  return {
    status: 'success',
    bounty,
    category: categorizeBounty(bounty),
    response
  };
}

module.exports = {
  parseBountyLine,
  constructBounty,
  categorizeBounty,
  generateResponse,
  generateLightningNodeTips,
  processBounty,
  BOUNTY_FIELDS
};
