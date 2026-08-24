import { BountyRecord, RadarParser } from '../types';

/**
 * Parses SN open bounty radar logs.
 * Expected format: <id>\t<network>\t<amount>\t<tier>\t<fee>\t<status>\t<message>
 * Example: 1548616\tbitcoin\t1000\t15\t23.5\tOPEN_BOUNTY\tAsking 🤔 the stackers ⚡
 */
export class SNBountyParser implements RadarParser {
  parse(line: string): BountyRecord | null {
    if (!line || typeof line !== 'string') {
      return null;
    }

    const parts = line.split('\t');
    if (parts.length < 7) {
      return null;
    }

    const [idStr, network, amountStr, tierStr, feeStr, status, ...messageParts] = parts;

    if (status !== 'OPEN_BOUNTY') {
      return null;
    }

    const id = parseInt(idStr, 10);
    const amount = parseFloat(amountStr);
    const tier = parseInt(tierStr, 10);
    const fee = parseFloat(feeStr);

    if (isNaN(id) || isNaN(amount) || isNaN(tier) || isNaN(fee)) {
      return null;
    }

    return {
      id,
      network,
      amount,
      tier,
      fee,
      status,
      message: messageParts.join('\t').trim()
    };
  }
}
