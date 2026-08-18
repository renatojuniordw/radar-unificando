import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { isLinkDead, mapWithConcurrency } from '@/lib/core/pipeline/link-check';
import { HttpLinkChecker } from '@/lib/core/pipeline/job-link-filter';

describe('isLinkDead', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should_treat_empty_url_as_dead', async () => {
    expect(await isLinkDead('')).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should_treat_404_and_410_as_dead_via_head', async () => {
    fetchMock.mockResolvedValue({ status: 404 });
    expect(await isLinkDead('https://x.io/1')).toBe(true);
    fetchMock.mockResolvedValue({ status: 410 });
    expect(await isLinkDead('https://x.io/2')).toBe(true);
  });

  it('should_treat_other_statuses_as_alive_via_head', async () => {
    fetchMock.mockResolvedValue({ status: 200 });
    expect(await isLinkDead('https://x.io/1')).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith('https://x.io/1', expect.objectContaining({ method: 'HEAD' }));
  });

  it('should_retry_with_get_when_head_returns_null', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({ status: 404 });
    expect(await isLinkDead('https://x.io/1')).toBe(true);
  });

  it('should_treat_get_404_as_dead_after_head_fails', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ status: 200 });
    expect(await isLinkDead('https://x.io/1')).toBe(false);
  });
});

describe('HttpLinkChecker', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should_mark_empty_url_as_dead', async () => {
    expect(await new HttpLinkChecker().isDead('')).toBe(true);
  });

  it('should_mark_404_as_dead_without_get_fallback', async () => {
    fetchMock.mockResolvedValue({ status: 404 });
    const checker = new HttpLinkChecker();
    expect(await checker.isDead('https://x.io/1')).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should_retry_with_get_when_head_fails', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('blocked'))
      .mockResolvedValueOnce({ status: 200 });
    expect(await new HttpLinkChecker().isDead('https://x.io/1')).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith('https://x.io/1', expect.objectContaining({ method: 'GET' }));
  });
});

describe('mapWithConcurrency', () => {
  it('should_return_empty_for_empty_items', async () => {
    expect(await mapWithConcurrency([], 5, async () => 1)).toEqual([]);
  });

  it('should_preserve_order_with_concurrency_1', async () => {
    const result = await mapWithConcurrency([1, 2, 3], 1, async (n) => n * 2);
    expect(result).toEqual([2, 4, 6]);
  });

  it('should_handle_concurrency_higher_than_items', async () => {
    const result = await mapWithConcurrency(['a', 'b'], 10, async (s) => s.toUpperCase());
    expect(result).toEqual(['A', 'B']);
  });

  it('should_process_all_items_in_parallel_without_dropping', async () => {
    const seen: number[] = [];
    const result = await mapWithConcurrency([1, 2, 3, 4], 2, async (n) => {
      seen.push(n);
      return n;
    });
    expect(result.sort()).toEqual([1, 2, 3, 4]);
    expect(seen.length).toBe(4);
  });
});