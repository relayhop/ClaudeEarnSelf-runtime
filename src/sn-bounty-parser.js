'use strict';

/**
 * SN Bounty Parser
 * Parses tab-separated bounty data from Stacker News radar scans.
 * Handles emoji, Unicode, and edge cases in bounty titles.
 */

var VALID_CURRENCIES = ['bitcoin', 'sats', 'usd', 'eur'];

function parseBountyLine(line) {
  if (!line || typeof line !== 'string') {
    return null;
  }
  var trimmed = line.trim();
  if (!trimmed) {
    return null;
  }
  var parts = trimmed.split('\t');
  if (parts.length < 7) {
    return null;
  }
  // Rejoin extra parts into title (title may contain tabs)
  if (parts.length > 7) {
    parts[6] = parts.slice(6).join('\t');
    parts.length = 7;
  }
  return parseBountyParts(parts);
}

function parseBountyParts(parts) {
  var postId = parseInt(parts[0], 10);
  if (isNaN(postId) || postId <= 0) {
    return null;
  }
  var currency = String(parts[1] || '').toLowerCase().trim();
  if (!currency) {
    return null;
  }
  var amount = parseFloat(parts[2]);
  if (isNaN(amount) || amount < 0) {
    return null;
  }
  var rawMin = parseFloat(parts[3]);
  var rawMax = parseFloat(parts[4]);
  var minValue = isNaN(rawMin) ? null : rawMin;
  var maxValue = isNaN(rawMax) ? null : rawMax;
  if (minValue !== null && maxValue !== null && minValue > maxValue) {
    var temp = minValue;
    minValue = maxValue;
    maxValue = temp;
  }
  var tagsStr = String(parts[5] || '').trim();
  var tags = tagsStr ? tagsStr.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : [];
  var title = String(parts[6] || '').trim();
  if (!title) {
    return null;
  }
  return {
    postId: postId,
    currency: currency,
    amount: amount,
    minValue: minValue,
    maxValue: maxValue,
    tags: tags,
    title: title,
    parsedAt: new Date().toISOString()
  };
}

function parseBountyText(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  var lines = text.split('\n').filter(function(l) { return l.trim(); });
  var results = [];
  for (var i = 0; i < lines.length; i++) {
    var parsed = parseBountyLine(lines[i]);
    if (parsed) {
      results.push(parsed);
    }
  }
  return results;
}

function validateBounty(bounty) {
  if (!bounty || typeof bounty !== 'object') {
    return false;
  }
  if (!bounty.postId || typeof bounty.postId !== 'number') {
    return false;
  }
  if (!bounty.currency || typeof bounty.currency !== 'string') {
    return false;
  }
  if (typeof bounty.amount !== 'number' || isNaN(bounty.amount)) {
    return false;
  }
  if (!bounty.title || typeof bounty.title !== 'string') {
    return false;
  }
  if (!Array.isArray(bounty.tags)) {
    return false;
  }
  return true;
}

function isOpenBounty(bounty) {
  if (!bounty || !Array.isArray(bounty.tags)) {
    return false;
  }
  return bounty.tags.some(function(tag) { return tag.toUpperCase() === 'OPEN_BOUNTY'; });
}

function isHotBounty(bounty) {
  if (!bounty || !Array.isArray(bounty.tags)) {
    return false;
  }
  return bounty.tags.some(function(tag) { return tag.toUpperCase() === 'HOT'; });
}

function formatBounty(bounty) {
  if (!bounty) {
    return '';
  }
  var minStr = (bounty.minValue !== null && bounty.minValue !== undefined) ? String(bounty.minValue) : '';
  var maxStr = (bounty.maxValue !== null && bounty.maxValue !== undefined) ? String(bounty.maxValue) : '';
  var tagsStr = Array.isArray(bounty.tags) ? bounty.tags.join(',') : '';
  return [bounty.postId, bounty.currency, bounty.amount, minStr, maxStr, tagsStr, bounty.title].join('\t');
}

module.exports = {
  parseBountyLine: parseBountyLine,
  parseBountyText: parseBountyText,
  parseBountyParts: parseBountyParts,
  validateBounty: validateBounty,
  isOpenBounty: isOpenBounty,
  isHotBounty: isHotBounty,
  formatBounty: formatBounty,
  VALID_CURRENCIES: VALID_CURRENCIES
};
