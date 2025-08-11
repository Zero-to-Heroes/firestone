import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import {
	IDatabaseCollection,
	IDatabaseService,
	IDatabaseTable,
	IDatabaseWhereClause,
} from './database-service.interface';

export const ACHIEVEMENTS_COMPLETED = 'achievementsCompleted';
export const ACHIEVEMENTS_HISTORY = 'achievementsHistory';
export const ARENA_REWARDS_OLD = 'arenaRewards';
export const ARENA_DECK_STATS_OLD = 'arenaDeckStats';
export const ARENA_DECK_STATS = 'arenaDeckStats2';
export const ARENA_CURRENT_DECK_PICKS = 'arenaCurrentDeckPicks';
export const COLLECTION_CARDS = 'collectionCards';
export const COLLECTION_PACK_STATS = 'collectionPacks';
export const COLLECTION_CARD_HISTORY = 'collectionCardHistory';
export const MATCH_HISTORY = 'matchHistory';
export const ARENA_REWARDS = 'arenaRewards2';

const dbName = 'FirestoneDB';

/**
 * Wrapper for Dexie Table to implement IDatabaseTable
 */
class IndexedDbTableWrapper<T, K = string> implements IDatabaseTable<T, K> {
	constructor(private dexieTable: Table<T, K>) {}

	async toArray(): Promise<readonly T[]> {
		return await this.dexieTable.toArray();
	}

	async add(record: T): Promise<K> {
		return await this.dexieTable.add(record);
	}

	async put(record: T): Promise<K> {
		return await this.dexieTable.put(record);
	}

	async bulkPut(records: readonly T[]): Promise<void> {
		await this.dexieTable.bulkPut(records as T[]);
	}

	async bulkAdd(records: readonly T[], options?: { allKeys?: boolean }): Promise<void> {
		if (options?.allKeys) {
			await this.dexieTable.bulkAdd(records as T[], { allKeys: true });
		} else {
			await this.dexieTable.bulkAdd(records as T[]);
		}
	}

	async clear(): Promise<void> {
		await this.dexieTable.clear();
	}

	async count(): Promise<number> {
		return await this.dexieTable.count();
	}

	toCollection(): IDatabaseCollection<T, K> {
		return new IndexedDbCollectionWrapper(this.dexieTable.toCollection());
	}

	where(indexName: string): IDatabaseWhereClause<T, K> {
		return new IndexedDbWhereClauseWrapper(this.dexieTable.where(indexName));
	}
}

/**
 * Wrapper for Dexie Collection to implement IDatabaseCollection
 */
class IndexedDbCollectionWrapper<T, K = string> implements IDatabaseCollection<T, K> {
	constructor(private dexieCollection: Dexie.Collection<T, K>) {}

	async primaryKeys(): Promise<readonly K[]> {
		return await this.dexieCollection.primaryKeys();
	}
}

/**
 * Wrapper for Dexie WhereClause to implement IDatabaseWhereClause
 */
class IndexedDbWhereClauseWrapper<T, K = string> implements IDatabaseWhereClause<T, K> {
	constructor(private dexieWhereClause: any) {}

	equals(value: any): IDatabaseWhereClause<T, K> {
		return new IndexedDbWhereClauseWrapper(this.dexieWhereClause.equals(value));
	}

	and(filter: (record: T) => boolean): IDatabaseWhereClause<T, K> {
		return new IndexedDbWhereClauseWrapper(this.dexieWhereClause.and(filter));
	}

	async first(): Promise<T | undefined> {
		return await this.dexieWhereClause.first();
	}

	async toArray(): Promise<readonly T[]> {
		return await this.dexieWhereClause.toArray();
	}
}

@Injectable({
	providedIn: 'root',
})
export class IndexedDbService implements IDatabaseService {
	private dexie: Dexie;

	constructor() {
		this.dexie = new Dexie(dbName);
	}

	public async init() {
		this.dexie.version(1).stores({
			// CompletedAchievement
			[ACHIEVEMENTS_COMPLETED]: 'id',
			// AchievementHistory
			[ACHIEVEMENTS_HISTORY]: 'achievementId',
			// ArenaRewardInfo
			[ARENA_REWARDS_OLD]: '',
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
		this.dexie.version(2).stores({
			// DraftDeckStats
			[ARENA_DECK_STATS]: 'runId',
			// DraftPick
			[ARENA_CURRENT_DECK_PICKS]: '[runId+pickNumber], runId',
			// ArenaRewardInfo
			[ARENA_REWARDS]: '[runId+rewardType], runId',
		});

		await this.dexie.open();
	}

	public async clearDb() {
		this.dexie.close(); // Close the database before deleting it
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

	public table<T, K = string>(tableName: string): IDatabaseTable<T, K> {
		const dexieTable = this.dexie.table<T, K>(tableName);
		return new IndexedDbTableWrapper<T, K>(dexieTable);
	}
}
