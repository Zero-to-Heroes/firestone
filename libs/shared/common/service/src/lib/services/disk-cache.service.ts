import { Injectable } from '@angular/core';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { distinctUntilChanged, map } from 'rxjs';
import { PreferencesService } from './preferences.service';

// Only move items that are too big for localstorage
@Injectable()
export class DiskCacheService {
	public static DISK_CACHE_KEYS = {
		ACHIEVEMENTS_USER_COMPLETED: 'achievements-completed.json',
		ACHIEVEMENTS_HISTORY: 'achievements-history.json',
		ARENA_REWARDS: 'arena-rewards.json',
		ARENA_DECK_STATS: 'arena-deck-stats.json',
		BATTLEGROUNDS_META_HERO_STATS: 'battlegrounds-meta-hero-stats.json',
		BATTLEGROUNDS_META_HERO_STATS_DUO: 'battlegrounds-meta-hero-stats-duo.json',
		BATTLEGROUNDS_PERFECT_GAMES: 'battlegrounds-perfect-games.json',
		BATTLEGROUNDS_USER_BEST_STATS: 'battlegrounds-user-best-stats.json',
		COLLECTION: 'collection.json',
		COLLECTION_PACK_STATS: 'collection-pack-stats.json',
		CARDS_HISTORY: 'cards-history.json',
		ADVENTURES_INFO: 'adventures-info.json',
		/** @deprecated, can be removed in June 2025 */
		USER_MATCH_HISTORY: 'user-match-history.json',
		MERCENARIES_COLLECTION: 'mercenaries-memory-collection-info.json',
		MERCENARIES_REFERENCE_DATA: 'mercenaries-reference-data.json',
		PROFILE_ACHIEVEMENTS: 'profile-achievements.json',
		PROFILE_BG_FULL_TIME_STATS_BY_HERO: 'profile-bg-full-time-stats-by-hero.json',
		PROFILE_SETS: 'profile-sets.json',
		PROFILE_PACKS: 'profile-packs.json',
		PROFILE_CLASSES_PROGRESS: 'profile-classes-progress.json',
		PROFILE_WINS_FOR_MODE: 'profile-wins-for-mode.json',
	};

	private cacheDisabled = false;
	private savingFiles: { [fileKey: string]: boolean } = {};

	constructor(private readonly ow: OverwolfService, private readonly prefs: PreferencesService) {
		this.init();
	}

	private async init() {
		await waitForReady(this.prefs);

		this.prefs.preferences$$
			.pipe(
				map((prefs) => prefs.disableLocalCache),
				distinctUntilChanged(),
			)
			.subscribe((disableLocalCache) => {
				this.cacheDisabled = disableLocalCache;
			});
	}

	public async clearCache() {
		await this.ow.deleteAppFile('./');
	}

	public async storeItem(key: string, value: any, timeout = 5000) {
		console.debug('[disk-cache] storing item', key, this.cacheDisabled);
		if (this.cacheDisabled) {
			return true;
		}
		const saved = await this.storeItemInternal(key, value).withTimeout(timeout ?? 5000, key);
		return saved;
	}

	private async storeItemInternal(key: string, value: any): Promise<boolean> {
		try {
			if (this.savingFiles[key]) {
				return true;
			}

			const start = Date.now();
			// console.debug('[disk-cache] storing value', key);
			const stringified = JSON.stringify(value);
			this.savingFiles[key] = true;
			await this.ow.deleteAppFile(key);
			// console.debug('[disk-cache] deleted file', key);
			const saved = await this.ow.storeAppFile(key, stringified);
			this.savingFiles[key] = false;
			// console.debug('[disk-cache] stored value', key, Date.now() - start);
			return saved;
		} catch (e) {
			console.error('[disk-cache] error while storing info on local disk', key);
			return false;
		}
	}

	public async getItem<T>(key: string): Promise<T | null> {
		// const saveInfo = this.localStorage.getItem(LocalStorageService.LOCAL_DISK_CACHE_SHOULD_REBUILD) ?? {};
		console.debug('[disk-cache] getting item', key, this.cacheDisabled);
		if (this.cacheDisabled) {
			return null;
		}

		const result = this.getItemInternal<T>(key).withTimeout(5000, key);
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
