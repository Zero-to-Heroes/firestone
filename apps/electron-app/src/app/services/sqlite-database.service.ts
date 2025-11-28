import {
	IDatabaseCollection,
	IDatabaseService,
	IDatabaseTable,
	IDatabaseWhereClause,
} from '@firestone/shared/framework/core';
import { app } from 'electron';
import { join } from 'path';

// Note: This requires 'better-sqlite3' package to be installed
// Run: npm install better-sqlite3
// For TypeScript types: npm install --save-dev @types/better-sqlite3
let Database: any;
try {
	Database = require('better-sqlite3');
} catch (e) {
	console.warn('better-sqlite3 not installed. SQLite functionality will not work.');
}

const dbName = 'FirestoneDB';

/**
 * SQLite implementation of IDatabaseService for Electron main process
 */
export class SqliteDatabaseService implements IDatabaseService {
	private db: any;
	private isInitialized = false;

	constructor() {
		// Database will be initialized in init()
	}

	public async init(): Promise<void> {
		if (!Database) {
			throw new Error('better-sqlite3 is not installed. Please run: npm install better-sqlite3');
		}

		try {
			const userDataPath = app.getPath('userData');
			const dbPath = join(userDataPath, `${dbName}.sqlite`);
			this.db = new Database(dbPath);

			// Enable WAL mode for better concurrency
			this.db.pragma('journal_mode = WAL');

			// Create tables based on the schema from IndexedDbService
			await this.createTables();

			this.isInitialized = true;
			console.log(`SqliteDatabaseService initialized with database at: ${dbPath}`);
		} catch (error) {
			console.error('Failed to initialize SqliteDatabaseService:', error);
			throw error;
		}
	}

	private async createTables(): Promise<void> {
		// Create tables based on IndexedDbService schema
		// Version 1 tables
		this.db.exec(`
			CREATE TABLE IF NOT EXISTS achievementsCompleted (
				id TEXT PRIMARY KEY
			);
			
			CREATE TABLE IF NOT EXISTS achievementsHistory (
				achievementId TEXT PRIMARY KEY,
				data TEXT
			);
			
			CREATE TABLE IF NOT EXISTS arenaRewards (
				data TEXT
			);
			
			CREATE TABLE IF NOT EXISTS arenaDeckStats (
				data TEXT
			);
			
			CREATE TABLE IF NOT EXISTS collectionCards (
				id TEXT PRIMARY KEY,
				data TEXT
			);
			
			CREATE TABLE IF NOT EXISTS collectionPacks (
				id TEXT PRIMARY KEY,
				data TEXT
			);
			
			CREATE TABLE IF NOT EXISTS collectionCardHistory (
				data TEXT
			);
			
			CREATE TABLE IF NOT EXISTS matchHistory (
				reviewId TEXT PRIMARY KEY,
				data TEXT
			);
			
			CREATE TABLE IF NOT EXISTS arenaDeckStats2 (
				runId TEXT PRIMARY KEY,
				data TEXT
			);
			
			CREATE TABLE IF NOT EXISTS arenaCurrentDeckPicks (
				runId TEXT,
				pickNumber INTEGER,
				data TEXT,
				PRIMARY KEY (runId, pickNumber)
			);
			CREATE INDEX IF NOT EXISTS idx_arenaCurrentDeckPicks_runId ON arenaCurrentDeckPicks(runId);
			
			CREATE TABLE IF NOT EXISTS arenaRewards2 (
				runId TEXT,
				rewardType TEXT,
				data TEXT,
				PRIMARY KEY (runId, rewardType)
			);
			CREATE INDEX IF NOT EXISTS idx_arenaRewards2_runId ON arenaRewards2(runId);
		`);
	}

	public async clearDb(): Promise<void> {
		if (!this.db) {
			return;
		}

		try {
			// Get all table names
			const tables = this.db
				.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
				.all()
				.map((row: any) => row.name);

			// Drop all tables
			for (const table of tables) {
				this.db.exec(`DROP TABLE IF EXISTS ${table}`);
			}

			// Recreate tables
			await this.createTables();
			console.log(`SqliteDatabaseService cleared and reinitialized`);
		} catch (error) {
			console.error('Failed to clear SqliteDatabaseService:', error);
			throw error;
		}
	}

	public table<T, K = string>(tableName: string): IDatabaseTable<T, K> {
		if (!this.isInitialized) {
			throw new Error('Database not initialized. Call init() first.');
		}
		return new SqliteTableWrapper<T, K>(this.db, tableName);
	}
}

/**
 * SQLite implementation of IDatabaseTable
 */
class SqliteTableWrapper<T, K = string> implements IDatabaseTable<T, K> {
	constructor(
		private db: any,
		private tableName: string,
	) {}

	async toArray(): Promise<readonly T[]> {
		const rows = this.db.prepare(`SELECT data FROM ${this.tableName}`).all();
		return rows.map((row: any) => JSON.parse(row.data));
	}

	async add(record: T): Promise<K> {
		const data = JSON.stringify(record);
		const key = (record as any).id || (record as any).reviewId || (record as any).runId;

		if (key) {
			this.db.prepare(`INSERT INTO ${this.tableName} (data) VALUES (?)`).run(data);
			return key as K;
		} else {
			// For tables without explicit primary key, use rowid
			const result = this.db.prepare(`INSERT INTO ${this.tableName} (data) VALUES (?)`).run(data);
			return result.lastInsertRowid as K;
		}
	}

	async put(record: T): Promise<K> {
		const data = JSON.stringify(record);
		const key = (record as any).id || (record as any).reviewId || (record as any).runId;

		if (key) {
			// Use INSERT OR REPLACE for put semantics
			this.db.prepare(`INSERT OR REPLACE INTO ${this.tableName} (data) VALUES (?)`).run(data);
			return key as K;
		} else {
			const result = this.db.prepare(`INSERT OR REPLACE INTO ${this.tableName} (data) VALUES (?)`).run(data);
			return result.lastInsertRowid as K;
		}
	}

	async bulkPut(records: readonly T[]): Promise<void> {
		const insert = this.db.prepare(`INSERT OR REPLACE INTO ${this.tableName} (data) VALUES (?)`);
		const transaction = this.db.transaction((items: readonly T[]) => {
			for (const item of items) {
				insert.run(JSON.stringify(item));
			}
		});
		transaction(records);
	}

	async bulkAdd(records: readonly T[], options?: { allKeys?: boolean }): Promise<void> {
		const insert = this.db.prepare(`INSERT INTO ${this.tableName} (data) VALUES (?)`);
		const transaction = this.db.transaction((items: readonly T[]) => {
			for (const item of items) {
				insert.run(JSON.stringify(item));
			}
		});
		transaction(records);
	}

	async clear(): Promise<void> {
		this.db.prepare(`DELETE FROM ${this.tableName}`).run();
	}

	async count(): Promise<number> {
		const result = this.db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName}`).get();
		return (result as any).count;
	}

	toCollection(): IDatabaseCollection<T, K> {
		return new SqliteCollectionWrapper<T, K>(this.db, this.tableName);
	}

	where(indexName: string): IDatabaseWhereClause<T, K> {
		return new SqliteWhereClauseWrapper<T, K>(this.db, this.tableName, indexName);
	}
}

/**
 * SQLite implementation of IDatabaseCollection
 */
class SqliteCollectionWrapper<T, K = string> implements IDatabaseCollection<T, K> {
	constructor(
		private db: any,
		private tableName: string,
	) {}

	async primaryKeys(): Promise<readonly K[]> {
		// For SQLite, we need to extract primary keys from the data
		// This is a simplified implementation - you may need to adjust based on your schema
		const rows = this.db.prepare(`SELECT data FROM ${this.tableName}`).all();
		return rows.map((row: any) => {
			const data = JSON.parse(row.data);
			return (data.id || data.reviewId || data.runId) as K;
		});
	}
}

/**
 * SQLite implementation of IDatabaseWhereClause
 */
class SqliteWhereClauseWrapper<T, K = string> implements IDatabaseWhereClause<T, K> {
	private conditions: Array<{ field: string; value: any }> = [];
	private andFilters: Array<(record: T) => boolean> = [];

	constructor(
		private db: any,
		private tableName: string,
		private indexName: string,
	) {}

	equals(value: any): IDatabaseWhereClause<T, K> {
		this.conditions.push({ field: this.indexName, value });
		return this;
	}

	and(filter: (record: T) => boolean): IDatabaseWhereClause<T, K> {
		this.andFilters.push(filter);
		return this;
	}

	async first(): Promise<T | undefined> {
		const results = await this.toArray();
		return results[0];
	}

	async toArray(): Promise<readonly T[]> {
		// Build SQL query based on conditions
		let query = `SELECT data FROM ${this.tableName}`;
		const params: any[] = [];

		if (this.conditions.length > 0) {
			// For SQLite, we'll need to parse JSON and filter
			// This is a simplified implementation
			const allRows = this.db.prepare(`SELECT data FROM ${this.tableName}`).all();
			let filtered = allRows.map((row: any) => JSON.parse(row.data));

			// Apply equals conditions
			for (const condition of this.conditions) {
				filtered = filtered.filter((item: any) => item[condition.field] === condition.value);
			}

			// Apply and filters
			for (const filter of this.andFilters) {
				filtered = filtered.filter(filter);
			}

			return filtered;
		}

		// If no conditions, return all
		const rows = this.db.prepare(query).all();
		return rows.map((row: any) => JSON.parse(row.data));
	}
}
