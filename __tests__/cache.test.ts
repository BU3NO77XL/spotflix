import { describe, it, expect } from 'vitest';
import { checkIsOnNetflix } from '@/lib/netflixCache';
import { checkHasNewSeason } from '@/lib/newSeasonCache';

describe('Cache Utilities', () => {
  it('should return boolean for checkIsOnNetflix', async () => {
    const result = await checkIsOnNetflix(12345, 'movie');
    expect(typeof result).toBe('boolean');
  });

  it('should return boolean for checkHasNewSeason', async () => {
    const result = await checkHasNewSeason(12345);
    expect(typeof result).toBe('boolean');
  });
});
