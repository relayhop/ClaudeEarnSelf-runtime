import { describe, it, expect } from 'vitest';
import {
  scanForBounties,
  formatBounty,
  formatBounties,
} from '../../src/radar/scanner';
import { Bounty } from '../../src/types/bounty';

describe('scanForBounties', () => {
  const rawData = [
    '1549793\tbitcoin\t5000\t18\t19.0\tOPEN_BOUNTY,HOT\t\u26a1Best tips for running a profitable lighting node?\u26a1',
    '2000001\tbitcoin\t10000\t25\t25.0\tOPEN_BOUNTY,VERIFIED\tAnother bounty',
    '2000002\tmonero\t7500\t3\t5.0\tCLOSED_BOUNTY\tClosed bounty',
  ].join('\n');

  it('parses all valid bounties', () => {
    const result = scanForBounties(rawData);
    expect(result.allBounties).toHaveLength(3);
  });

  it('filters open bounties correctly', () => {
    const result = scanForBounties(rawData);
    expect(result.openBounties).toHaveLength(2);
  });

  it('filters hot bounties from open set', () => {
    const result = scanForBounties(rawData);
    expect(result.hotBounties).toHaveLength(1);
    expect(result.hotBounties[0].id).toBe(1549793);
  });

  it('sorts open bounties by score descending', () => {
    const result = scanForBounties(rawData);
    expect(result.openBounties[0].score).toBeGreaterThanOrEqual(
      result.openBounties[1].score
    );
  });

  it('handles empty input gracefully', () => {
    const result = scanForBounties('');
    expect(result.allBounties).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('handles malformed input gracefully', () => {
    const result = scanForBounties('not a valid bounty line');
    expect(result.allBounties).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('handles mixed valid and invalid lines', () => {
    const mixed = [
      '1549793\tbitcoin\t5000\t18\t19.0\tOPEN_BOUNTY,HOT\tValid bounty',
      'invalid line here',
      '2000001\tbitcoin\t10000\t25\t25.0\tOPEN_BOUNTY\tAlso valid',
    ].join('\n');
    const result = scanForBounties(mixed);
    expect(result.allBounties).toHaveLength(2);
  });
});

describe('formatBounty', () => {
  it('formats bounty back to TSV', () => {
    const bounty: Bounty = {
      id: 123,
      currency: 'bitcoin',
      amount: 5000,
      replies: 18,
      score: 19.0,
      tags: ['OPEN_BOUNTY', 'HOT'],
      status: 'OPEN_BOUNTY',
      title: 'Test bounty',
    };
    const formatted = formatBounty(bounty);
    expect(formatted).toBe(
      '123\tbitcoin\t5000\t18\t19.0\tOPEN_BOUNTY,HOT\tTest bounty'
    );
  });

  it('rounds score to 1 decimal place', () => {
    const bounty: Bounty = {
      id: 123,
      currency: 'bitcoin',
      amount: 5000,
      replies: 18,
      score: 19.05,
      tags: ['OPEN_BOUNTY'],
      status: 'OPEN_BOUNTY',
      title: 'Test',
    };
    const formatted = formatBounty(bounty);
    expect(formatted).toContain('19.1');
  });
});

describe('formatBounties', () => {
  it('formats multiple bounties', () => {
    const bounties: Bounty[] = [
      {
        id: 1,
        currency: 'bitcoin',
        amount: 1000,
        replies: 5,
        score: 10.0,
        tags: ['OPEN_BOUNTY'],
        status: 'OPEN_BOUNTY',
        title: 'First',
      },
      {
        id: 2,
        currency: 'bitcoin',
        amount: 2000,
        replies: 10,
        score: 20.0,
        tags: ['OPEN_BOUNTY'],
        status: 'OPEN_BOUNTY',
        title: 'Second',
      },
    ];
    const formatted = formatBounties(bounties);
    expect(formatted.split('\n')).toHaveLength(2);
  });

  it('returns empty string for empty array', () => {
    expect(formatBounties([])).toBe('');
  });
});
