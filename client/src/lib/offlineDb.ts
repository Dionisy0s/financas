/**
 * FINANÇAS - Offline Database (IndexedDB)
 *
 * Stores local copies of financial data and a sync queue for pending mutations.
 * All writes go through this layer when offline; sync queue is drained when online.
 */

const DB_NAME = 'financas-offline';
const DB_VERSION = 1;

// ─── Store names ──────────────────────────────────────────────────────────────
export const STORES = {
  TRANSACTIONS: 'transactions',
  CATEGORIES: 'categories',
  INVESTMENTS: 'investments',
  INVESTMENT_CATEGORIES: 'investmentCategories',
  DASHBOARD_CACHE: 'dashboardCache',
  SYNC_QUEUE: 'syncQueue',
  META: 'meta',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type SyncOperation = {
  id?: number;
  /** tRPC procedure path, e.g. "transactions.create" */
  procedure: string;
  /** Serialized input payload */
  input: unknown;
  /** Timestamp when the operation was enqueued */
  enqueuedAt: number;
  /** Number of retry attempts */
  retries: number;
  /** Temporary local ID assigned while offline */
  localId?: string;
};

export type CachedDashboard = {
  key: string; // "year-month-consolidated"
  data: unknown;
  cachedAt: number;
};

// ─── DB Singleton ─────────────────────────────────────────────────────────────

let _db: IDBDatabase | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Transactions store
      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        const txStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
        txStore.createIndex('userId', 'userId', { unique: false });
        txStore.createIndex('yearMonth', ['year', 'month'], { unique: false });
      }

      // Categories store
      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
      }

      // Investments store
      if (!db.objectStoreNames.contains(STORES.INVESTMENTS)) {
        db.createObjectStore(STORES.INVESTMENTS, { keyPath: 'id' });
      }

      // Investment categories store
      if (!db.objectStoreNames.contains(STORES.INVESTMENT_CATEGORIES)) {
        db.createObjectStore(STORES.INVESTMENT_CATEGORIES, { keyPath: 'id' });
      }

      // Dashboard cache store
      if (!db.objectStoreNames.contains(STORES.DASHBOARD_CACHE)) {
        db.createObjectStore(STORES.DASHBOARD_CACHE, { keyPath: 'key' });
      }

      // Sync queue store
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        syncStore.createIndex('procedure', 'procedure', { unique: false });
        syncStore.createIndex('enqueuedAt', 'enqueuedAt', { unique: false });
      }

      // Meta store (last sync timestamps, etc.)
      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META, { keyPath: 'key' });
      }
    };

    req.onsuccess = (event) => {
      _db = (event.target as IDBOpenDBRequest).result;
      resolve(_db);
    };

    req.onerror = () => reject(req.error);
  });
}

// ─── Generic helpers ──────────────────────────────────────────────────────────

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getStore(storeName: string, mode: IDBTransactionMode = 'readonly') {
  const db = await openDb();
  return db.transaction(storeName, mode).objectStore(storeName);
}

export async function dbGetAll<T>(storeName: string): Promise<T[]> {
  const store = await getStore(storeName);
  return idbRequest<T[]>(store.getAll());
}

export async function dbGet<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  const store = await getStore(storeName);
  return idbRequest<T | undefined>(store.get(key));
}

export async function dbPut(storeName: string, value: unknown): Promise<void> {
  const store = await getStore(storeName, 'readwrite');
  await idbRequest(store.put(value));
}

export async function dbPutMany(storeName: string, values: unknown[]): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  await Promise.all(values.map((v) => idbRequest(store.put(v))));
}

export async function dbDelete(storeName: string, key: IDBValidKey): Promise<void> {
  const store = await getStore(storeName, 'readwrite');
  await idbRequest(store.delete(key));
}

export async function dbClear(storeName: string): Promise<void> {
  const store = await getStore(storeName, 'readwrite');
  await idbRequest(store.clear());
}

// ─── Sync Queue ───────────────────────────────────────────────────────────────

export async function enqueueSyncOperation(op: Omit<SyncOperation, 'id'>): Promise<number> {
  const db = await openDb();
  const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
  const store = tx.objectStore(STORES.SYNC_QUEUE);
  const id = await idbRequest<number>(store.add(op) as IDBRequest<number>);
  console.log('[OfflineDB] Enqueued sync op:', op.procedure, 'id:', id);
  return id;
}

export async function getSyncQueue(): Promise<SyncOperation[]> {
  return dbGetAll<SyncOperation>(STORES.SYNC_QUEUE);
}

export async function removeSyncOperation(id: number): Promise<void> {
  await dbDelete(STORES.SYNC_QUEUE, id);
}

export async function updateSyncOperationRetries(id: number, retries: number): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
  const store = tx.objectStore(STORES.SYNC_QUEUE);
  const op = await idbRequest<SyncOperation>(store.get(id));
  if (op) {
    op.retries = retries;
    await idbRequest(store.put(op));
  }
}

export async function getSyncQueueCount(): Promise<number> {
  const store = await getStore(STORES.SYNC_QUEUE);
  return idbRequest<number>(store.count());
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

export async function cacheDashboard(key: string, data: unknown): Promise<void> {
  await dbPut(STORES.DASHBOARD_CACHE, { key, data, cachedAt: Date.now() });
}

export async function getCachedDashboard(key: string): Promise<CachedDashboard | undefined> {
  return dbGet<CachedDashboard>(STORES.DASHBOARD_CACHE, key);
}

export async function cacheTransactions(transactions: unknown[]): Promise<void> {
  await dbPutMany(STORES.TRANSACTIONS, transactions);
}

export async function getLocalTransactions(year: number, month: number): Promise<unknown[]> {
  const db = await openDb();
  const tx = db.transaction(STORES.TRANSACTIONS, 'readonly');
  const store = tx.objectStore(STORES.TRANSACTIONS);
  const index = store.index('yearMonth');
  return idbRequest<unknown[]>(index.getAll([year, month]));
}

export async function cacheCategories(categories: unknown[]): Promise<void> {
  await dbClear(STORES.CATEGORIES);
  await dbPutMany(STORES.CATEGORIES, categories);
}

export async function getLocalCategories(): Promise<unknown[]> {
  return dbGetAll(STORES.CATEGORIES);
}

export async function cacheInvestments(investments: unknown[]): Promise<void> {
  await dbClear(STORES.INVESTMENTS);
  await dbPutMany(STORES.INVESTMENTS, investments);
}

export async function getLocalInvestments(): Promise<unknown[]> {
  return dbGetAll(STORES.INVESTMENTS);
}

export async function cacheInvestmentCategories(cats: unknown[]): Promise<void> {
  await dbClear(STORES.INVESTMENT_CATEGORIES);
  await dbPutMany(STORES.INVESTMENT_CATEGORIES, cats);
}

export async function getLocalInvestmentCategories(): Promise<unknown[]> {
  return dbGetAll(STORES.INVESTMENT_CATEGORIES);
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

export async function setMeta(key: string, value: unknown): Promise<void> {
  await dbPut(STORES.META, { key, value });
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const record = await dbGet<{ key: string; value: T }>(STORES.META, key);
  return record?.value;
}

// ─── Local ID generator ───────────────────────────────────────────────────────

export function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
