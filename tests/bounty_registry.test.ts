import { describe, expect, it } from 'vitest';
import { getBountyAnswer, getBountyById } from '../src/radar/bounty_registry';

describe('bounty registry', () => {
  it('loads bounty 1549793 from disk', () => {
    const bounty = getBountyById(1549793);
    expect(bounty).not.toBeNull();
    expect(bounty!.source).toBe('SN');
    expect(bounty!.currency).toBe('bitcoin');
    expect(bounty!.amount).toBe(5000);
    expect(bounty!.tags).toContain('OPEN_BOUNTY');
  });

  it('returns the authored answer for bounty 1549793', () => {
    const answer = getBountyAnswer(1549793);
    expect(answer).not.toBeNull();
    expect(answer!.points.length).toBeGreaterThan(5);
    expect(answer!.summary).toContain('Lightning');
  });

  it('returns null for a missing bounty', () => {
    expect(getBountyById(999999999)).toBeNull();
  });

  it('rejects invalid ids without touching the filesystem unexpectedly', () => {
    expect(getBountyById(0)).toBeNull();
    expect(getBountyById(-1)).toBeNull();
    expect(getBountyById(1.5)).toBeNull();
    expect(getBountyById(NaN)).toBeNull();
  });
});
