export type BountyStatus =
  | 'OPEN_BOUNTY'
  | 'CLOSED_BOUNTY'
  | 'CANCELLED_BOUNTY'
  | 'PENDING_BOUNTY';

export type BountyTag =
  | 'OPEN_BOUNTY'
  | 'CLOSED_BOUNTY'
  | 'CANCELLED_BOUNTY'
  | 'PENDING_BOUNTY'
  | 'HOT'
  | 'VERIFIED'
  | 'URGENT'
  | 'FEATURED'
  | 'EXPIRED';

export interface Bounty {
  id: number;
  currency: string;
  amount: number;
  replies: number;
  score: number;
  tags: BountyTag[];
  status: BountyStatus;
  title: string;
}

export interface ParsedBountyLine {
  total: number;
  openCount: number;
  hotCount: number;
  totalAmount: number;
  currencies: string[];
}
