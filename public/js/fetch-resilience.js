const TRANSIENT_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

function wait(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

export async function fetchJsonWithRetry(url, {
  timeoutMs = 50_000,
  attempts = 2,
  retryDelayMs = 750,
} = {}) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        redirect: 'follow',
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = new Error(`HTTP Status ${response.status}`);
        error.retryable = TRANSIENT_STATUS.has(response.status);
        throw error;
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      const retryableNetworkError = error?.name === 'AbortError'
        || error?.retryable
        || error instanceof TypeError;
      if (!retryableNetworkError || attempt === attempts) throw error;
      await wait(retryDelayMs * attempt);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  throw lastError;
}
