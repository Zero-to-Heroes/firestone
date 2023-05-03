import { Injectable } from '@angular/core';
import { AppUiStoreFacadeService } from '@legacy-import/src/lib/js/services/ui-store/app-ui-store-facade.service';
import { OverwolfService } from './overwolf.service';

// Only move items that are too big for localstorage
@Injectable()
export class DiskCacheService {
	public static DISK_CACHE_KEYS = {
		ACHIEVEMENTS_HISTORY: 'achievements-history.json',
		COLLECTION: 'collection.json',
		COLLECTION_PACK_STATS: 'collection-pack-stats.json',
		CARDS_HISTORY: 'cards-history.json',
		ADVENTURES_INFO: 'adventures-info.json',
		USER_MATCH_HISTORY: 'user-match-history.json',
		BATTLEGROUNDS_PERFECT_GAMES: 'battlegrounds-perfect-games.json',
		BATTLEGROUNDS_META_HERO_STATS: 'battlegrounds-meta-hero-stats.json',
		MERCENARIES_COLLECTION: 'mercenaries-memory-collection-info.json',
		MERCENARIES_REFERENCE_DATA: 'mercenaries-reference-data.json',
	};

	private cacheDisabled = false;
	private savingFiles: { [fileKey: string]: boolean } = {};

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreFacadeService) {
		this.init();
	}

	private async init() {
		this.store
			.listenPrefs$((prefs) => prefs.disableLocalCache)
			.subscribe(([disableLocalCache]) => {
				this.cacheDisabled = disableLocalCache;
			});
	}

	public async clearCache() {
		console.debug('clearing cache');
		await this.ow.deleteAppFile('./');
	}

	public async storeItem(key: string, value: any) {
		if (this.cacheDisabled) {
			return;
		}
		return this.storeItemInternal(key, value).withTimeout(5000, key);
	}

	private async storeItemInternal(key: string, value: any): Promise<void> {
		try {
			if (this.savingFiles[key]) {
				return;
			}

			const start = Date.now();
			// console.debug('[disk-cache] storing value', key);
			const stringified = JSON.stringify(value);
			this.savingFiles[key] = true;
			await this.ow.deleteAppFile(key);
			// console.debug('[disk-cache] deleted file', key);
			await this.ow.storeAppFile(key, stringified);
			this.savingFiles[key] = false;
			console.log('[disk-cache] stored value', key, Date.now() - start);
		} catch (e) {
			console.error('[disk-cache] error while storing info on local disk', key);
		}
	}

	public async getItem<T>(key: string): Promise<T | null> {
		if (this.cacheDisabled) {
			return null;
		}
		return this.getItemInternal<T>(key).withTimeout(5000, key);
	}

	private async getItemInternal<T>(key: string): Promise<T | null> {
		try {
			const start = Date.now();
			// console.debug('[disk-cache] reading value', key);
			const strResult = await this.ow.readAppFile(key);
			// console.debug('[disk-cache] string value', key, strResult);
			const result = !!strResult?.length ? JSON.parse(strResult) : null;
			console.log('[disk-cache] read value', key, Date.now() - start);
			return result;
		} catch (e) {
			console.error('[disk-cache] could not read value from disk', key);
			return null;
		}
	}
}
