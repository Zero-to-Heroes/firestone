import { Injectable } from '@angular/core';
import Dexie from 'dexie';

export const ACHIEVEMENTS_COMPLETED = 'achievementsCompleted';
export const ACHIEVEMENTS_HISTORY = 'achievementsHistory';
export const ARENA_REWARDS = 'arenaRewards';
export const ARENA_DECK_STATS = 'arenaDeckStats';
export const COLLECTION_CARDS = 'collectionCards';
export const COLLECTION_PACK_STATS = 'collectionPacks';
export const COLLECTION_CARD_HISTORY = 'collectionCardHistory';
export const MATCH_HISTORY = 'matchHistory';

@Injectable({
	providedIn: 'root',
})
export class IndexedDbService extends Dexie {
	constructor() {
		super('FirestoneDB');
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
			[ARENA_DECK_STATS]: '',
			// memory.Card
			[COLLECTION_CARDS]: 'id',
			// PackResult
			[COLLECTION_PACK_STATS]: 'id',
			// CardHistory
			[COLLECTION_CARD_HISTORY]: '',
			// GameStat
			[MATCH_HISTORY]: 'reviewId',
		});

		await this.open();
	}
}
