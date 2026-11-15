// src/features/outbox/store.ts
export type OutboxStatus = "queued" | "syncing" | "synced" | "conflict" | "failed";

export type OutboxKind =
  | "record-immunization"
  | "save-visit"
  | "save-prescription"
  | "set-milestone"
  | "create-measurement";

export type OutboxEntry<T = unknown> = {
  id: string;
  kind: OutboxKind;
  entityId: string;
  payload: T;
  status: OutboxStatus;
  /** Stable per *logical write* — survives retries. Server dedupes on this. */
  idempotencyKey: string;
  /** Last known server version for optimistic-concurrency (ETag/updatedAt). */
  baseVersion?: string;
  /** Local optimistic snapshot so the UI can render before sync. */
  optimisticSnapshot?: unknown;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  /** Server's canonical state when a 409 comes back. */
  serverSnapshot?: unknown;
  error?: string;
};

const DB_NAME = "g-tracker";
const DB_VERSION = 1;
const STORE = "outbox";

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("by-status", "status");
        store.createIndex("by-created", "createdAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export const outboxStore = {
  async list(): Promise<OutboxEntry[]> {
    const db = await open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE).objectStore(STORE).getAll();
      req.onsuccess = () =>
        resolve(
          (req.result as OutboxEntry[]).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        );
      req.onerror = () => reject(req.error);
    });
  },

  async byId(id: string): Promise<OutboxEntry | undefined> {
    const db = await open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE).objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result as OutboxEntry | undefined);
      req.onerror = () => reject(req.error);
    });
  },

  async put(entry: OutboxEntry): Promise<void> {
    const db = await open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, "readwrite").objectStore(STORE).put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async delete(id: string): Promise<void> {
    const db = await open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, "readwrite").objectStore(STORE).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Atomically claim the oldest `queued` entry and mark it `syncing`.
   * Uses a readwrite transaction so two tabs cannot claim the same row.
   */
  async claimNext(): Promise<OutboxEntry | undefined> {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const idx = store.index("by-status");
      const req = idx.openCursor(IDBKeyRange.only("queued"));
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return;
        const entry = cursor.value as OutboxEntry;
        const claimed: OutboxEntry = {
          ...entry,
          status: "syncing",
          updatedAt: new Date().toISOString(),
          attempts: entry.attempts + 1,
        };
        cursor.update(claimed);
        cursor.continue();
        // Resolve after tx commit — closing over `claimed` is safe
        // because IndexedDB serialises the transaction.
        tx.oncomplete = () => resolve(claimed);
      };
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },

  async clearSyncedOlderThan(ms: number): Promise<void> {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const cutoff = new Date(Date.now() - ms).toISOString();
      const idx = store.index("by-created");
      const req = idx.openCursor(IDBKeyRange.upperBound(cutoff));
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return;
        const entry = cursor.value as OutboxEntry;
        if (entry.status === "synced") cursor.delete();
        cursor.continue();
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
};
