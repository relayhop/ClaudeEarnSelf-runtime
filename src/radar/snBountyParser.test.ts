import { parseSNBounty } from './snBountyParser';

describe('parseSNBounty', () => {
  it('parses valid OPEN_BOUNTY line', () => {
    const line = '1548616\tbitcoin\t1000\t14\t6.5\tOPEN_BOUNTY\tAsking 🤔 the stackers ⚡';
    const result = parseSNBounty(line);
    expect(result).toEqual({
      id: 1548616,
      network: 'bitcoin',
      rewardSats: 1000,
      difficulty: 14,
      ratio: 6.5,
      status: 'OPEN_BOUNTY',
      description: 'Asking 🤔 the stackers ⚡'
    });
  });

  it('returns null for non-OPEN_BOUNTY status', () => {
    const line = '1548616\tbitcoin\t1000\t14\t6.5\tCLOSED_BOUNTY\tAsking 🤔 the stackers ⚡';
    expect(parseSNBounty(line)).toBeNull();
  });

  it('returns null for malformed lines', () => {
    expect(parseSNBounty('invalid\tline')).toBeNull();
  });
});