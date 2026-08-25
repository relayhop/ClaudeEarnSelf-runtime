export interface SNBountyRecord {
  id: number;
  network: string;
  rewardSats: number;
  difficulty: number;
  ratio: number;
  status: 'OPEN_BOUNTY' | 'CLAIMED';
  description: string;
}

export function parseSNBounty(line: string): SNBountyRecord | null {
  const parts = line.split('\t');
  if (parts.length !== 7) return null;
  
  if (parts[5] !== 'OPEN_BOUNTY') {
    return null;
  }

  return {
    id: parseInt(parts[0], 10),
    network: parts[1].toLowerCase(),
    rewardSats: parseInt(parts[2], 10),
    difficulty: parseInt(parts[3], 10),
    ratio: parseFloat(parts[4]),
    status: 'OPEN_BOUNTY',
    description: parts[6]
  };
}