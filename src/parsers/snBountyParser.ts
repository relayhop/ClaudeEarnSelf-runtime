/**
 * Parses SN OPEN_BOUNTY events
 * Format: <id>\t<currency>\t<amount>\t<days>\t<usd>\t<status>\t<message>
 */

export interface SNBounty {
  id: number;
  currency: string;
  amount: number;
  days: number;
  usdValue: number;
  status: string;
  message: string;
}

export function parseSNBounty(rawString: string): SNBounty {
  if (!rawString || typeof rawString !== 'string') {
    throw new Error('Invalid bounty string');
  }

  const parts = rawString.trim().split('\t');
  if (parts.length !== 7) {
    throw new Error(`Expected 7 fields, got ${parts.length}`);
  }

  return {
    id: parseInt(parts[0], 10),
    currency: parts[1],
    amount: parseInt(parts[2], 10),
    days: parseInt(parts[3], 10),
    usdValue: parseFloat(parts[4]),
    status: parts[5],
    message: parts[6]
  };
}
