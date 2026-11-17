// src/db/cache.ts

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  staleUntil: number;
  ttl: number;
}
export type CacheLookup<T> =
  | { state: "fresh"; data: T }
  | { state: "stale"; data: T }
  | { state: "miss" };

interface CacheOptions {
  staleWhileRevalidate?: number;
  tags?: string[];
  ttl: number;
}

const DEFAULT_MAX_CACHE_SIZE = 10_000;
/** Fraction of the cache to drop when the size cap is exceeded. */
const OVERFLOW_DROP_RATIO = 0.2;

export class QueryCache {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly tagMap = new Map<string, Set<string>>();
  private readonly defaultTTL = 60_000;
  private readonly maxSize: number;
  private lastSweep = 0;
  private static readonly SWEEP_INTERVAL_MS = 5000;

  private readonly ttlConfig: Record<string, number> = {
    appointment: 15_000,
    clinic: 60_000,
    patient: 30_000,
    static: 300_000,
  };

  constructor(maxSize = DEFAULT_MAX_CACHE_SIZE) {
    this.maxSize = maxSize;
  }

  getTTL(entityType: string): number {
    return this.ttlConfig[entityType] ?? this.defaultTTL;
  }
  lookup<T>(key: string, guard: (v: unknown) => v is T): CacheLookup<T> {
    this.maybeSweep();
    const entry = this.cache.get(key);
    if (!entry) return { state: "miss" };

    const now = Date.now();
    if (now < entry.expiresAt) {
      return guard(entry.data) ? { state: "fresh", data: entry.data } : { state: "miss" };
    }
    if (now < entry.staleUntil) {
      return guard(entry.data) ? { state: "stale", data: entry.data } : { state: "miss" };
    }
    this.cache.delete(key);
    this.removeFromTags(key);
    return { state: "miss" };
  }
  private maybeSweep(): void {
    const now = Date.now();
    if (now - this.lastSweep < QueryCache.SWEEP_INTERVAL_MS) return;
    if (this.cache.size <= this.maxSize) return;
    this.lastSweep = now;
    this.sweepIfOversized();
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.removeFromTags(key);
        this.cache.delete(key);
      }
    }
  }

  /**
   * Raw access — returns whatever was stored as `unknown`.
   * Callers must narrow (`if (typeof v === 'string') …`) or cast.
   */
  get(key: string): unknown {
    this.maybeSweep();
    this.sweepIfOversized();

    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now < entry.expiresAt) return entry.data;
    if (now < entry.staleUntil) return entry.data;

    this.cache.delete(key);
    this.removeFromTags(key);
    return null;
  }

  /**
   * Typed access — caller supplies a type guard. The guard is the
   * *only* thing that makes the return type safe. On miss or type
   * mismatch, returns `null`.
   */
  getAs<T>(key: string, guard: (value: unknown) => value is T): T | null {
    const value = this.get(key);
    return value !== null && guard(value) ? value : null;
  }

  /**
   * Stores `data`. Returns the same value so callers can chain, and
   * so the type parameter is genuinely doing work (`T` appears in the
   * parameter *and* the return position).
   */
  set<T>(key: string, data: T, options: Partial<CacheOptions> = {}): T {
    this.maybeSweep();
    this.sweepIfOversized();
    this.removeFromTags(key);

    const now = Date.now();
    const ttl = Math.max(0, options.ttl ?? this.defaultTTL);
    const staleWhileRevalidate = Math.max(0, options.staleWhileRevalidate ?? ttl * 0.5);

    this.cache.set(key, {
      data,
      expiresAt: now + ttl,
      staleUntil: now + ttl + staleWhileRevalidate,
      timestamp: now,
      ttl,
    });

    for (const tag of options.tags ?? []) {
      let keys = this.tagMap.get(tag);
      if (!keys) {
        keys = new Set();
        this.tagMap.set(tag, keys);
      }
      keys.add(key);
    }

    return data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    this.removeFromTags(key);
  }

  invalidateTag(tag: string): void {
    const keys = this.tagMap.get(tag);
    if (!keys) return;

    // Snapshot: `removeFromTags` mutates `tagMap` while we iterate.
    for (const key of keys) {
      this.cache.delete(key);
      this.removeFromTags(key);
    }
    this.tagMap.delete(tag);
  }

  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        this.removeFromTags(key);
      }
    }
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  get size(): number {
    return this.cache.size;
  }

  private removeFromTags(key: string): void {
    for (const [tag, keys] of this.tagMap) {
      keys.delete(key);
      if (keys.size === 0) this.tagMap.delete(tag);
    }
  }
  // src/db/cache.ts
  private lastOversizeSweep = 0;
  private static readonly OVERSIZE_SWEEP_INTERVAL_MS = 1_000;

  private sweepIfOversized(): void {
    if (this.cache.size <= this.maxSize) return;

    const now = Date.now();
    if (now - this.lastOversizeSweep < QueryCache.OVERSIZE_SWEEP_INTERVAL_MS) return;
    this.lastOversizeSweep = now;

    // Pass 1: drop expired.
    for (const [key, entry] of this.cache) {
      if (now > entry.staleUntil) {
        this.cache.delete(key);
        this.removeFromTags(key);
      }
    }
    if (this.cache.size <= this.maxSize) return;

    // Pass 2: drop the oldest 20%.
    const entries = [...this.cache.entries()].toSorted((a, b) => a[1].timestamp - b[1].timestamp);
    const dropCount = Math.max(1, Math.floor(entries.length * OVERFLOW_DROP_RATIO));
    for (let i = 0; i < dropCount; i += 1) {
      const entry = entries[i];
      if (!entry) continue;
      this.cache.delete(entry[0]);
      this.removeFromTags(entry[0]);
    }
  }

  clear(): void {
    this.cache.clear();
    this.tagMap.clear();
  }

  getStats(): { size: number; tagCount: number } {
    return { size: this.cache.size, tagCount: this.tagMap.size };
  }
}

export const queryCache = new QueryCache();

// ============================================================
// Prepared Statement Cache
// ============================================================

export class PreparedQueryCache {
  private readonly prepared = new Map<string, unknown>();

  /** Raw access — callers must narrow. */
  get(key: string): unknown {
    return this.prepared.has(key) ? this.prepared.get(key) : null;
  }

  /** Typed access with a guard, mirroring `QueryCache.getAs`. */
  getAs<T>(key: string, guard: (value: unknown) => value is T): T | undefined {
    const value = this.prepared.get(key);
    return value !== undefined && guard(value) ? value : undefined;
  }

  /**
   * Stores `query`. Returns it for symmetry with `QueryCache.set`
   * (keeps `T` in both parameter and return positions).
   */
  set<T>(key: string, query: T): T {
    this.prepared.set(key, query);
    return query;
  }

  has(key: string): boolean {
    return this.prepared.has(key);
  }

  clear(): void {
    this.prepared.clear();
  }
}

export const preparedQueries = new PreparedQueryCache();
// src/db/cache.ts
export async function cached<T>(
  cache: QueryCache,
  key: string,
  guard: (v: unknown) => v is T,
  revalidate: () => Promise<T>,
  options: CacheOptions,
): Promise<T> {
  const hit = cache.lookup(key, guard);
  if (hit.state === "fresh") return hit.data;
  if (hit.state === "stale") {
    // Serve stale immediately, revalidate in the background.
    void revalidate()
      .then((fresh) => cache.set(key, fresh, options))
      .catch((err) => console.error("SWR revalidation failed", key, err));
    return hit.data;
  }
  const fresh = await revalidate();
  cache.set(key, fresh, options);
  return fresh;
}
