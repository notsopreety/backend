const cacheConfig = require("../config/cache.config");

/**
 * High-Performance In-Memory Cache Store with TTL & Auto-Pruning
 */
class MemoryCache {
  constructor() {
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;

    // Periodically prune expired keys every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.prune();
    }, 60000);

    // Prevent interval from blocking process termination
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Set a key-value pair with TTL in seconds
   * @param {string} key
   * @param {any} value
   * @param {number} [ttlSeconds]
   */
  set(key, value, ttlSeconds = cacheConfig.defaultTTL) {
    if (!cacheConfig.enabled) return;

    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt, ttl: ttlSeconds });
  }

  /**
   * Get value by key. Returns null if missing or expired.
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    if (!cacheConfig.enabled) {
      this.misses++;
      return null;
    }

    const item = this.store.get(key);
    if (!item) {
      this.misses++;
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return item.value;
  }

  /**
   * Check if active key exists
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete a key
   * @param {string} key
   */
  del(key) {
    return this.store.delete(key);
  }

  /**
   * Clear all cached items
   */
  clear() {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Remove all expired entries
   */
  prune() {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get cache metrics
   */
  getStats() {
    return {
      enabled: cacheConfig.enabled,
      keysCount: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate:
        this.hits + this.misses > 0
          ? `${((this.hits / (this.hits + this.misses)) * 100).toFixed(1)}%`
          : "0%",
    };
  }
}

module.exports = new MemoryCache();
