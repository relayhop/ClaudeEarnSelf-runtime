import { Bounty } from '../models/Bounty';

export function detectOpenBounty(line: string): Bounty | null {
  const columns = line.split('\t');
  if (columns.length >= 7 && columns[5] === 'OPEN_BOUNTY') {
    return {
      id: parseInt(columns[0], 10),
      asset: columns[1],
      principal: parseFloat(columns[2]),
      days: parseInt(columns[3], 10),
      apy: parseFloat(columns[4]),
      status: columns[5],
      note: columns.slice(6).join(' ').trim()
    };
  }
  return null;
}