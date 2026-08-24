export interface BountyRecord {
  id: number;
  asset: string;
  amount: number;
  stackers: number;
  score: number;
  status: string;
  description: string;
}

export function parseOpenBountyRecord(rawLine: string): BountyRecord {
  const parts = rawLine.split('\t');
  if (parts.length < 7) {
    throw new Error(`Invalid OPEN_BOUNTY format: expected 7 columns, got ${parts.length}`);
  }
  return {
    id: parseInt(parts[0], 10),
    asset: parts[1],
    amount: parseFloat(parts[2]),
    stackers: parseInt(parts[3], 10),
    score: parseFloat(parts[4]),
    status: parts[5],
    description: parts[6]
  };
}