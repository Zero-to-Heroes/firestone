import { Injectable } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	LocalStorageService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, debounceTime, filter, take } from 'rxjs';
import { MemoryMercenariesCollectionInfo } from '../../models/memory/memory-mercenaries-collection-info';
import { MemoryMercenariesInfo } from '../../models/memory/memory-mercenaries-info';
import { Events } from '../events.service';
import { GameStatusService } from '../game-status.service';
import { SceneService } from '../game/scene.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
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
export class MercenariesMemoryCacheService extends AbstractFacadeService<MercenariesMemoryCacheService> {
	public memoryCollectionInfo$$: SubscriberAwareBehaviorSubject<MemoryMercenariesCollectionInfo>;
	public memoryMapInfo$$: SubscriberAwareBehaviorSubject<MemoryMercenariesInfo>;

	private internalSubscriber$$: SubscriberAwareBehaviorSubject<null>;

	private previousScene: SceneMode;
	private triggerMemoryReading$$ = new BehaviorSubject<boolean>(false);

	private memoryService: MemoryInspectionService;
	private events: Events;
	private localStorageService: LocalStorageService;
	private gameStatus: GameStatusService;
	private scene: SceneService;

	constructor(protected readonly windowManager: WindowManagerService) {
		super(windowManager, 'mercenariesMemoryCache', () => !!this.memoryCollectionInfo$$ && !!this.memoryMapInfo$$);
	}

	protected override assignSubjects() {
		this.memoryCollectionInfo$$ = this.mainInstance.memoryCollectionInfo$$;
		this.memoryMapInfo$$ = this.mainInstance.memoryMapInfo$$;
	}

	protected init() {
		this.memoryCollectionInfo$$ = new SubscriberAwareBehaviorSubject<MemoryMercenariesCollectionInfo>(null);
		this.memoryMapInfo$$ = new SubscriberAwareBehaviorSubject<MemoryMercenariesInfo>(null);
		this.internalSubscriber$$ = new SubscriberAwareBehaviorSubject<null>(null);
		this.memoryService = AppInjector.get(MemoryInspectionService);
		this.events = AppInjector.get(Events);
		this.localStorageService = AppInjector.get(LocalStorageService);
		this.gameStatus = AppInjector.get(GameStatusService);
		this.scene = AppInjector.get(SceneService);

		this.memoryCollectionInfo$$.onFirstSubscribe(() => {
			this.internalSubscriber$$.subscribe();
		});
		this.memoryMapInfo$$.onFirstSubscribe(() => {
			this.internalSubscriber$$.subscribe();
		});
		this.internalSubscriber$$.onFirstSubscribe(async () => {
			console.log('[mercenaries-memory-cache] reading local collection info');
			const localMercenariesInfo = await this.loadLocalMercenariesCollectionInfo();
			this.memoryCollectionInfo$$.next(localMercenariesInfo);

			this.initMemoryUpdateListener();
			this.gameStatus.inGame$$
				.pipe(
					filter((inGame) => inGame),
					take(1),
				)
				.subscribe(async () => {
					await this.readMercenariesMemoryInfo();
				});
		});
	}

	private async initMemoryUpdateListener() {
		await this.scene.isReady();

		let processingUpdate = false;
		this.triggerMemoryReading$$
			.pipe(
				filter((trigger) => trigger),
				debounceTime(1000),
			)
			.subscribe(async () => {
				if (processingUpdate) {
					return;
				}
				processingUpdate = true;
				await this.readMercenariesMemoryInfo();
				processingUpdate = false;
			});

		this.scene.currentScene$$.subscribe(async (newScene) => {
			if (!this.shouldFetchMercenariesMemoryInfo(newScene)) {
				this.previousScene = newScene;
				return;
			}

			this.previousScene = newScene;
			// Because when we get into a new map, the old map info is present in the memory for a short while
			if (newScene === SceneMode.LETTUCE_MAP) {
				await sleep(2000);
				this.triggerMemoryReading$$.next(true);
			}
		});
	}

	private async readMercenariesMemoryInfo() {
		console.log('[mercenaries-memory-cache] reading memory info');
		const newMercenariesCollectionInfo = await this.getMercenariesMergedCollectionInfo(true);
		if (newMercenariesCollectionInfo) {
			this.memoryCollectionInfo$$.next(newMercenariesCollectionInfo);
		}

		let mapInfo = await this.memoryService.getMercenariesInfo(1);
		let retiesLeft = 5;
		while (!mapInfo?.Map?.PlayerTeam?.length && retiesLeft >= 0) {
			await sleep(200);
			mapInfo = await this.memoryService.getMercenariesInfo(1);
			console.debug('[mercenaries-memory-cache] retrying to get mapInfo', mapInfo, retiesLeft);
			retiesLeft--;
		}

		console.debug('[mercenaries-memory-cache] got mapInfo', mapInfo);
		this.memoryMapInfo$$.next(mapInfo);
		console.log('[mercenaries-memory-cache] updated memory info');
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

	private async getMercenariesMergedCollectionInfo(
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
