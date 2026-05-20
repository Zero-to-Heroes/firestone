import { ipcMain } from 'electron';
import { ElectronDiskCacheService } from './electron-disk-cache.service';

const DISK_CACHE_GET_ITEM_CHANNEL = 'disk-cache-get-item';
const DISK_CACHE_STORE_ITEM_CHANNEL = 'disk-cache-store-item';
const DISK_CACHE_CLEAR_CACHE_CHANNEL = 'disk-cache-clear-cache';

let ipcHandlersRegistered = false;

export const registerElectronDiskCacheIpcHandlers = (diskCache: ElectronDiskCacheService): void => {
	if (ipcHandlersRegistered) {
		return;
	}
	ipcHandlersRegistered = true;

	ipcMain.handle(DISK_CACHE_GET_ITEM_CHANNEL, async (_event, key: string) => {
		return diskCache.getItem(key);
	});

	ipcMain.handle(DISK_CACHE_STORE_ITEM_CHANNEL, async (_event, key: string, value: unknown) => {
		return diskCache.storeItem(key, value);
	});

	ipcMain.handle(DISK_CACHE_CLEAR_CACHE_CHANNEL, async () => {
		await diskCache.clearCache();
	});
};
