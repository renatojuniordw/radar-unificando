const CHECK_TIMEOUT_MS = 8_000;

/**
 * Checks whether a job link is dead (404/410). Any ambiguous outcome
 * (timeout, network error, 403 anti-bot block, method not allowed, etc.)
 * is treated as "alive" — we only want to flag links Gupy itself confirms
 * are gone, never false-positive a job away because of a flaky request.
 */
export async function isLinkDead(url: string): Promise<boolean> {
  if (!url) return true;

  const status = await requestStatus(url, 'HEAD');
  if (status === 404 || status === 410) return true;
  if (status !== null) return false;

  // HEAD blocked/unsupported by some hosts — retry with GET before giving up.
  const getStatus = await requestStatus(url, 'GET');
  return getStatus === 404 || getStatus === 410;
}

async function requestStatus(url: string, method: 'HEAD' | 'GET'): Promise<number | null> {
  try {
    const res = await fetch(url, {
      method,
      redirect: 'follow',
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });
    return res.status;
  } catch {
    return null;
  }
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}
