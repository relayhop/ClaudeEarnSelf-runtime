import fs from 'fs';
import path from 'path';

const BOUNTIES_DIR = path.join(process.cwd(), 'bounties');

export interface Bounty {
  id: number;
  source: string;
  currency: string;
  amount: number;
  tags: string[];
  status: 'open' | 'closed';
  answer?: { summary: string; points: string[] };
}

/**
 * Load a bounty by id. Returns null when the bounty file is missing,
 * malformed, or the id is not a safe positive integer.
 */
export function getBountyById(id: number): Bounty | null {
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  const file = path.join(BOUNTIES_DIR, `${id}.json`);

  // Reject any path traversal attempt (e.g. id parsed from user input).
  if (!file.startsWith(BOUNTIES_DIR + path.sep)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw) as Bounty;

    if (typeof parsed.id !== 'number' || parsed.id !== id) {
      return null;
    }
    if (!Array.isArray(parsed.tags) || typeof parsed.status !== 'string') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Return the answer payload for a bounty, if one has been authored.
 * Bounties tagged OPEN_BOUNTY without an answer return null so callers
 * can route them to the drafting queue.
 */
export function getBountyAnswer(id: number): { summary: string; points: string[] } | null {
  const bounty = getBountyById(id);
  if (!bounty || !bounty.answer || !Array.isArray(bounty.answer.points)) {
    return null;
  }
  return bounty.answer;
}
