import { Injectable } from '@angular/core';
import { OverwolfService } from './overwolf.service';

// Only move items that are too big for localstorage
@Injectable()
export class DiskCacheService {
	public static IN_GAME_ACHIEVEMENTS = 'in-game-achievements.json';
	public static ACHIEVEMENTS_HISTORY = 'achievements-history.json';
	public static COLLECTION = 'collection.json';
	public static COLLECTION_PACK_STATS = 'collection-pack-stats.json';
	public static CARDS_HISTORY = 'cards-history.json';
	public static ADVENTURES_INFO = 'adventures-info.json';
	public static USER_MATCH_HISTORY = 'user-match-history.json';
	public static BATTLEGROUNDS_PERFECT_GAMES = 'battlegrounds-perfect-games.json';
	public static BATTLEGROUNDS_META_HERO_STATS = 'battlegrounds-meta-hero-stats.json';
	public static MERCENARIES_COLLECTION = 'mercenaries-memory-collection-info.json';
	public static MERCENARIES_REFERENCE_DATA = 'mercenaries-reference-data.json';

	constructor(private readonly ow: OverwolfService) {}

	private savingFiles: { [fileKey: string]: boolean } = {};

	public async storeItem(key: string, value: any) {
		return this.storeItemInternal(key, value).withTimeout(5000, key);
	}

	private async storeItemInternal(key: string, value: any): Promise<void> {
		try {
			if (this.savingFiles[key]) {
				return;
			}

			const start = Date.now();
			console.debug('[disk-cache] storing value', key);
			const stringified = JSON.stringify(value);
			this.savingFiles[key] = true;
			await this.ow.deleteAppFile(key);
			console.debug('[disk-cache] deleted file', key);
			await this.ow.storeAppFile(key, stringified);
			this.savingFiles[key] = false;
			console.log('[disk-cache] stored value', key, Date.now() - start);
		} catch (e) {
			console.error('[disk-cache] error while storing info on local disk', key);
		}
	}

	public async getItem<T>(key: string): Promise<T | null> {
		return this.getItemInternal<T>(key).withTimeout(5000, key);
	}

	private async getItemInternal<T>(key: string): Promise<T | null> {
		try {
			const start = Date.now();
			console.debug('[disk-cache] reading value', key);
			const strResult = await this.ow.readAppFile(key);
			console.debug('[disk-cache] string value', key, strResult);
			const result = !!strResult?.length ? JSON.parse(strResult) : null;
			console.log('[disk-cache] read value', key, Date.now() - start);
			return result;
		} catch (e) {
			console.error('[disk-cache] could not read value from disk', key);
			return null;
		}
	}
}
