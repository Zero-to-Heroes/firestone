import { Injectable } from '@angular/core';
import { SceneMode, TaskStatus } from '@firestone-hs/reference-data';
import { Subject } from 'rxjs';
import { MemoryMercenariesCollectionInfo, MemoryVisitor } from '../../models/memory/memory-mercenaries-collection-info';
import { MemoryMercenariesInfo } from '../../models/memory/memory-mercenaries-info';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { Events } from '../events.service';
import { LocalStorageService } from '../local-storage';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { PreferencesService } from '../preferences.service';
import { deepEqual, groupByFunction, sleep } from '../utils';

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
	private previousCollectionInfo: MemoryMercenariesCollectionInfo;
	private previousVisitorsInfo: readonly MemoryVisitor[];
	private previousMapInfo: MemoryMercenariesInfo;

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
				console.debug('[merc-memory] changing scene, refreshing merc info', newScene, SceneMode[newScene]);
				// Because when we get into a new map, the old map info is present in the memory for a short while
				if (newScene === SceneMode.LETTUCE_MAP) {
					await sleep(2000);
					console.debug('[merc-memory] done waiting');
				}
			} else if (changes.IsMercenariesTasksUpdated) {
				console.debug('[merc-memory] updating tasks', changes);
			} else {
				return;
			}
			const newMercenariesCollectionInfo = await this.getMercenariesMergedCollectionInfo(true);
			if (newMercenariesCollectionInfo) {
				this.memoryCollectionInfo$.next(newMercenariesCollectionInfo);
			}

			const mapInfo = await this.memoryService.getMercenariesInfo();
			if (!deepEqual(mapInfo, this.previousMapInfo)) {
				this.previousMapInfo = mapInfo;
				this.memoryMapInfo$.next(mapInfo);
			}
		});
	}

	private shouldFetchMercenariesMemoryInfo(newScene: SceneMode): boolean {
		if (!SCENE_WITH_RELEVANT_MERC_INFO.includes(newScene)) {
			// console.debug('[merc-memory] non relevant scene', newScene);
			return false;
		}
		if (newScene === SceneMode.GAMEPLAY && !MERCENARIES_SCENES.includes(this.previousScene)) {
			// console.debug('[merc-memory] not coming from lettuce scene', newScene, this.previousScene);
			return false;
		}
		return true;
	}

	public async getMercenariesMergedCollectionInfo(
		forceMemoryResetIfCollectionInfoEmpty = false,
	): Promise<MemoryMercenariesCollectionInfo> {
		let newMercenariesInfo: MemoryMercenariesCollectionInfo = await this.memoryService.getMercenariesCollectionInfo(
			5,
			forceMemoryResetIfCollectionInfoEmpty,
		);
		if (!!newMercenariesInfo) {
			console.debug('[merc-memory] retrieved merc info from memory', newMercenariesInfo);
		}
		let readFromMemory = true;
		if (!newMercenariesInfo?.Mercenaries?.length) {
			newMercenariesInfo = await this.loadLocalMercenariesCollectionInfo();
			readFromMemory = false;
		}

		const prefs = await this.prefs.getPreferences();
		const savedVisitorsInfo: readonly MemoryVisitor[] = prefs.mercenariesVisitorsProgress ?? [];
		if (
			!newMercenariesInfo
			// It's better to have a few more cycles recomputing the info than showing nothing when the memory
			// reading glitches out
			// || (areDeepEqual(newMercenariesInfo, this.previousCollectionInfo) &&
			// 	areDeepEqual(savedVisitorsInfo, this.previousVisitorsInfo))
		) {
			console.debug(
				'[merc-memory] no new info',
				newMercenariesInfo,
				this.previousCollectionInfo,
				savedVisitorsInfo,
				this.previousVisitorsInfo,
			);
			return null;
		}

		// console.debug(
		// 	'[merc-memory] new collection retrieved',
		// 	JSON.stringify(newMercenariesInfo),
		// 	JSON.stringify(this.previousCollectionInfo),
		// );
		// console.debug(
		// 	'[merc-memory] new saved visitor info retrieved',
		// 	JSON.stringify(savedVisitorsInfo),
		// 	JSON.stringify(this.previousVisitorsInfo),
		// );
		this.previousCollectionInfo = newMercenariesInfo;
		this.previousVisitorsInfo = savedVisitorsInfo;

		// We don't persist the updated visitors info because they are in the prefs (so that they
		// can be synched between devices)
		await this.saveLocalMercenariesCollectionInfo(newMercenariesInfo);
		console.debug('[merc-memory] new merc info', newMercenariesInfo.Visitors);
		// console.debug(
		// 	'[merc-memory] ref infos',
		// 	await this.memoryService.getMercenariesCollectionInfo(),
		// 	await this.loadLocalMercenariesCollectionInfo(),
		// );
		console.debug('[merc-memory] savedVisitorsInfo', savedVisitorsInfo);
		// There is an issue if we couldn't get any info from the memory, as the merge will just clean up everything
		// So we pass a flag to know if we read the info from memory, and if not we don't remove tasks
		const newVisitorsInformation: readonly MemoryVisitor[] = this.mergeVisitors(
			newMercenariesInfo.Visitors ?? [],
			savedVisitorsInfo ?? [],
			readFromMemory,
		);
		console.debug('[merc-memory] newVisitorsInformation', newVisitorsInformation);
		const newCollection = {
			...newMercenariesInfo,
			Visitors: newVisitorsInformation,
		};
		console.debug('[merc-memory] newCollection', newCollection);
		return newCollection;
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
		console.debug('[merc-memory] retrieved mercenariesMemoryCollectionInfo from localStoarge', result);
		return result;
	}

	private mergeVisitors(
		fromMemory: readonly MemoryVisitor[],
		savedVisitorsInfo: readonly MemoryVisitor[],
		readFromMemory: boolean,
	): readonly MemoryVisitor[] {
		const updatedSavedVisitorsInfo = savedVisitorsInfo
			// First check if we have memory info that contradicts the saved info
			.map((visitor) => {
				const memoryVisitor = readFromMemory ? fromMemory.find((v) => v.VisitorId === visitor.VisitorId) : null;
				return memoryVisitor ?? visitor;
			})
			// Use a single CLAIMED status for completed tasks
			.map((visitor) =>
				visitor.Status === TaskStatus.CLAIMED || visitor.Status === TaskStatus.COMPLETE
					? { ...visitor, Status: TaskStatus.CLAIMED }
					: visitor,
			)
			// Then check for abandoned tasks
			// This happens if we can't find a memory visitor info for the same task, and the saved task hasn't been completed
			.map((visitor) => {
				if (visitor.Status === TaskStatus.CLAIMED) {
					return visitor;
				}

				const memoryVisitor = readFromMemory
					? fromMemory.find((v) => v.VisitorId === visitor.VisitorId && v.TaskId === visitor.TaskId)
					: null;
				// Found a match, we just return it
				if (!!memoryVisitor) {
					return memoryVisitor;
				}

				if (visitor.TaskChainProgress === 0) {
					return null;
				}

				// Here we have a saved task that isn't found in memory. This can be explained by multiple reasons, but
				// the one we will use is that the task has been abandoned.
				// So we simply update the saved task to the previous one in the chain
				return {
					...visitor,
					TaskChainProgress: Math.max(0, visitor.TaskChainProgress - 1),
					TaskId: -1,
					Status: TaskStatus.CLAIMED,
				};
			})
			.filter((visitor) => visitor);
		console.debug('[merc-memory] updated savedVisitorsInfo', updatedSavedVisitorsInfo);

		const cleanedVisitors = this.cleanVisitors([...fromMemory, ...updatedSavedVisitorsInfo]);
		console.debug('[merc-memory] cleanedVisitors', cleanedVisitors);
		this.prefs.updateMercenariesVisitorsProgress(cleanedVisitors);
		return cleanedVisitors;
	}

	private cleanVisitors(visitors: readonly MemoryVisitor[]): readonly MemoryVisitor[] {
		console.debug('[merc-memory] cleaning visitors', visitors);
		// Looks like some dupes can arise, clean things up
		const grouped = groupByFunction((visitor: MemoryVisitor) => visitor.VisitorId)(visitors);
		return Object.values(grouped).map((visitorGroup) => {
			// console.debug('[merc-memory] grouping visitors for', visitorGroup[0].VisitorId, visitorGroup);
			const highestProgress = Math.max(...visitorGroup.map((v) => v.TaskChainProgress));
			const highestVisitor = visitorGroup.find((v) => v.TaskChainProgress === highestProgress);
			return highestVisitor;
		});
	}
}
