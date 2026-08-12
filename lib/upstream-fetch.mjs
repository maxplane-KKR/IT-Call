const TRANSIENT_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryable(error) {
  return error?.name === "AbortError"
    || error?.retryable === true
    || error instanceof TypeError;
}

export async function fetchWithTimeoutRetry(url, {
  attempts = 2,
  timeoutMs = 8_000,
  retryDelayMs = 250,
  fetchImpl = fetch,
  waitImpl = wait,
} = {}) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(url, {
        cache: "no-store",
        redirect: "follow",
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = new Error(`Upstream returned ${response.status}`);
        error.retryable = TRANSIENT_STATUS.has(response.status);
        throw error;
      }

      return response;
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === attempts) throw error;
      await waitImpl(retryDelayMs * attempt);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError;
}
