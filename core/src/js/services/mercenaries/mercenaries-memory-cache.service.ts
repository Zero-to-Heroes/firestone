import { Injectable } from '@angular/core';
import { SceneMode, TaskStatus } from '@firestone-hs/reference-data';
import { Subject } from 'rxjs';
import { MemoryMercenariesCollectionInfo, MemoryVisitor } from '../../models/memory/memory-mercenaries-collection-info';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { Events } from '../events.service';
import { LOCAL_STORAGE_MERCENARIES_COLLECTION } from '../local-storage';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { PreferencesService } from '../preferences.service';
import { groupByFunction, sleep } from '../utils';

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

	private previousScene: SceneMode;

	constructor(
		private readonly memoryService: MemoryInspectionService,
		private readonly events: Events,
		private readonly prefs: PreferencesService,
	) {
		this.init();
	}

	private init() {
		this.events.on(Events.MEMORY_UPDATE).subscribe(async (event) => {
			const changes: MemoryUpdate = event.data[0];
			const newScene = changes.CurrentScene;
			if (!this.shouldFetchMercenariesMemoryInfo(newScene)) {
				this.previousScene = newScene;
				return;
			}
			this.previousScene = newScene;
			console.debug('[merc-memory] changing scene, refreshing merc info', newScene, SceneMode[newScene]);
			await sleep(2000);
			console.debug('[merc-memory] done waiting');
			const newMercenariesInfo = await this.getMercenariesMergedCollectionInfo();
			this.memoryCollectionInfo$.next(newMercenariesInfo);
		});
	}

	public shouldFetchMercenariesMemoryInfo(newScene: SceneMode): boolean {
		if (!SCENE_WITH_RELEVANT_MERC_INFO.includes(newScene)) {
			console.debug('[merc-memory] non relevant scene', newScene);
			return false;
		}
		if (newScene === SceneMode.GAMEPLAY && !MERCENARIES_SCENES.includes(this.previousScene)) {
			console.debug('[merc-memory] not coming from lettuce scene', newScene, this.previousScene);
			return false;
		}
		return true;
	}

	public async getMercenariesMergedCollectionInfo(): Promise<MemoryMercenariesCollectionInfo> {
		const newMercenariesInfo: MemoryMercenariesCollectionInfo =
			(await this.memoryService.getMercenariesCollectionInfo()) ??
			(await this.loadLocalMercenariesCollectionInfo());
		if (!newMercenariesInfo) {
			return null;
		}

		await this.saveLocalMercenariesCollectionInfo(newMercenariesInfo);
		console.debug('[merc-memory] new merc info', newMercenariesInfo.Visitors);
		const prefs = await this.prefs.getPreferences();
		const savedVisitorsInfo: readonly MemoryVisitor[] = prefs.mercenariesVisitorsProgress ?? [];
		console.debug('[merc-memory] savedVisitorsInfo', savedVisitorsInfo);
		const newVisitorsInformation: readonly MemoryVisitor[] = this.mergeVisitors(
			newMercenariesInfo.Visitors ?? [],
			savedVisitorsInfo ?? [],
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
		localStorage.setItem(LOCAL_STORAGE_MERCENARIES_COLLECTION, JSON.stringify(newMercenariesInfo));
		return;
	}

	private async loadLocalMercenariesCollectionInfo(): Promise<MemoryMercenariesCollectionInfo> {
		const result = JSON.parse(localStorage.getItem(LOCAL_STORAGE_MERCENARIES_COLLECTION));
		console.debug('[merc-memory] retrieved mercenariesMemoryCollectionInfo from localStoarge', result);
		return result;
	}

	private mergeVisitors(
		fromMemory: readonly MemoryVisitor[],
		savedVisitorsInfo: readonly MemoryVisitor[],
	): readonly MemoryVisitor[] {
		const updatedSavedVisitorsInfo = savedVisitorsInfo.map((visitor) => {
			const memoryVisitor = fromMemory.find(
				(v) => v.VisitorId === visitor.VisitorId && v.TaskId === visitor.TaskId,
			);
			return !memoryVisitor
				? // If there are tasks in the saved preferences that don't appear in the memory, it means
				  // that they have been either completed or abandoned
				  visitor.TaskChainProgress === 0
					? visitor
					: { ...visitor, Status: TaskStatus.CLAIMED }
				: // And if a task in memory is also in the prefs, make sure they have the same status
				  { ...visitor, Status: memoryVisitor.Status };
		});

		const cleanedVisitors = this.cleanVisitors([...fromMemory, ...updatedSavedVisitorsInfo]);
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
