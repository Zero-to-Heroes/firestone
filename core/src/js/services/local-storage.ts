import { Injectable } from '@angular/core';

@Injectable()
export class LocalStorageService {
	public static LOCAL_STORAGE_USER_PREFERENCES = 'user-preferences';
	public static LOCAL_STORAGE_IN_GAME_ACHIEVEMENTS = 'in-game-achievements';
	public static LOCAL_STORAGE_ACHIEVEMENTS_HISTORY = 'achievements-history';
	public static LOCAL_STORAGE_COLLECTION = 'collection';
	public static LOCAL_STORAGE_BGS_HERO_SKIN_IDS = 'bgs-owned-hero-skin-dbf-ids';
	public static LOCAL_STORAGE_CARD_BACKS = 'card-backs';
	public static LOCAL_STORAGE_PACK_INFOS = 'pack-infos';
	public static LOCAL_STORAGE_COINS = 'coins';
	public static LOCAL_STORAGE_CARDS_HISTORY = 'cards-history';
	public static LOCAL_STORAGE_MERCENARIES_COLLECTION = 'mercenariesMemoryCollectionInfo';
	public static LOCAL_STORAGE_ADVENTURES_INFO = 'adventuresInfo';

	private cache = {};

	public setItem(key: string, value: any): void {
		console.debug('set item', key, value);
		this.cache[key] = value;
		localStorage.setItem(key, JSON.stringify(value));
	}

	public getItem<T>(key: string): T {
		return this.cache[key] ?? JSON.parse(localStorage.getItem(key));
	}
}
