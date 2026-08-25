import { describe, it, expect } from 'vitest';
import { parseBountyLine, BountyStatus } from './bountyParser';

describe('parseBountyLine', () => {
  it('should parse a standard bounty line with emojis', () => {
    const line = '1548616\tbitcoin\t1000\t14\t13.1\tOPEN_BOUNTY\tAsking 🤔 the stackers ⚡';
    const result = parseBountyLine(line);
    expect(result.id).toBe(1548616);
    expect(result.network).toBe('bitcoin');
    expect(result.amount).toBe(1000);
    expect(result.confirmations).toBe(14);
    expect(result.fee).toBe(13.1);
    expect(result.status).toBe(BountyStatus.OPEN_BOUNTY);
    expect(result.title).toBe('Asking 🤔 the stackers ⚡');
  });

  it('should throw on invalid format', () => {
    expect(() => parseBountyLine('invalid line')).toThrow('Invalid bounty line format');
  });

  it('should throw on unknown status', () => {
    const line = '1548616\tbitcoin\t1000\t14\t13.1\tUNKNOWN_STATUS\tTitle';
    expect(() => parseBountyLine(line)).toThrow('Unknown bounty status');
  });
});
