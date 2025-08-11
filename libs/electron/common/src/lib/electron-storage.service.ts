import { app } from 'electron';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

export class ElectronStorageService {
	private storageFilePath: string;
	private isInitialized = false;

	private propCache?: any = {};

	constructor() {
		this.initializeStorage();
	}

	private initializeStorage(): void {
		try {
			// Get the user data directory for the app
			const userDataPath = app.getPath('userData');
			this.storageFilePath = join(userDataPath, 'firestone-storage.json');

			// Ensure the directory exists
			const storageDir = dirname(this.storageFilePath);
			if (!existsSync(storageDir)) {
				mkdirSync(storageDir, { recursive: true });
			}

			// Load existing data from file
			this.loadFromFile();
			this.isInitialized = true;

			console.log(`🗃️ ElectronStorageService initialized with storage at: ${this.storageFilePath}`);
		} catch (error) {
			console.error('❌ Failed to initialize ElectronStorageService:', error);
			// Fallback to in-memory only
			this.isInitialized = true;
		}
	}

	private loadFromFile(): void {
		try {
			if (existsSync(this.storageFilePath)) {
				const data = readFileSync(this.storageFilePath, 'utf-8');
				const parsedData = JSON.parse(data);
				this.propCache = { ...parsedData };
				console.log(`📖 Loaded ${Object.keys(this.propCache).length} items from storage`);
			}
		} catch (error) {
			console.warn('⚠️ Failed to load storage file, starting with empty cache:', error);
			this.propCache = {};
		}
	}

	private saveToFile(): void {
		try {
			if (!this.isInitialized) {
				return;
			}

			const data = JSON.stringify(this.propCache, null, 2);
			writeFileSync(this.storageFilePath, data, 'utf-8');
		} catch (error) {
			console.error('❌ Failed to save storage file:', error);
		}
	}

	public setItem(key: string, value: any): void {
		this.propCache[key] = value;
		this.saveToFile();
	}

	public getItem<T>(key: string): T {
		return this.propCache[key];
	}

	public removeItem(key: string): void {
		delete this.propCache[key];
		this.saveToFile();
	}

	public clear(): void {
		this.propCache = {};
		this.saveToFile();
	}

	public getAllKeys(): string[] {
		return Object.keys(this.propCache);
	}

	public hasItem(key: string): boolean {
		return key in this.propCache;
	}

	/**
	 * Get the storage file path for debugging purposes
	 */
	public getStorageFilePath(): string {
		return this.storageFilePath;
	}

	/**
	 * Force reload data from file (useful for debugging or external changes)
	 */
	public reload(): void {
		this.loadFromFile();
	}
}
