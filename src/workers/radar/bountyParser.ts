export enum BountyStatus {
  OPEN_BOUNTY = 'OPEN_BOUNTY',
  CLAIMED = 'CLAIMED',
  PAID = 'PAID',
}

export interface BountyRecord {
  id: number;
  network: string;
  amount: number;
  confirmations: number;
  fee: number;
  status: BountyStatus;
  title: string;
}

const BOUNTY_REGEX = /^(\d+)\t([a-zA-Z0-9]+)\t(\d+)\t(\d+)\t([\d.]+)\t([A-Z_]+)\t(.+)$/u;

export function parseBountyLine(line: string): BountyRecord {
  const match = line.match(BOUNTY_REGEX);
  if (!match) {
    throw new Error(`Invalid bounty line format: ${line}`);
  }

  const [_, idStr, network, amountStr, confStr, feeStr, statusStr, title] = match;

  if (!Object.values(BountyStatus).includes(statusStr as BountyStatus)) {
    throw new Error(`Unknown bounty status: ${statusStr}`);
  }

  return {
    id: parseInt(idStr, 10),
    network,
    amount: parseInt(amountStr, 10),
    confirmations: parseInt(confStr, 10),
    fee: parseFloat(feeStr),
    status: statusStr as BountyStatus,
    title,
  };
}
