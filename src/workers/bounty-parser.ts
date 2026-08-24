import { Env } from '../types';

export interface BountyData {
  id: string;
  currency: string;
  amountSats: number;
  duration: number;
  feePercent: number;
  description: string;
}

export interface ParseResult {
  valid: boolean;
  reason?: string;
  bounty?: BountyData;
}

export async function parseBountyEvent(payload: string, env: Env): Promise<ParseResult> {
  const parts = payload.split('	');
  if (parts.length < 7) {
    return { valid: false, reason: 'Invalid bounty payload format' };
  }

  const [id, currency, amount, duration, fee, status, description] = parts;

  if (currency.toLowerCase() !== 'bitcoin') {
    return { valid: false, reason: 'Unsupported currency' };
  }

  if (status !== 'OPEN_BOUNTY') {
    return { valid: false, reason: 'Bounty not open' };
  }

  const amountSats = parseInt(amount, 10);
  if (isNaN(amountSats) || amountSats <= 0) {
    return { valid: false, reason: 'Invalid amount' };
  }

  return {
    valid: true,
    bounty: {
      id,
      currency,
      amountSats,
      duration: parseInt(duration, 10),
      feePercent: parseFloat(fee),
      description
    }
  };
}