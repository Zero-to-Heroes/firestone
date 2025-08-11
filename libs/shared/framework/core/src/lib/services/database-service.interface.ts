import { InjectionToken } from '@angular/core';

export const DATABASE_SERVICE_TOKEN = new InjectionToken<IDatabaseService>('DatabaseService');

/**
 * Interface for database operations that can be implemented by IndexedDB or SQLite
 */
export interface IDatabaseService {
	/**
	 * Initialize the database
	 */
	init(): Promise<void>;

	/**
	 * Clear the entire database
	 */
	clearDb(): Promise<void>;

	/**
	 * Get a table interface for operations
	 */
	table<T, K = string>(tableName: string): IDatabaseTable<T, K>;
}

/**
 * Interface for table operations
 */
export interface IDatabaseTable<T, K = string> {
	/**
	 * Get all records as an array
	 */
	toArray(): Promise<readonly T[]>;

	/**
	 * Add a single record
	 */
	add(record: T): Promise<K>;

	/**
	 * Put (insert or update) a single record
	 */
	put(record: T): Promise<K>;

	/**
	 * Bulk put (insert or update) multiple records
	 */
	bulkPut(records: readonly T[]): Promise<void>;

	/**
	 * Bulk add multiple records
	 */
	bulkAdd(records: readonly T[], options?: { allKeys?: boolean }): Promise<void>;

	/**
	 * Clear all records from the table
	 */
	clear(): Promise<void>;

	/**
	 * Get the count of records in the table
	 */
	count(): Promise<number>;

	/**
	 * Get a collection interface for advanced queries
	 */
	toCollection(): IDatabaseCollection<T, K>;

	/**
	 * Start a where clause query
	 */
	where(indexName: string): IDatabaseWhereClause<T, K>;
}

/**
 * Interface for collection operations
 */
export interface IDatabaseCollection<T, K = string> {
	/**
	 * Get all primary keys
	 */
	primaryKeys(): Promise<readonly K[]>;
}

/**
 * Interface for where clause operations
 */
export interface IDatabaseWhereClause<T, K = string> {
	/**
	 * Filter by equality
	 */
	equals(value: any): IDatabaseWhereClause<T, K>;

	/**
	 * Add an AND condition with a function
	 */
	and(filter: (record: T) => boolean): IDatabaseWhereClause<T, K>;

	/**
	 * Get the first matching record
	 */
	first(): Promise<T | undefined>;

	/**
	 * Get all matching records as an array
	 */
	toArray(): Promise<readonly T[]>;
}
