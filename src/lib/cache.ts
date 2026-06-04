/**
 * Sistema de Cache Multi-layer - PriceCompare
 * Implementa cache em memória com LRU e TTL para otimização de performance
 */

interface CacheItem<T> {
	value: T;
	expiresAt: number;
	accessCount: number;
	lastAccessed: number;
	size: number;
}

interface CacheOptions {
	ttl?: number; // Time to live in milliseconds
	maxSize?: number; // Maximum cache size in MB
	maxItems?: number; // Maximum number of items
}

interface CacheStats {
	hits: number;
	misses: number;
	evictions: number;
	size: number;
	itemCount: number;
	hitRate: number;
}

export class LRUCache<T> {
	private cache = new Map<string, CacheItem<T>>();
	private accessOrder: string[] = [];
	private stats: CacheStats = {
		hits: 0,
		misses: 0,
		evictions: 0,
		size: 0,
		itemCount: 0,
		hitRate: 0,
	};

	constructor(
		private options: Required<CacheOptions> = {
			ttl: 5 * 60 * 1000, // 5 minutes
			maxSize: 50, // 50MB
			maxItems: 1000,
		},
	) {}

	private calculateSize(value: T): number {
		// Rough estimate of object size in bytes
		const str = JSON.stringify(value);
		return new Blob([str]).size;
	}

	private evictExpired(): void {
		const now = Date.now();
		const toEvict: string[] = [];

		for (const [key, item] of this.cache) {
			if (item.expiresAt < now) {
				toEvict.push(key);
			}
		}

		for (const key of toEvict) {
			this.delete(key);
		}
	}

	private evictLRU(): void {
		if (this.accessOrder.length === 0) return;

		const oldestKey = this.accessOrder[0];
		if (oldestKey === undefined) return;
		this.delete(oldestKey);
		this.stats.evictions++;
	}

	private updateAccess(key: string): void {
		// Remove from current position
		const index = this.accessOrder.indexOf(key);
		if (index > -1) {
			this.accessOrder.splice(index, 1);
		}

		// Add to end (most recent)
		this.accessOrder.push(key);

		// Update access info
		const item = this.cache.get(key);
		if (item) {
			item.lastAccessed = Date.now();
			item.accessCount++;
		}
	}

	set(key: string, value: T, ttl?: number): void {
		this.evictExpired();

		const size = this.calculateSize(value);
		const expiresAt = Date.now() + (ttl || this.options.ttl);

		// Check size limits
		while (
			this.stats.size + size > this.options.maxSize * 1024 * 1024 ||
			this.cache.size >= this.options.maxItems
		) {
			this.evictLRU();
		}

		// Remove existing item if updating
		if (this.cache.has(key)) {
			const existingItem = this.cache.get(key);
			if (existingItem) {
				this.stats.size -= existingItem.size;
			}
		}

		const item: CacheItem<T> = {
			value,
			expiresAt,
			accessCount: 0,
			lastAccessed: Date.now(),
			size,
		};

		this.cache.set(key, item);
		this.updateAccess(key);
		this.stats.size += size;
		this.stats.itemCount = this.cache.size;
	}

	get(key: string): T | undefined {
		this.evictExpired();

		const item = this.cache.get(key);

		if (!item) {
			this.stats.misses++;
			this.updateHitRate();
			return undefined;
		}

		if (item.expiresAt < Date.now()) {
			this.delete(key);
			this.stats.misses++;
			this.updateHitRate();
			return undefined;
		}

		this.updateAccess(key);
		this.stats.hits++;
		this.updateHitRate();

		return item.value;
	}

	has(key: string): boolean {
		this.evictExpired();
		const item = this.cache.get(key);
		return item !== undefined && item.expiresAt >= Date.now();
	}

	delete(key: string): boolean {
		const item = this.cache.get(key);
		if (!item) return false;

		this.cache.delete(key);
		this.stats.size -= item.size;
		this.stats.itemCount = this.cache.size;

		// Remove from access order
		const index = this.accessOrder.indexOf(key);
		if (index > -1) {
			this.accessOrder.splice(index, 1);
		}

		return true;
	}

	clear(): void {
		this.cache.clear();
		this.accessOrder = [];
		this.stats.size = 0;
		this.stats.itemCount = 0;
	}

	private updateHitRate(): void {
		const total = this.stats.hits + this.stats.misses;
		this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
	}

	getStats(): CacheStats {
		return { ...this.stats };
	}

	// Cleanup expired items periodically
	startCleanup(intervalMs: number = 60000): NodeJS.Timeout {
		return setInterval(() => {
			this.evictExpired();
		}, intervalMs);
	}
}

// Specialized caches for different data types
class PriceCompareCache {
	private static instance: PriceCompareCache;

	// Different caches for different data types with appropriate TTLs
	public readonly products = new LRUCache<any>({
		ttl: 10 * 60 * 1000, // 10 minutes - products change frequently
		maxSize: 20,
		maxItems: 500,
	});

	public readonly comparisons = new LRUCache<any>({
		ttl: 5 * 60 * 1000, // 5 minutes - comparisons should be fresh
		maxSize: 15,
		maxItems: 200,
	});

	public readonly companies = new LRUCache<any>({
		ttl: 30 * 60 * 1000, // 30 minutes - company data changes rarely
		maxSize: 5,
		maxItems: 100,
	});

	public readonly users = new LRUCache<any>({
		ttl: 15 * 60 * 1000, // 15 minutes - user data moderate frequency
		maxSize: 5,
		maxItems: 200,
	});

	public readonly search = new LRUCache<any>({
		ttl: 2 * 60 * 1000, // 2 minutes - search results should be recent
		maxSize: 10,
		maxItems: 300,
	});

	private constructor() {
		// Start cleanup timers for all caches
		this.products.startCleanup();
		this.comparisons.startCleanup();
		this.companies.startCleanup();
		this.users.startCleanup();
		this.search.startCleanup();
	}

	static getInstance(): PriceCompareCache {
		if (!PriceCompareCache.instance) {
			PriceCompareCache.instance = new PriceCompareCache();
		}
		return PriceCompareCache.instance;
	}

	// Cache key generators
	static keys = {
		product: (id: string) => `product:${id}`,
		productsByCompany: (companyId: string) => `products:company:${companyId}`,
		supplierProducts: (active: boolean = true) =>
			`products:suppliers:${active}`,
		comparison: (id: string) => `comparison:${id}`,
		comparisonByUpload: (uploadId: string) => `comparison:upload:${uploadId}`,
		company: (id: string) => `company:${id}`,
		user: (id: string) => `user:${id}`,
		userByEmail: (email: string) => `user:email:${email}`,
		search: (query: string, filters?: string) =>
			`search:${query}${filters ? `:${filters}` : ""}`,
		preOrders: (companyId: string, status?: string) =>
			`preorders:${companyId}${status ? `:${status}` : ""}`,
		stats: (type: string, period?: string) =>
			`stats:${type}${period ? `:${period}` : ""}`,
	};

	// Utility methods for cache management
	invalidatePattern(pattern: string): void {
		const caches = [
			this.products,
			this.comparisons,
			this.companies,
			this.users,
			this.search,
		];

		caches.forEach((cache) => {
			const _stats = cache.getStats();
			// In a real implementation, you'd need to track keys to support pattern invalidation
			// For now, we'll clear entire caches for certain patterns
			if (pattern.includes("products") || pattern.includes("*")) {
				cache.clear();
			}
		});
	}

	getOverallStats() {
		return {
			products: this.products.getStats(),
			comparisons: this.comparisons.getStats(),
			companies: this.companies.getStats(),
			users: this.users.getStats(),
			search: this.search.getStats(),
			timestamp: new Date().toISOString(),
		};
	}

	// Warm up cache with frequently accessed data
	async warmUp(): Promise<void> {
		try {
			// This would typically load most accessed data
			// Implementation depends on your specific patterns
			console.log("Cache warm-up initiated...");
		} catch (error) {
			console.error("Cache warm-up failed:", error);
		}
	}
}

// Cache decorators for service methods
export function cached<T>(
	cache: LRUCache<T>,
	keyGenerator: (...args: any[]) => string,
	ttl?: number,
) {
	return (
		_target: object,
		_propertyName: string,
		descriptor: PropertyDescriptor,
	) => {
		const method = descriptor.value;

		descriptor.value = async function (...args: any[]) {
			const key = keyGenerator(...args);

			// Try to get from cache first
			const cached = cache.get(key);
			if (cached !== undefined) {
				return cached;
			}

			// Execute method and cache result
			const result = await method.apply(this, args);
			cache.set(key, result, ttl);

			return result;
		};

		return descriptor;
	};
}

// Helper function for conditional caching
export function cacheIf<T>(
	condition: (...args: unknown[]) => boolean,
	cache: LRUCache<T>,
	keyGenerator: (...args: unknown[]) => string,
	ttl?: number,
) {
	return (
		_target: object,
		_propertyName: string,
		descriptor: PropertyDescriptor,
	) => {
		const method = descriptor.value;

		descriptor.value = async function (...args: unknown[]) {
			if (!condition(...args)) {
				return method.apply(this, args);
			}

			const key = keyGenerator(...args);
			const cached = cache.get(key);

			if (cached !== undefined) {
				return cached;
			}

			const result = await method.apply(this, args);
			cache.set(key, result, ttl);

			return result;
		};

		return descriptor;
	};
}

export const cache = PriceCompareCache.getInstance();
export { PriceCompareCache };
