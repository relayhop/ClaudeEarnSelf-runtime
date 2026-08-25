import { Logger } from '../utils/logger';
import { parseBountyLine } from '../parsers/bountyParser';

export function handleBountyEvent(rawLine: string): boolean {
  const bounty = parseBountyLine(rawLine);
  if (!bounty) {
    return false;
  }
  
  if (bounty.status === 'OPEN_BOUNTY') {
    Logger.info(`Detected OPEN_BOUNTY for ${bounty.asset}: ${bounty.description}`);
    return true;
  }
  
  return false;
}
