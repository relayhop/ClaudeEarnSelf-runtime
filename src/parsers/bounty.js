/**
 * Parses a single Stacker News bounty line.
 * @param {string} line - The raw TSV line.
 * @returns {object} Parsed bounty object.
 */
export function parseBountyLine(line) {
  const parts = line.split('\t');
  if (parts.length < 7) {
    throw new Error(`Invalid bounty format: expected 7 columns, got ${parts.length}`);
  }
  
  return {
    id: parseInt(parts[0], 10),
    network: parts[1],
    amountSats: parseInt(parts[2], 10),
    durationWeeks: parseInt(parts[3], 10),
    feeRate: parseFloat(parts[4]),
    status: parts[5],
    title: parts[6].trim()
  };
}