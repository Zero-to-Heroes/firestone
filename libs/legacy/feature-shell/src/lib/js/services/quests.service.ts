import { Injectable } from '@angular/core';
import { QuestsInfo } from '@firestone-hs/reference-data';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { MemoryUpdate } from '../models/memory/memory-update';
import { ApiRunner } from './api-runner';
import { Events } from './events.service';
import { GameStatusService } from './game-status.service';
import { LocalStorageService } from './local-storage';
import { ActiveQuestsUpdatedEvent } from './mainwindow/store/events/quests/active-quests-updated-event';
import { ReferenceQuestsLoadedEvent } from './mainwindow/store/events/quests/reference-quests-loaded-event';
import { MemoryInspectionService } from './plugins/memory-inspection.service';
import { PreferencesService } from './preferences.service';
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
		private readonly events: Events,
		private readonly memory: MemoryInspectionService,
		private readonly gameStatus: GameStatusService,
	) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();
		combineLatest(
			this.store.listenPrefs$((prefs) => prefs.locale),
			this.requestedInitialReferenceQuestsLoad.asObservable(),
		)
			.pipe(
				filter(([[locale], load]) => load),
				map(([[locale], load]) => ({ locale })),
			)
			.subscribe(({ locale }) => this.loadReferenceQuests(locale));
		this.events.on(Events.MEMORY_UPDATE).subscribe(async (data) => {
			const changes: MemoryUpdate = data.data[0];
			// Assumption for now is that quests can only be completed during gameplay
			// Also, quests are not updated live while playing
			// TODO: doesn't account for rerolls
			if (changes.CurrentScene) {
				// this.previousScene = changes.CurrentScene;
				const activeQuests = await this.memory.getActiveQuests();
				this.store.send(new ActiveQuestsUpdatedEvent(activeQuests));
				// this.hasFetchedQuestsAtLeastOnce = true;
			}
		});
		// this.gameStatus.onGameExit(() => (this.hasFetchedQuestsAtLeastOnce = false));
	}

	public loadInitialReferenceQuests() {
		this.requestedInitialReferenceQuestsLoad.next(true);
	}

	public updateReferenceQuests(info: QuestsInfo) {
		this.localStorage.setItem('reference-quests', info);
	}

	public async loadReferenceQuests(locale?: string) {
		const localInfo = this.localStorage.getItem<QuestsInfo>('reference-quests');
		if (!!localInfo?.quests?.length) {
			console.log('[quests] loaded local reference quests');
			this.store.send(new ReferenceQuestsLoadedEvent(localInfo));
		}

		locale = locale ?? (await this.prefs.getPreferences()).locale;
		const result = await this.api.callGetApi<QuestsInfo>(REFERENCE_QUESTS_URL.replace('%locale%', locale));
		this.localStorage.setItem('reference-quests', result);
		this.store.send(new ReferenceQuestsLoadedEvent(result));
	}
}
