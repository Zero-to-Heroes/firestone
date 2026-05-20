import { Injectable } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { waitForReady } from '@firestone/shared/framework/core';
import { distinctUntilChanged, map } from 'rxjs';

const DISK_CACHE_GET_ITEM_CHANNEL = 'disk-cache-get-item';
const DISK_CACHE_STORE_ITEM_CHANNEL = 'disk-cache-store-item';
const DISK_CACHE_CLEAR_CACHE_CHANNEL = 'disk-cache-clear-cache';

/**
 * Renderer-side disk cache for Electron overlay windows.
 * Proxies read/write to {@link ElectronDiskCacheService} in the main process via IPC.
 */
@Injectable({ providedIn: 'root' })
export class ElectronRendererDiskCacheService {
	private cacheDisabled = false;
	private savingFiles: { [fileKey: string]: boolean } = {};

	constructor(private readonly prefs: PreferencesService) {
		this.init();
	}

	private async init() {
		await waitForReady(this.prefs);

		this.prefs.preferences$$
			.pipe(
				map((prefs) => prefs.disableLocalCache),
				distinctUntilChanged(),
			)
			.subscribe((disableLocalCache) => {
				this.cacheDisabled = disableLocalCache;
			});
	}

	public async clearCache() {
		if (this.cacheDisabled || !this.hasIpc()) {
			return;
		}
		try {
			await this.invokeIpc(DISK_CACHE_CLEAR_CACHE_CHANNEL);
		} catch (e) {
			console.error('[electron-disk-cache-renderer] error while clearing cache', e);
		}
	}

	public async storeItem(key: string, value: any, timeout = 5000) {
		if (this.cacheDisabled) {
			return true;
		}
		return this.storeItemInternal(key, value).withTimeout(timeout ?? 5000, key);
	}

	private async storeItemInternal(key: string, value: any): Promise<boolean> {
		if (!this.hasIpc()) {
			return false;
		}
		try {
			if (this.savingFiles[key]) {
				return true;
			}
			this.savingFiles[key] = true;
			const saved = await this.invokeIpc<boolean>(DISK_CACHE_STORE_ITEM_CHANNEL, key, value);
			this.savingFiles[key] = false;
			return saved;
		} catch (e) {
			console.error('[electron-disk-cache-renderer] error while storing info on local disk', key, e);
			this.savingFiles[key] = false;
			return false;
		}
	}

	public async getItem<T>(key: string): Promise<T | null> {
		if (this.cacheDisabled) {
			return null;
		}
		return this.getItemInternal<T>(key).withTimeout(5000, key);
	}

	private async getItemInternal<T>(key: string): Promise<T | null> {
		if (!this.hasIpc()) {
			return null;
		}
		try {
			return await this.invokeIpc<T | null>(DISK_CACHE_GET_ITEM_CHANNEL, key);
		} catch (e) {
			console.error('[electron-disk-cache-renderer] could not read value from disk', key, e);
			return null;
		}
	}

	private hasIpc(): boolean {
		try {
			return !!(window as any)?.require?.('electron')?.ipcRenderer;
		} catch {
			return false;
		}
	}

	private invokeIpc<T>(channel: string, ...args: unknown[]): Promise<T> {
		const ipcRenderer = (window as any).require('electron').ipcRenderer;
		return ipcRenderer.invoke(channel, ...args);
	}
}
