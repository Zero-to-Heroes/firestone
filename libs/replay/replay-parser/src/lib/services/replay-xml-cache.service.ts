import { Injectable } from '@angular/core';
import { IndexedDbService, REPLAY_XML } from '@firestone/shared/framework/core';

export interface CachedReplayXml {
	readonly reviewId: string;
	readonly replayKey: string;
	readonly xml: string;
	readonly playerDecklist: string | null;
	readonly powerLogKey: string | null;
	readonly fetchedAt: number;
	readonly sizeBytes: number;
}

const MAX_CACHED_REPLAYS = 200;
const MAX_CACHE_BYTES = 500 * 1024 * 1024;

@Injectable({
	providedIn: 'root',
})
export class ReplayXmlCacheService {
	constructor(private readonly indexedDb: IndexedDbService) {}

	public async get(reviewId: string): Promise<CachedReplayXml | null> {
		await this.indexedDb.isReady();
		const cached = await this.indexedDb.table<CachedReplayXml, string>(REPLAY_XML).get(reviewId);
		return cached ?? null;
	}

	public async put(entry: CachedReplayXml): Promise<void> {
		await this.indexedDb.isReady();
		await this.indexedDb.table<CachedReplayXml, string>(REPLAY_XML).put(entry);
		await this.evictIfNeeded();
	}

	private async evictIfNeeded(): Promise<void> {
		const table = this.indexedDb.table<CachedReplayXml, string>(REPLAY_XML);
		const all = await table.toArray();
		if (all.length <= MAX_CACHED_REPLAYS) {
			const totalBytes = all.reduce((sum, entry) => sum + entry.sizeBytes, 0);
			if (totalBytes <= MAX_CACHE_BYTES) {
				return;
			}
		}

		const sorted = [...all].sort((a, b) => a.fetchedAt - b.fetchedAt);
		let totalBytes = sorted.reduce((sum, entry) => sum + entry.sizeBytes, 0);
		const toDelete: string[] = [];

		for (const entry of sorted) {
			if (sorted.length - toDelete.length <= MAX_CACHED_REPLAYS && totalBytes <= MAX_CACHE_BYTES) {
				break;
			}
			toDelete.push(entry.reviewId);
			totalBytes -= entry.sizeBytes;
		}

		for (const reviewId of toDelete) {
			await table.delete(reviewId);
		}
	}
}
