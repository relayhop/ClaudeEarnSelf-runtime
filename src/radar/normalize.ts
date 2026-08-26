import { Bounty } from '../types/radar';

export function normalizeBountyTitle(title: string): string {
  return title
    .replace(/[\u26a1\u2728\u2b50\u2764\ufe0f]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function normalizeBountyForStorage(bounty: Bounty): Record<string, unknown> {
  return {
    item_id: bounty.item_id,
    currency: bounty.currency,
    amount: bounty.amount,
    upvotes: bounty.upvotes,
    score: bounty.score,
    tags: bounty.tags,
    title: bounty.title,
    raw_title: bounty.raw_title,
    detected_at: new Date().toISOString(),
    source: 'stacker_news',
    status: bounty.status,
    url: bounty.url,
    bounty_amount_sats: bounty.amount,
    priority: determinePriority(bounty),
    category: bounty.category,
    keywords: bounty.keywords,
  };
}

export function determinePriority(bounty: Bounty): 'low' | 'medium' | 'high' {
  if (bounty.tags.includes('HOT') && bounty.amount >= 5000) {
    return 'high';
  }
  if (bounty.amount >= 2000 || bounty.tags.includes('HOT')) {
    return 'medium';
  }
  return 'low';
}

export function isDuplicateBounty(
  bounty: Bounty,
  existingIds: Set<number>
): boolean {
  return existingIds.has(bounty.item_id);
}

export function extractBountyId(rawLine: string): number | null {
  const match = rawLine.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export function parseRadarLine(line: string): Partial<Bounty> | null {
  const parts = line.split('\t');
  if (parts.length < 7) {
    return null;
  }

  const [idStr, currency, amountStr, upvotesStr, scoreStr, tagsStr, titleStr] = parts;

  const item_id = parseInt(idStr, 10);
  if (isNaN(item_id)) {
    return null;
  }

  const amount = parseInt(amountStr, 10);
  const upvotes = parseInt(upvotesStr, 10);
  const score = parseFloat(scoreStr);
  const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
  const raw_title = titleStr ?? '';
  const title = normalizeBountyTitle(raw_title);

  return {
    item_id,
    currency,
    amount,
    upvotes,
    score,
    tags,
    title,
    raw_title,
    status: 'open',
  };
}
