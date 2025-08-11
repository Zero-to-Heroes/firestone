import { Injectable } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { waitForReady } from '@firestone/shared/framework/core';
import { distinctUntilChanged, map } from 'rxjs';

@Injectable()
export class ElectronDiskCacheService {
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

	public async clearCache() {}

	public async storeItem(key: string, value: any, timeout = 5000) {
		return true;
	}

	public async getItem<T>(key: string): Promise<T | null> {
		return null;
	}
}
