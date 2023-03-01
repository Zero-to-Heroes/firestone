/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { LocalStorageService } from '@firestone/shared/framework/core';
import { AdventuresInfo } from '@models/memory/memory-duels';
import { MemoryInspectionService } from '@services/plugins/memory-inspection.service';

@Injectable()
export class DuelsMemoryCacheService {
	constructor(private readonly memory: MemoryInspectionService, private readonly localStorage: LocalStorageService) {}

	public async getAdventuresInfo(): Promise<AdventuresInfo> {
		const info = await this.memory.getAdventuresInfo();
		if (info) {
			this.localStorage.setItem(LocalStorageService.LOCAL_STORAGE_ADVENTURES_INFO, info);
			return info;
		}

		return this.localStorage.getItem<AdventuresInfo>(LocalStorageService.LOCAL_STORAGE_ADVENTURES_INFO);
	}
}
