import { BountyRecord } from '../types';

export function parseBountyLine(line: string): BountyRecord {
  const parts = line.split('\t');
  if (parts.length < 7) {
    throw new Error('Invalid bounty line format');
  }
  
  return {
    id: parseInt(parts[0], 10),
    currency: parts[1],
    amount: parseFloat(parts[2]),
    multiplier: parseInt(parts[3], 10),
    fee: parseFloat(parts[4]),
    status: parts[5],
    description: parts[6]
  };
}
