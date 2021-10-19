import { EventEmitter, Injectable } from '@angular/core';
import { SceneMode, TaskStatus } from '@firestone-hs/reference-data';
import { MemoryMercenariesCollectionInfo, MemoryVisitor } from '../../models/memory/memory-mercenaries-collection-info';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { Events } from '../events.service';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { MercenariesCollectionInformationFromMemoryEvent } from '../mainwindow/store/events/mercenaries/mercenaries-collection-information-from-memory-event';
import { OverwolfService } from '../overwolf.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { PreferencesService } from '../preferences.service';
import { sleep } from '../utils';
import { SCENE_WITH_RELEVANT_MERC_INFO } from './out-of-combat/parser/mercenaries-memory-information-parser';

@Injectable()
export class MercenariesMemoryUpdateService {
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly memoryService: MemoryInspectionService,
		private readonly events: Events,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
	) {
		this.init();
	}

	public async getMercenariesCollectionInfo(): Promise<MemoryMercenariesCollectionInfo> {
		const newMercenariesInfo: MemoryMercenariesCollectionInfo =
			(await this.memoryService.getMercenariesCollectionInfo()) ??
			(await this.loadLocalMercenariesCollectionInfo());
		if (!newMercenariesInfo) {
			return null;
		}

		await this.saveLocalMercenariesCollectionInfo(newMercenariesInfo);
		console.debug('[merc-memory] new merc info', newMercenariesInfo);
		const prefs = await this.prefs.getPreferences();
		const savedVisitorsInfo: readonly MemoryVisitor[] = prefs.mercenariesVisitorsProgress ?? [];
		console.log('no-format', '[merc-memory] savedVisitorsInfo', savedVisitorsInfo, newMercenariesInfo.Visitors);
		const newVisitorsInformation: readonly MemoryVisitor[] = this.mergeVisitors(
			newMercenariesInfo.Visitors,
			savedVisitorsInfo,
		);
		console.log('no-format', '[merc-memory] newVisitorsInformation', newVisitorsInformation);
		return {
			...newMercenariesInfo,
			Visitors: newVisitorsInformation,
		};
	}

	private init() {
		this.events.on(Events.MEMORY_UPDATE).subscribe(async (event) => {
			const changes: MemoryUpdate = event.data[0];
			const newScene = changes.CurrentScene;
			if (!SCENE_WITH_RELEVANT_MERC_INFO.includes(newScene)) {
				return;
			}
			console.debug('[merc-memory] changing scene, refreshing merc info', newScene, SceneMode[newScene]);
			await sleep(2000);
			console.debug('[merc-memory] done waiting');
			const newMercenariesInfo = await this.getMercenariesCollectionInfo();
			this.stateUpdater.next(new MercenariesCollectionInformationFromMemoryEvent(newMercenariesInfo));
		});

		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	private async saveLocalMercenariesCollectionInfo(newMercenariesInfo: MemoryMercenariesCollectionInfo) {
		localStorage.setItem('mercenariesMemoryCollectionInfo', JSON.stringify(newMercenariesInfo));
		console.debug(
			'saved mercenariesMemoryCollectionInfo in localStorage',
			JSON.parse(localStorage.getItem('mercenariesMemoryCollectionInfo')),
		);
		return;
	}

	private async loadLocalMercenariesCollectionInfo(): Promise<MemoryMercenariesCollectionInfo> {
		const result = JSON.parse(localStorage.getItem('mercenariesMemoryCollectionInfo'));
		console.debug('retrieved mercenariesMemoryCollectionInfo from localStoarge', result);
		return result;
	}

	private mergeVisitors(
		fromMemory: readonly MemoryVisitor[],
		savedVisitorsInfo: readonly MemoryVisitor[],
	): readonly MemoryVisitor[] {
		fromMemory = fromMemory ?? [];
		savedVisitorsInfo = savedVisitorsInfo ?? [];
		// Use the memory as the base, as it's the latest info we have
		const result = [...fromMemory];
		for (const visitorInfo of savedVisitorsInfo) {
			if (!result.map((v) => v.TaskId).includes(visitorInfo.TaskId)) {
				// If it's not in memory anymore, this means that the task has been either abandoned or claimed
				if (visitorInfo.Status === TaskStatus.COMPLETE || visitorInfo.Status === TaskStatus.CLAIMED) {
					result.push({
						...visitorInfo,
						Status: TaskStatus.CLAIMED,
					});
				}
				// If it was not in a "COMPLETE" state last time we checked the board, and is not
				// there anymore, this means that it got abandoned, and we remove it
			}
		}
		this.prefs.updateMercenariesVisitorsProgress(result);
		return result;
	}
}
