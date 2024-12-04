import { Injectable } from '@angular/core';
import { QuestsInfo } from '@firestone-hs/reference-data';
import { MemoryInspectionService, SceneService } from '@firestone/memory';
import { GameStatusService, PreferencesService } from '@firestone/shared/common/service';
import { deepEqual } from '@firestone/shared/framework/common';
import { ApiRunner, LocalStorageService, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap, take } from 'rxjs/operators';
import { ActiveQuestsUpdatedEvent } from './mainwindow/store/events/quests/active-quests-updated-event';
import { ReferenceQuestsLoadedEvent } from './mainwindow/store/events/quests/reference-quests-loaded-event';
import { AppUiStoreFacadeService } from './ui-store/app-ui-store-facade.service';

const REFERENCE_QUESTS_URL = 'https://static.firestoneapp.com/data/quests/quests-data_%locale%.gz.json';

@Injectable()
export class QuestsService {
	private requestedInitialReferenceQuestsLoad = new BehaviorSubject<boolean>(false);

	// private previousScene: SceneMode;
	// private hasFetchedQuestsAtLeastOnce: boolean;

	constructor(
		private readonly api: ApiRunner,
		private readonly store: AppUiStoreFacadeService,
		private readonly localStorage: LocalStorageService,
		private readonly prefs: PreferencesService,
		private readonly memory: MemoryInspectionService,
		private readonly gameStatus: GameStatusService,
		private readonly scene: SceneService,
	) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();
		await waitForReady(this.scene, this.prefs);

		// TODO: expose subject via the store, instead of using the common global state
		combineLatest([
			this.gameStatus.inGame$$,
			this.prefs.preferences$$.pipe(
				map((prefs) => prefs.enableQuestsWidget),
				distinctUntilChanged(),
			),
		])
			.pipe(
				filter(([inGame, enableQuestsWidget]) => inGame && enableQuestsWidget),
				take(1),
			)
			.subscribe(() => {
				combineLatest([
					this.prefs.preferences$$.pipe(
						map((prefs) => prefs.locale),
						distinctUntilChanged(),
					),
					this.requestedInitialReferenceQuestsLoad.asObservable(),
				])
					.pipe(
						filter(([locale, load]) => load),
						map(([locale, load]) => ({ locale })),
					)
					.subscribe(({ locale }) => this.loadReferenceQuests(locale));
				this.scene.currentScene$$
					// Assumption for now is that quests can only be completed during gameplay
					// Also, quests are not updated live while playing
					// TODO: doesn't account for rerolls
					.pipe(
						switchMap((scene) => this.memory.getActiveQuests()),
						distinctUntilChanged((a, b) => deepEqual(a, b)),
					)
					.subscribe(async (activeQuests) => {
						this.store.send(new ActiveQuestsUpdatedEvent(activeQuests));
					});
			});
	}

	public loadInitialReferenceQuests() {
		this.requestedInitialReferenceQuestsLoad.next(true);
	}

	public updateReferenceQuests(info: QuestsInfo) {
		this.localStorage.setItem(LocalStorageService.REFERENCE_QUESTS, info);
	}

	public async loadReferenceQuests(locale?: string) {
		const localInfo = this.localStorage.getItem<QuestsInfo>(LocalStorageService.REFERENCE_QUESTS);
		if (!!localInfo?.quests?.length) {
			console.log('[quests] loaded local reference quests');
			this.store.send(new ReferenceQuestsLoadedEvent(localInfo));
		}

		locale = locale ?? (await this.prefs.getPreferences()).locale;
		const result = await this.api.callGetApi<QuestsInfo>(REFERENCE_QUESTS_URL.replace('%locale%', locale));
		this.localStorage.setItem(LocalStorageService.REFERENCE_QUESTS, result);
		this.store.send(new ReferenceQuestsLoadedEvent(result));
	}
}
