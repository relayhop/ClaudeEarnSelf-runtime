import { Bounty, BountyStatus, BountyTag, ParsedBountyLine } from '../types/bounty';

const FIELD_SEPARATOR = '\t';
const TAG_SEPARATOR = ',';
const MIN_FIELDS = 7;
const MAX_FIELDS = 7;

const KNOWN_STATUSES: BountyStatus[] = [
  'OPEN_BOUNTY',
  'CLOSED_BOUNTY',
  'CANCELLED_BOUNTY',
  'PENDING_BOUNTY',
];

const KNOWN_TAGS: BountyTag[] = [
  'OPEN_BOUNTY',
  'CLOSED_BOUNTY',
  'CANCELLED_BOUNTY',
  'PENDING_BOUNTY',
  'HOT',
  'VERIFIED',
  'URGENT',
  'FEATURED',
  'EXPIRED',
];

export class BountyParseError extends Error {
  constructor(message: string, public readonly rawLine?: string) {
    super(message);
    this.name = 'BountyParseError';
  }
}

function parseInteger(value: string, fieldName: string): number {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new BountyParseError(
      `Invalid integer for field "${fieldName}": "${value}"`
    );
  }
  const num = parseInt(trimmed, 10);
  if (!Number.isSafeInteger(num)) {
    throw new BountyParseError(
      `Integer overflow for field "${fieldName}": "${value}"`
    );
  }
  return num;
}

function parseFloatValue(value: string, fieldName: string): number {
  const trimmed = value.trim();
  if (trimmed === '' || !/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new BountyParseError(
      `Invalid float for field "${fieldName}": "${value}"`
    );
  }
  return parseFloat(trimmed);
}

function parseTags(value: string): BountyTag[] {
  if (!value || value.trim() === '') {
    return [];
  }
  const tags = value
    .split(TAG_SEPARATOR)
    .map((t) => t.trim().toUpperCase() as BountyTag)
    .filter((t) => t !== '');

  for (const tag of tags) {
    if (!KNOWN_TAGS.includes(tag)) {
      throw new BountyParseError(`Unknown tag: "${tag}"`);
    }
  }

  const unique = [...new Set(tags)];
  return unique;
}

function extractStatus(tags: BountyTag[]): BountyStatus {
  const statusTags = tags.filter((t) =>
    KNOWN_STATUSES.includes(t as BountyStatus)
  ) as BountyStatus[];

  if (statusTags.length === 0) {
    throw new BountyParseError('No bounty status tag found');
  }
  if (statusTags.length > 1) {
    throw new BountyParseError(
      `Multiple conflicting status tags: ${statusTags.join(', ')}`
    );
  }
  return statusTags[0];
}

function validateTitle(title: string): string {
  if (title === undefined || title === null) {
    throw new BountyParseError('Title is null or undefined');
  }
  const trimmed = title.trim();
  if (trimmed === '') {
    throw new BountyParseError('Title is empty');
  }
  return title;
}

export function parseBountyLine(line: string): Bounty {
  if (!line || typeof line !== 'string') {
    throw new BountyParseError('Input line is empty or not a string');
  }

  const trimmedLine = line.trim();
  if (trimmedLine === '') {
    throw new BountyParseError('Input line is empty after trimming');
  }

  if (trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) {
    throw new BountyParseError('Input line is a comment');
  }

  const fields = trimmedLine.split(FIELD_SEPARATOR);

  if (fields.length < MIN_FIELDS) {
    throw new BountyParseError(
      `Expected at least ${MIN_FIELDS} fields, got ${fields.length}`,
      trimmedLine
    );
  }

  if (fields.length > MAX_FIELDS) {
    throw new BountyParseError(
      `Expected at most ${MAX_FIELDS} fields, got ${fields.length}`,
      trimmedLine
    );
  }

  const [
    idRaw,
    currencyRaw,
    amountRaw,
    repliesRaw,
    scoreRaw,
    tagsRaw,
    titleRaw,
  ] = fields;

  const id = parseInteger(idRaw, 'id');
  const currency = currencyRaw.trim().toLowerCase();
  if (currency === '') {
    throw new BountyParseError('Currency field is empty');
  }
  if (!/^[a-z]+$/.test(currency)) {
    throw new BountyParseError(
      `Invalid currency format: "${currencyRaw}"`
    );
  }
  const amount = parseInteger(amountRaw, 'amount');
  if (amount < 0) {
    throw new BountyParseError(`Amount cannot be negative: ${amount}`);
  }
  const replies = parseInteger(repliesRaw, 'replies');
  const score = parseFloatValue(scoreRaw, 'score');
  const tags = parseTags(tagsRaw);
  const status = extractStatus(tags);
  const title = validateTitle(titleRaw);

  return {
    id,
    currency,
    amount,
    replies,
    score,
    tags,
    status,
    title,
  };
}

export function parseBountyLines(lines: string[]): Bounty[] {
  const results: Bounty[] = [];
  const errors: { line: string; error: string }[] = [];

  for (const line of lines) {
    try {
      const bounty = parseBountyLine(line);
      results.push(bounty);
    } catch (err) {
      if (err instanceof BountyParseError) {
        errors.push({
          line,
          error: err.message,
        });
      } else {
        throw err;
      }
    }
  }

  if (errors.length > 0 && results.length === 0) {
    throw new BountyParseError(
      `All ${errors.length} line(s) failed to parse. First error: ${errors[0].error}`
    );
  }

  return results;
}

export function parseBountyText(text: string): Bounty[] {
  if (!text || typeof text !== 'string') {
    throw new BountyParseError('Input text is empty or not a string');
  }
  const lines = text.split('\n').filter((l) => l.trim() !== '');
  return parseBountyLines(lines);
}

export function isBountyStatusOpen(bounty: Bounty): boolean {
  return bounty.status === 'OPEN_BOUNTY';
}

export function filterOpenBounties(bounties: Bounty[]): Bounty[] {
  return bounties.filter(isBountyStatusOpen);
}

export function filterByTag(bounties: Bounty[], tag: BountyTag): Bounty[] {
  return bounties.filter((b) => b.tags.includes(tag));
}

export function sortByScore(bounties: Bounty[], descending = true): Bounty[] {
  const sorted = [...bounties].sort((a, b) => a.score - b.score);
  return descending ? sorted.reverse() : sorted;
}

export function summarizeBounties(bounties: Bounty[]): ParsedBountyLine {
  const open = bounties.filter(isBountyStatusOpen);
  const hot = filterByTag(bounties, 'HOT' as BountyTag);
  const totalAmount = bounties.reduce((sum, b) => sum + b.amount, 0);

  return {
    total: bounties.length,
    openCount: open.length,
    hotCount: hot.length,
    totalAmount,
    currencies: [...new Set(bounties.map((b) => b.currency))],
  };
}
