import { Injectable } from '@angular/core';

@Injectable()
export class LocalStorageService {
	public static LOCAL_STORAGE_USER_PREFERENCES = 'user-preferences';
	public static LOCAL_STORAGE_IN_GAME_ACHIEVEMENTS = 'in-game-achievements';
	public static ACHIEVEMENTS_USER_COMPLETED = 'achievements-user-completed';
	public static LOCAL_STORAGE_ACHIEVEMENTS_HISTORY = 'achievements-history';
	// public static LOCAL_STORAGE_COLLECTION = 'collection';
	public static LOCAL_STORAGE_BGS_HERO_SKIN_IDS = 'bgs-owned-hero-skin-dbf-ids';
	public static LOCAL_STORAGE_CARD_BACKS = 'card-backs';
	public static LOCAL_STORAGE_PACK_INFOS = 'pack-infos';
	public static LOCAL_STORAGE_COINS = 'coins';
	public static LOCAL_STORAGE_CLASSES_PROCESS = 'classes-progress';
	public static LOCAL_STORAGE_BG_HERO_STAT = 'bg-hero-stat';
	// public static LOCAL_STORAGE_CARDS_HISTORY = 'cards-history';
	public static LOCAL_STORAGE_MERCENARIES_COLLECTION = 'mercenariesMemoryCollectionInfo';
	public static LOCAL_STORAGE_ADVENTURES_INFO = 'adventuresInfo';
	public static REFERENCE_QUESTS = 'reference-quests';
	public static USER_BGS_BEST_STATS = 'user-bgs-best-stats';
	public static BGS_META_HERO_STRATEGIES = 'bgs-meta-hero-strategies';
	public static BGS_QUESTS_DATA = 'bgs-quests-data';
	public static USER_GLOBAL_STATS = 'user-global-stats';
	public static MERCENARIES_GLOBAL_STATS = 'mercenaries-global-stats';
	public static MODS_CONFIG = 'mods-config';
	public static TAVERN_BRAWL_STATS = 'tavern-brawl-stats';
	public static CONSTRUCTED_META_DECKS = 'constructed-meta-decks';
	public static LOCAL_DISK_CACHE_SHOULD_REBUILD = 'local-disk-cache-should-rebuild';
	public static FIRESTONE_SESSION_TOKEN = 'firestone-session-token';
	public static LOTTERY_STATE = 'lottery-state';

	private cache = {};

	public setItem(key: string, value: any): void {
		this.cache[key] = value;
		localStorage.setItem(key, JSON.stringify(value));
	}

	public getItem<T>(key: string): T {
		return this.cache[key] ?? JSON.parse(localStorage.getItem(key) as string);
	}
}
