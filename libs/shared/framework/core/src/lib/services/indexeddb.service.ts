import { Injectable } from '@angular/core';
import Dexie from 'dexie';

export const ACHIEVEMENTS_COMPLETED = 'achievementsCompleted';
export const ACHIEVEMENTS_HISTORY = 'achievementsHistory';
export const ARENA_REWARDS = 'arenaRewards';
export const ARENA_DECK_STATS_OLD = 'arenaDeckStats';
export const ARENA_DECK_STATS = 'arenaDeckStats2';
// export const ARENA_CURRENT_DECK_PICKS = 'arenaCurrentDeckPicks';
export const COLLECTION_CARDS = 'collectionCards';
export const COLLECTION_PACK_STATS = 'collectionPacks';
export const COLLECTION_CARD_HISTORY = 'collectionCardHistory';
export const MATCH_HISTORY = 'matchHistory';

const dbName = 'FirestoneDB';
@Injectable({
	providedIn: 'root',
})
export class IndexedDbService extends Dexie {
	constructor() {
		super(dbName);
	}

	public async init() {
		this.version(1).stores({
			// CompletedAchievement
			[ACHIEVEMENTS_COMPLETED]: 'id',
			// AchievementHistory
			[ACHIEVEMENTS_HISTORY]: 'achievementId',
			// ArenaRewardInfo
			[ARENA_REWARDS]: '',
			// DraftDeckStats
			[ARENA_DECK_STATS_OLD]: '',
			// memory.Card
			[COLLECTION_CARDS]: 'id',
			// PackResult
			[COLLECTION_PACK_STATS]: 'id',
			// CardHistory
			[COLLECTION_CARD_HISTORY]: '',
			// GameStat
			[MATCH_HISTORY]: 'reviewId',
		});
		this.version(2).stores({
			// DraftDeckStats
			[ARENA_DECK_STATS]: 'runId',
			// DraftPick
			// [ARENA_CURRENT_DECK_PICKS]: '[runId+pickNumber]',
		});

		await this.open();
	}

	public async clearDb() {
		this.close(); // Close the database before deleting it
		const success = await new Promise<boolean>((resolve) => {
			const request = indexedDB.deleteDatabase(dbName);
			request.onsuccess = () => {
				console.log(`Database ${dbName} deleted successfully`);
				resolve(true);
			};

			request.onerror = (event) => {
				console.error(`Error deleting database ${dbName}`, event);
				resolve(false);
			};

			request.onblocked = () => {
				console.warn(`Deletion of database ${dbName} is blocked`);
				resolve(false);
			};
		});
		if (success) {
			this.init();
		}
	}
}
