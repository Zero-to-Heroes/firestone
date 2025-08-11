import { Injectable } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { sleep } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { app } from 'electron';
import { promises as fsPromises } from 'fs';
import { dirname, join } from 'path';
import { distinctUntilChanged, map } from 'rxjs';

@Injectable()
export class ElectronDiskCacheService {
	private cacheDisabled = false;
	private savingFiles: { [fileKey: string]: boolean } = {};
	private cacheDirectory: string | null = null;

	constructor(private readonly prefs: PreferencesService) {}

	public async init() {
		await waitForReady(this.prefs);

		// Initialize cache directory
		await this.initializeCacheDirectory();

		this.prefs.preferences$$
			.pipe(
				map((prefs) => prefs.disableLocalCache),
				distinctUntilChanged(),
			)
			.subscribe((disableLocalCache) => {
				this.cacheDisabled = disableLocalCache;
			});
	}

	private async initializeCacheDirectory() {
		try {
			const userDataPath = app.getPath('userData');
			// Use 'data' instead of 'cache' to ensure persistence across updates
			// 'cache' directories are sometimes treated as temporary by OS cleanup utilities
			this.cacheDirectory = join(userDataPath, 'data');
			console.log('[electron-disk-cache] User data path', userDataPath);
			// Ensure cache directory exists
			await fsPromises.mkdir(this.cacheDirectory, { recursive: true }).catch((e) => {
				console.error('[electron-disk-cache] Failed to create cache directory', e);
			});
			console.log('[electron-disk-cache] Cache directory initialized', this.cacheDirectory);
		} catch (e) {
			console.error('[electron-disk-cache] Failed to initialize cache directory', e);
			this.cacheDirectory = null;
		}
	}

	private getFilePath(key: string): string | null {
		if (!this.cacheDirectory) {
			return null;
		}
		return join(this.cacheDirectory, key);
	}

	public async clearCache() {
		await this.waitForCacheDirectory();

		if (!this.cacheDirectory) {
			return;
		}
		try {
			const files = await fsPromises.readdir(this.cacheDirectory);
			await Promise.all(
				files.map((file) => {
					const filePath = join(this.cacheDirectory!, file);
					return fsPromises.unlink(filePath).catch((e) => {
						console.error('[electron-disk-cache] Failed to delete file', filePath, e);
					});
				}),
			);
			console.log('[electron-disk-cache] Cleared cache');
		} catch (e) {
			console.error('[electron-disk-cache] Failed to clear cache', e);
		}
	}

	public async storeItem(key: string, value: any, timeout = 5000) {
		console.log('[electron-disk-cache] storing item', key);
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

			await this.waitForCacheDirectory();

			const filePath = this.getFilePath(key);
			if (!filePath) {
				console.error('[electron-disk-cache] Cache directory not initialized');
				return false;
			}

			const start = Date.now();
			const stringified = JSON.stringify(value);
			this.savingFiles[key] = true;

			// Ensure directory exists
			await fsPromises.mkdir(dirname(filePath), { recursive: true });

			// Delete existing file if it exists (for consistency with original implementation)
			try {
				await fsPromises.unlink(filePath);
			} catch (e) {
				// File doesn't exist, which is fine
			}

			// Write new file
			await fsPromises.writeFile(filePath, stringified, { encoding: 'utf8' });
			this.savingFiles[key] = false;
			console.log('[electron-disk-cache] stored value', key, Date.now() - start);
			return true;
		} catch (e) {
			console.error('[electron-disk-cache] error while storing info on local disk', key, e);
			this.savingFiles[key] = false;
			return false;
		}
	}

	public async getItem<T>(key: string): Promise<T | null> {
		console.log('[electron-disk-cache] getting item', key);
		if (this.cacheDisabled) {
			return null;
		}

		const result = this.getItemInternal<T>(key).withTimeout(5000, key);
		return result;
	}

	private async getItemInternal<T>(key: string): Promise<T | null> {
		try {
			await this.waitForCacheDirectory();

			const filePath = this.getFilePath(key);
			if (!filePath) {
				console.error('[electron-disk-cache] Cache directory not initialized');
				return null;
			}

			const start = Date.now();
			const strResult = await fsPromises.readFile(filePath, { encoding: 'utf8' });
			const result = !!strResult?.length ? JSON.parse(strResult) : null;
			console.log('[electron-disk-cache] read value', key, Date.now() - start);
			return result;
		} catch (e) {
			// File doesn't exist or other error - return null (not an error condition)
			if ((e as any)?.code !== 'ENOENT') {
				console.error('[electron-disk-cache] could not read value from disk', key, e);
			}
			return null;
		}
	}

	private async waitForCacheDirectory() {
		let retries = 0;
		while (!this.cacheDirectory) {
			await sleep(500);
			retries++;
			if (retries % 10 === 0) {
				console.warn('[electron-disk-cache] Waiting for cache directory', retries);
			}
		}
	}
}
