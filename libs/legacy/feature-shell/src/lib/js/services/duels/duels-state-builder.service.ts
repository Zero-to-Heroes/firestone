/* eslint-disable @typescript-eslint/no-use-before-define */
import { EventEmitter, Injectable } from '@angular/core';
import { DeckDefinition } from '@firestone-hs/deckstrings';
import { DeckStat, DuelsStatDecks } from '@firestone-hs/duels-global-stats/dist/stat';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { ApiRunner, CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { DuelsAdventureInfoService } from '@legacy-import/src/lib/js/services/duels/duels-adventure-info.service';
import { DuelsConfig } from '@models/duels/duels-config';
import { DuelsInfo } from '@models/memory/memory-duels';
import { MemoryUpdate } from '@models/memory/memory-update';
import { DuelsChoosingHeroEvent } from '@services/mainwindow/store/events/duels/duels-choosing-hero-event';
import { DuelsCurrentDeckEvent } from '@services/mainwindow/store/events/duels/duels-current-deck-event';
import { DuelsCurrentOptionEvent } from '@services/mainwindow/store/events/duels/duels-current-option-event';
import { DuelsIsOnDeckBuildingLobbyScreenEvent } from '@services/mainwindow/store/events/duels/duels-is-on-deck-building-lobby-screen-event';
import { DuelsIsOnMainScreenEvent } from '@services/mainwindow/store/events/duels/duels-is-on-main-screen-event';
import { MemoryInspectionService } from '@services/plugins/memory-inspection.service';
import { BehaviorSubject } from 'rxjs';
import { DuelsDeckStat } from '../../models/duels/duels-player-stats';
import { DuelsState } from '../../models/duels/duels-state';
import { DuelsCategory } from '../../models/mainwindow/duels/duels-category';
import { PatchInfo } from '../../models/patches';
import { Events } from '../events.service';
import { HsGameMetaData, runLoop } from '../game-mode-data.service';
import { LocalizationFacadeService } from '../localization-facade.service';
import { DuelsTopDeckRunDetailsLoadedEvent } from '../mainwindow/store/events/duels/duels-top-deck-run-details-loaded-event';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { sleep } from '../utils';

const DUELS_CONFIG_URL = 'https://static.zerotoheroes.com/hearthstone/data/duels-config.json';
const DUELS_RUN_DETAILS_URL = 'https://c3ewlwwljryrgtmeeqbwghb23y0xtltz.lambda-url.us-west-2.on.aws/';

@Injectable()
export class DuelsStateBuilderService {
	public isOnMainScreen = new BehaviorSubject<boolean>(false);
	public duelsInfo$$ = new BehaviorSubject<DuelsInfo>(null);

	private mainWindowStateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly api: ApiRunner,
		private readonly ow: OverwolfService,
		// private readonly prefs: PreferencesService,
		private readonly allCards: CardsFacadeService,
		private readonly events: Events,
		private readonly i18n: LocalizationFacadeService,
		private readonly memory: MemoryInspectionService,
		private readonly duelsMemoryCeche: DuelsAdventureInfoService,
		private readonly store: AppUiStoreFacadeService,
	) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();

		this.initDuelsInfoObservable();
		this.events
			.on(Events.DUELS_LOAD_TOP_DECK_RUN_DETAILS)
			.subscribe((data) => this.loadTopDeckRunDetails(data.data[0], data.data[1]));

		this.events.on(Events.MEMORY_UPDATE).subscribe(async (data) => {
			const changes: MemoryUpdate = data.data[0];
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

			this.duelsInfo$$.subscribe((duelsInfo) => {
				this.mainWindowStateUpdater.next(new DuelsCurrentDeckEvent(duelsInfo?.DuelsDeck));
			});
			this.isOnMainScreen.subscribe((deck) => {
				this.mainWindowStateUpdater.next(new DuelsIsOnMainScreenEvent(deck));
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

	public async loadConfig(): Promise<DuelsConfig> {
		const result: DuelsConfig = await this.api.callGetApi(DUELS_CONFIG_URL);
		console.log('[duels-state-builder] loaded duels config');
		return result;
	}

	public initState(
		initialState: DuelsState,
		// globalStats: DuelsStat,
		// duelsRunInfo: readonly DuelsRunInfo[],
		// duelsRewardsInfo: readonly DuelsRewardsInfo[],
		duelsConfig: DuelsConfig,
		// leaderboard: DuelsLeaderboard,
		// bucketsData: readonly DuelsBucketsData[],
		// collectionState: BinderState,
		// adventuresInfo: AdventuresInfo,
		currentDuelsMetaPatch?: PatchInfo,
	): DuelsState {
		const categories: readonly DuelsCategory[] = this.buildCategories();
		return initialState.update({
			categories: categories,
			// globalStats: globalStats,
			config: duelsConfig,
			// topDecks: topDecks,
			// duelsRunInfos: duelsRunInfo,
			// duelsRewardsInfo: duelsRewardsInfo,
			// bucketsData: bucketsData,
			// leaderboard: leaderboard,
			// adventuresInfo: adventuresInfo,
			currentDuelsMetaPatch: currentDuelsMetaPatch,
			loading: false,
			initComplete: true,
		});
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

	private buildCategories(): readonly DuelsCategory[] {
		const result = [
			DuelsCategory.create({
				id: 'duels-runs',
				name: this.i18n.translateString('app.duels.menu.my-runs'),
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
			DuelsCategory.create({
				id: 'duels-personal-decks',
				name: this.i18n.translateString('app.duels.menu.my-decks'),
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
			DuelsCategory.create({
				id: 'duels-stats',
				name: this.i18n.translateString('app.duels.menu.heroes'),
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
			DuelsCategory.create({
				id: 'duels-treasures',
				name: this.i18n.translateString('app.duels.menu.treasures'),
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
			DuelsCategory.create({
				id: 'duels-top-decks',
				name: this.i18n.translateString('app.duels.menu.high-win-decks'),
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
			DuelsCategory.create({
				id: 'duels-deck-details',
				name: null,
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
			DuelsCategory.create({
				id: 'duels-personal-deck-details',
				name: null,
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
			DuelsCategory.create({
				id: 'duels-leaderboard',
				name: this.i18n.translateString('app.duels.menu.leaderboard'),
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
			DuelsCategory.create({
				id: 'duels-deckbuilder',
				name: this.i18n.translateString('app.duels.menu.deckbuilder'),
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
			DuelsCategory.create({
				id: 'duels-buckets',
				name: this.i18n.translateString('app.duels.menu.buckets'),
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
		];
		return result;
	}

	private initDuelsInfoObservable() {
		this.events.on(Events.MEMORY_UPDATE).subscribe(async (data) => {
			const changes: MemoryUpdate = data.data[0];
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
