import { Logger } from '../utils/logger';

export interface Bounty {
  id: number;
  asset: string;
  amount: number;
  durationDays: number;
  rate: number;
  status: string;
  description: string;
}

export function parseBountyLine(line: string): Bounty | null {
  try {
    const parts = line.trim().split('\t');
    if (parts.length !== 7) {
      Logger.error(`Expected 7 tab-separated fields, got ${parts.length} in line: ${line}`);
      return null;
    }
    
    return {
      id: parseInt(parts[0], 10),
      asset: parts[1],
      amount: parseInt(parts[2], 10),
      durationDays: parseInt(parts[3], 10),
      rate: parseFloat(parts[4]),
      status: parts[5],
      description: parts[6]
    };
  } catch (e) {
    Logger.error(`Failed to parse bounty line '${line}': ${e}`);
    return null;
  }
}
