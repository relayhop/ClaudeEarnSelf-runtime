import { parseBountyEvent } from './bounty-parser';
import { Env } from '../types';

export interface PayoutResult {
  success: boolean;
  id?: string;
  netPayout?: number;
  error?: string;
}

export async function handleStackerPayout(payload: string, env: Env): Promise<PayoutResult> {
  const result = await parseBountyEvent(payload, env);
  if (!result.valid || !result.bounty) {
    console.warn('Skipping payout:', result.reason);
    return { success: false, error: result.reason };
  }

  const { bounty } = result;
  
  // Deduct protocol fee for stackers
  const feeAmount = Math.floor(bounty.amountSats * (bounty.feePercent / 100));
  const netPayout = bounty.amountSats - feeAmount;

  // Store payout state in Cloudflare KV
  await env.STACKER_KV.put(`bounty:${bounty.id}:status`, 'PAYOUT_PENDING');
  await env.STACKER_KV.put(`bounty:${bounty.id}:net`, netPayout.toString());

  return { success: true, id: bounty.id, netPayout };
}