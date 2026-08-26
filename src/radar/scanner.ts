import {
  Bounty,
  BountyTag,
  BountyStatus,
} from '../types/bounty';
import {
  parseBountyText,
  filterOpenBounties,
  filterByTag,
  sortByScore,
  BountyParseError,
} from './bountyParser';

export interface ScanResult {
  openBounties: Bounty[];
  hotBounties: Bounty[];
  allBounties: Bounty[];
  errors: string[];
}

export function scanForBounties(rawData: string): ScanResult {
  const errors: string[] = [];
  let allBounties: Bounty[] = [];

  try {
    allBounties = parseBountyText(rawData);
  } catch (err) {
    if (err instanceof BountyParseError) {
      errors.push(err.message);
    } else {
      throw err;
    }
  }

  const openBounties = filterOpenBounties(allBounties);
  const hotBounties = filterByTag(openBounties, 'HOT' as BountyTag);
  const sortedOpen = sortByScore(openBounties, true);
  const sortedHot = sortByScore(hotBounties, true);

  return {
    openBounties: sortedOpen,
    hotBounties: sortedHot,
    allBounties,
    errors,
  };
}

export function formatBounty(bounty: Bounty): string {
  const tagsStr = bounty.tags.join(',');
  return [
    bounty.id,
    bounty.currency,
    bounty.amount,
    bounty.replies,
    bounty.score.toFixed(1),
    tagsStr,
    bounty.title,
  ].join('\t');
}

export function formatBounties(bounties: Bounty[]): string {
  return bounties.map(formatBounty).join('\n');
}

export { BountyParseError } from './bountyParser';
