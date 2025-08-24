// Simple request cache to prevent duplicate API calls
class RequestCache {
  private cache = new Map<string, { promise: Promise<any>; timestamp: number }>();
  private readonly CACHE_DURATION = 5000; // 5 seconds

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);

    // If we have a cached request that's still fresh, return it
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.promise;
    }

    // Create new request
    const promise = fetcher();
    this.cache.set(key, { promise, timestamp: now });

    // Clean up cache entry after completion
    promise.finally(() => {
      setTimeout(() => {
        this.cache.delete(key);
      }, this.CACHE_DURATION);
    });

    return promise;
  }

  clear() {
    this.cache.clear();
  }
}

export const requestCache = new RequestCache();
