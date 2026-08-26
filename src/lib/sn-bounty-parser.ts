/**
 * SN (Stacker News) Bounty Parser
 *
 * Parses tab-separated bounty entries from the SN platform.
 * Handles emoji titles, comma-separated tags, and decimal fields.
 */

export type BountyStatus = 'OPEN' | 'CLOSED' | 'EXPIRED';

export interface ParsedBounty {
  id: number;
  currency: string;
  amount: number;
  commentCount: number;
  score: number;
  tags: string[];
  title: string;
  status: BountyStatus;
  isHot: boolean;
  isOpen: boolean;
}

const TAG_OPEN = 'OPEN_BOUNTY';
const TAG_CLOSED = 'CLOSED_BOUNTY';
const TAG_EXPIRED = 'EXPIRED_BOUNTY';
const TAG_HOT = 'HOT';

/**
 * Parse a single TSV bounty line from SN.
 *
 * Format: <id>\t<currency>\t<amount>\t<comments>\t<score>\t<tags>\t<title>
 * Example: 1549793\tbitcoin\t5000\t18\t17.8\tOPEN_BOUNTY,HOT\t{emoji}Best tips for running a profitable lighting node?{emoji}
 */
export function parseSNBountyLine(line: string): ParsedBounty | null {
  if (!line || typeof line !== 'string') {
    return null;
  }

  const trimmed = line.replace(/\r?\n$/, '').trim();
  if (!trimmed) {
    return null;
  }

  const fields = trimmed.split('\t');
  if (fields.length < 7) {
    return null;
  }

  const id = parseInt(fields[0], 10);
  if (isNaN(id) || id <= 0) {
    return null;
  }

  const currency = fields[1].trim();
  if (!currency) {
    return null;
  }

  const amount = parseInt(fields[2], 10);
  if (isNaN(amount) || amount < 0) {
    return null;
  }

  const commentCount = parseInt(fields[3], 10);
  const score = parseFloat(fields[4]);
  const tagsStr = fields[5].trim();
  const tags = tagsStr
    ? tagsStr.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  // Title is everything after field 6 -- may contain tabs
  const title = fields.slice(6).join('\t').trim();

  let status: BountyStatus = 'OPEN';
  if (tags.includes(TAG_CLOSED)) {
    status = 'CLOSED';
  } else if (tags.includes(TAG_EXPIRED)) {
    status = 'EXPIRED';
  }

  return {
    id,
    currency,
    amount,
    commentCount: isNaN(commentCount) ? 0 : commentCount,
    score: isNaN(score) ? 0 : score,
    tags,
    title,
    status,
    isHot: tags.includes(TAG_HOT),
    isOpen: status === 'OPEN',
  };
}

/**
 * Parse multiple bounty lines from a TSV string.
 */
export function parseSNBountyLines(text: string): ParsedBounty[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  return text
    .split(/\r?\n/)
    .map(line => parseSNBountyLine(line))
    .filter((b): b is ParsedBounty => b !== null);
}

/**
 * Format a parsed bounty back into TSV for issue body.
 */
export function formatBountyForIssue(bounty: ParsedBounty): string {
  return [
    bounty.id.toString(),
    bounty.currency,
    bounty.amount.toString(),
    bounty.commentCount.toString(),
    bounty.score.toString(),
    bounty.tags.join(','),
    bounty.title,
  ].join('\t');
}

/**
 * Check if a bounty line represents an open bounty.
 */
export function isOpenBountyLine(line: string): boolean {
  const bounty = parseSNBountyLine(line);
  return bounty !== null && bounty.isOpen;
}

/**
 * Check if a bounty line represents a hot bounty.
 */
export function isHotBountyLine(line: string): boolean {
  const bounty = parseSNBountyLine(line);
  return bounty !== null && bounty.isHot;
}

/**
 * Extract the bounty amount in sats from a bounty line.
 */
export function getBountyAmount(line: string): number {
  const bounty = parseSNBountyLine(line);
  return bounty ? bounty.amount : 0;
}

/**
 * Extract the bounty ID from a bounty line.
 */
export function getBountyId(line: string): number | null {
  const bounty = parseSNBountyLine(line);
  return bounty ? bounty.id : null;
}
