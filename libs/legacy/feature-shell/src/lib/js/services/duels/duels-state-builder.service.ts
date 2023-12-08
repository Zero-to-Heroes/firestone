/* eslint-disable @typescript-eslint/no-use-before-define */
import { EventEmitter, Injectable } from '@angular/core';
import { DeckDefinition } from '@firestone-hs/deckstrings';
import { DeckStat, DuelsStatDecks } from '@firestone-hs/duels-global-stats/dist/stat';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { DuelsInfo, MemoryInspectionService, MemoryUpdatesService } from '@firestone/memory';
import { ApiRunner, OverwolfService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { DuelsChoosingHeroEvent } from '@services/mainwindow/store/events/duels/duels-choosing-hero-event';
import { DuelsCurrentDeckEvent } from '@services/mainwindow/store/events/duels/duels-current-deck-event';
import { DuelsCurrentOptionEvent } from '@services/mainwindow/store/events/duels/duels-current-option-event';
import { DuelsIsOnDeckBuildingLobbyScreenEvent } from '@services/mainwindow/store/events/duels/duels-is-on-deck-building-lobby-screen-event';
import { DuelsIsOnMainScreenEvent } from '@services/mainwindow/store/events/duels/duels-is-on-main-screen-event';
import { BehaviorSubject, skipWhile } from 'rxjs';
import { DuelsDeckStat } from '../../models/duels/duels-player-stats';
import { Events } from '../events.service';
import { HsGameMetaData, runLoop } from '../game-mode-data.service';
import { DuelsTopDeckRunDetailsLoadedEvent } from '../mainwindow/store/events/duels/duels-top-deck-run-details-loaded-event';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { sleep } from '../utils';

const DUELS_RUN_DETAILS_URL = 'https://c3ewlwwljryrgtmeeqbwghb23y0xtltz.lambda-url.us-west-2.on.aws/';

@Injectable()
export class DuelsStateBuilderService {
	public isOnMainScreen = new BehaviorSubject<boolean>(null);
	public duelsInfo$$ = new BehaviorSubject<DuelsInfo>(null);

	private mainWindowStateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly api: ApiRunner,
		private readonly ow: OverwolfService,
		private readonly events: Events,
		private readonly memory: MemoryInspectionService,
		private readonly store: AppUiStoreFacadeService,
		private readonly memoryUpdates: MemoryUpdatesService,
	) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();

		this.initDuelsInfoObservable();
		this.events
			.on(Events.DUELS_LOAD_TOP_DECK_RUN_DETAILS)
			.subscribe((data) => this.loadTopDeckRunDetails(data.data[0], data.data[1]));

		this.memoryUpdates.memoryUpdates$$.subscribe(async (changes) => {
			// null simply means "no change"
			if (changes.IsDuelsMainRunScreen === true) {
				console.debug('[duels-state-builder] duels main screen');
				this.isOnMainScreen.next(true);
			} else if (changes.IsDuelsMainRunScreen === false) {
				console.debug('[duels-state-builder] duels not main screen');
				this.isOnMainScreen.next(false);
			}

			if (changes.IsDuelsDeckBuildingLobbyScreen != null) {
				this.mainWindowStateUpdater.next(
					new DuelsIsOnDeckBuildingLobbyScreenEvent(changes.IsDuelsDeckBuildingLobbyScreen),
				);
			}

			if (changes.DuelsCurrentOptionSelection != null) {
				this.mainWindowStateUpdater.next(new DuelsCurrentOptionEvent(changes.DuelsCurrentOptionSelection));
			}

			if (changes.IsDuelsChoosingHero != null) {
				this.mainWindowStateUpdater.next(new DuelsChoosingHeroEvent(changes.IsDuelsChoosingHero));
			}
		});

		setTimeout(() => {
			this.mainWindowStateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;

			// Don't emit the initial value
			this.duelsInfo$$.pipe(skipWhile((info) => info == null)).subscribe((duelsInfo) => {
				this.mainWindowStateUpdater.next(new DuelsCurrentDeckEvent(duelsInfo?.DuelsDeck));
			});
			this.isOnMainScreen.pipe(skipWhile((info) => info == null)).subscribe((onMainScreen) => {
				this.mainWindowStateUpdater.next(new DuelsIsOnMainScreenEvent(onMainScreen));
			});
		});
	}

	public async triggerDuelsMatchInfoRetrieve(metadata: HsGameMetaData, spectating: boolean) {
		if (spectating) {
			return;
		}

		console.debug('[duels-run] triggerDuelsMatchInfoRetrieve', metadata);
		await runLoop(async () => {
			const duelsInfo = await this.memory.getDuelsInfo();
			console.log('[duels-run] get duelsInfo', duelsInfo);
			if (duelsInfo?.Rating != null) {
				this.duelsInfo$$.next(duelsInfo);
				return true;
			}
			return false;
		}, 'duelsInfo');
	}

	private async loadTopDeckRunDetails(runId: string, deckId: number) {
		const results: any = await this.api.callGetApi(`${DUELS_RUN_DETAILS_URL}/${runId}`);
		const steps: readonly (GameStat | DuelsRunInfo)[] = results?.results;
		this.mainWindowStateUpdater.next(
			new DuelsTopDeckRunDetailsLoadedEvent({
				id: deckId,
				runId: runId,
				steps: steps,
			} as DuelsDeckStat),
		);
	}

	private initDuelsInfoObservable() {
		this.memoryUpdates.memoryUpdates$$.subscribe(async (changes) => {
			if (changes.IsDuelsMainRunScreen || (this.isOnMainScreen.value && changes.DuelsCurrentCardsInDeck)) {
				this.updateDuelsInfo();
			}
		});
		this.updateDuelsInfo();
	}

	private async updateDuelsInfo() {
		// Just make sure that the info is properly updated
		await sleep(200);
		const duelsInfo = await this.memory.getDuelsInfo();
		this.duelsInfo$$.next(duelsInfo);
	}
}

export interface ExtendedDuelsStatDecks extends DuelsStatDecks {
	decks: readonly ExtendedDeckStat[];
}

export interface ExtendedDeckStat extends DeckStat {
	readonly deckDefinition: DeckDefinition;
	readonly allCardNames: readonly string[];
}
