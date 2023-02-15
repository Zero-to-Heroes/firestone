import { Injectable } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { Subject } from 'rxjs';
import { MemoryMercenariesCollectionInfo } from '../../models/memory/memory-mercenaries-collection-info';
import { MemoryMercenariesInfo } from '../../models/memory/memory-mercenaries-info';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { Events } from '../events.service';
import { LocalStorageService } from '../local-storage';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { PreferencesService } from '../preferences.service';
import { sleep } from '../utils';

export const MERCENARIES_SCENES = [
	SceneMode.LETTUCE_BOUNTY_BOARD,
	SceneMode.LETTUCE_BOUNTY_TEAM_SELECT,
	SceneMode.LETTUCE_COLLECTION,
	SceneMode.LETTUCE_COOP,
	SceneMode.LETTUCE_FRIENDLY,
	SceneMode.LETTUCE_MAP,
	SceneMode.LETTUCE_PACK_OPENING,
	SceneMode.LETTUCE_PLAY,
	SceneMode.LETTUCE_VILLAGE,
];

export const SCENE_WITH_RELEVANT_MERC_INFO = [
	SceneMode.GAMEPLAY,
	SceneMode.LETTUCE_BOUNTY_BOARD,
	SceneMode.LETTUCE_BOUNTY_TEAM_SELECT,
	SceneMode.LETTUCE_COLLECTION,
	// SceneMode.LETTUCE_COOP,
	// SceneMode.LETTUCE_FRIENDLY,
	SceneMode.LETTUCE_MAP,
	// SceneMode.LETTUCE_PACK_OPENING,
	SceneMode.LETTUCE_PLAY,
	SceneMode.LETTUCE_VILLAGE,
];

@Injectable()
export class MercenariesMemoryCacheService {
	public memoryCollectionInfo$ = new Subject<MemoryMercenariesCollectionInfo>();
	public memoryMapInfo$ = new Subject<MemoryMercenariesInfo>();

	private previousScene: SceneMode;

	constructor(
		private readonly memoryService: MemoryInspectionService,
		private readonly events: Events,
		private readonly prefs: PreferencesService,
		private readonly localStorageService: LocalStorageService,
	) {
		this.init();
	}

	private init() {
		this.events.on(Events.MEMORY_UPDATE).subscribe(async (event) => {
			const changes: MemoryUpdate = event.data[0];
			const newScene = changes.CurrentScene;
			if (newScene) {
				if (!this.shouldFetchMercenariesMemoryInfo(newScene)) {
					this.previousScene = newScene;
					return;
				}
				this.previousScene = newScene;
				// Because when we get into a new map, the old map info is present in the memory for a short while
				if (newScene === SceneMode.LETTUCE_MAP) {
					await sleep(2000);
				}
			} else if (changes.IsMercenariesTasksUpdated) {
			} else {
				return;
			}

			const newMercenariesCollectionInfo = await this.getMercenariesMergedCollectionInfo(true);
			// const newMercenariesCollectionInfo = await this.memoryService.getMercenariesCollectionInfo(5, true);
			if (newMercenariesCollectionInfo) {
				this.memoryCollectionInfo$.next(newMercenariesCollectionInfo);
			}

			let mapInfo = await this.memoryService.getMercenariesInfo(1);
			let retiesLeft = 5;
			while (!mapInfo?.Map?.PlayerTeam?.length && retiesLeft >= 0) {
				await sleep(200);
				mapInfo = await this.memoryService.getMercenariesInfo(1);
				retiesLeft--;
			}

			console.debug('[mercs] got mapInfo', mapInfo);
			this.memoryMapInfo$.next(mapInfo);
		});
	}

	private shouldFetchMercenariesMemoryInfo(newScene: SceneMode): boolean {
		if (!SCENE_WITH_RELEVANT_MERC_INFO.includes(newScene)) {
			return false;
		}
		if (newScene === SceneMode.GAMEPLAY && !MERCENARIES_SCENES.includes(this.previousScene)) {
			return false;
		}
		return true;
	}

	public async getMercenariesMergedCollectionInfo(
		forceMemoryResetIfCollectionInfoEmpty = false,
	): Promise<MemoryMercenariesCollectionInfo> {
		const newMercenariesInfo: MemoryMercenariesCollectionInfo =
			await this.memoryService.getMercenariesCollectionInfo(2, forceMemoryResetIfCollectionInfoEmpty);

		const localMercenariesInfo = await this.loadLocalMercenariesCollectionInfo();

		const mergedInfo: MemoryMercenariesCollectionInfo = {
			Mercenaries: newMercenariesInfo?.Mercenaries ?? localMercenariesInfo?.Mercenaries,
			Teams: newMercenariesInfo?.Teams ?? localMercenariesInfo?.Teams,
			Visitors: newMercenariesInfo?.Visitors ?? localMercenariesInfo?.Visitors,
		};

		await this.saveLocalMercenariesCollectionInfo(mergedInfo);
		return mergedInfo;
	}

	// Only save the contents of the memory, the prefs (with the override) are saved separately
	private async saveLocalMercenariesCollectionInfo(newMercenariesInfo: MemoryMercenariesCollectionInfo) {
		if (!newMercenariesInfo?.Mercenaries?.length) {
			return;
		}
		this.localStorageService.setItem(LocalStorageService.LOCAL_STORAGE_MERCENARIES_COLLECTION, newMercenariesInfo);
		return;
	}

	private async loadLocalMercenariesCollectionInfo(): Promise<MemoryMercenariesCollectionInfo> {
		const result = this.localStorageService.getItem<MemoryMercenariesCollectionInfo>(
			LocalStorageService.LOCAL_STORAGE_MERCENARIES_COLLECTION,
		);
		return result;
	}
}
