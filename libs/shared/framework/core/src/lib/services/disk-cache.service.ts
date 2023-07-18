import { Injectable } from '@angular/core';
import { IPreferences, Store } from '@firestone/shared/framework/common';
import { LocalStorageService } from './local-storage';
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

	constructor(
		private readonly ow: OverwolfService,
		private readonly store: Store<IPreferences>,
		private readonly localStorage: LocalStorageService,
	) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();

		this.store
			.listenPrefs$((prefs) => prefs.disableLocalCache)
			.subscribe(([disableLocalCache]) => {
				this.cacheDisabled = disableLocalCache;
			});
	}

	public async clearCache() {
		await this.ow.deleteAppFile('./');
	}

	public async storeItem(key: string, value: any) {
		console.debug('[disk-cache] storing item', key, this.cacheDisabled);
		if (this.cacheDisabled) {
			return true;
		}
		const saved = await this.storeItemInternal(key, value).withTimeout(5000, key);
		if (!saved) {
			console.warn('[disk-cache] Could not saveitem on disk', key);
			const saveInfo = this.localStorage.getItem(LocalStorageService.LOCAL_DISK_CACHE_SHOULD_REBUILD) ?? {};
			saveInfo[key] = true;
			this.localStorage.setItem(LocalStorageService.LOCAL_DISK_CACHE_SHOULD_REBUILD, saveInfo);
			console.debug('[disk-cache] updated disk cache status', saveInfo);
		}
		return saved;
	}

	private async storeItemInternal(key: string, value: any): Promise<boolean> {
		try {
			if (this.savingFiles[key]) {
				return true;
			}

			const start = Date.now();
			key === 'user-match-history.json' && console.log('[disk-cache] storing value', key);
			const stringified = JSON.stringify(value);
			this.savingFiles[key] = true;
			await this.ow.deleteAppFile(key);
			key === 'user-match-history.json' && console.log('[disk-cache] deleted file', key);
			const saved = await this.ow.storeAppFile(key, stringified);
			this.savingFiles[key] = false;
			key === 'user-match-history.json' && console.log('[disk-cache] stored value', key, Date.now() - start);
			return saved;
		} catch (e) {
			console.error('[disk-cache] error while storing info on local disk', key);
			return false;
		}
	}

	public async getItem<T>(key: string): Promise<T | null> {
		console.debug('[disk-cache] getting item', key, this.cacheDisabled);
		if (this.cacheDisabled) {
			return null;
		}
		const saveInfo = this.localStorage.getItem(LocalStorageService.LOCAL_DISK_CACHE_SHOULD_REBUILD) ?? {};
		const shouldSkipDisk = saveInfo[key];
		if (shouldSkipDisk) {
			console.debug('[disk-cache] skipping disk cache for', key);
			return null;
		}
		const result = this.getItemInternal<T>(key).withTimeout(5000, key);
		saveInfo[key] = false;
		this.localStorage.setItem(LocalStorageService.LOCAL_DISK_CACHE_SHOULD_REBUILD, saveInfo);
		return result;
	}

	private async getItemInternal<T>(key: string): Promise<T | null> {
		try {
			const start = Date.now();
			// console.debug('[disk-cache] reading value', key);
			const strResult = await this.ow.readAppFile(key);
			// console.debug('[disk-cache] string value', key, strResult);
			const result = !!strResult?.length ? JSON.parse(strResult) : null;
			console.debug('[disk-cache] read value', key, Date.now() - start);
			return result;
		} catch (e) {
			console.error('[disk-cache] could not read value from disk', key);
			return null;
		}
	}
}
