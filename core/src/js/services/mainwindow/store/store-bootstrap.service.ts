import { EventEmitter, Injectable } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { DuelsMemoryCacheService } from '@services/duels/duels-memory-cache.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { ArenaState } from '../../../models/arena/arena-state';
import { DuelsState } from '../../../models/duels/duels-state';
import { AchievementsState } from '../../../models/mainwindow/achievements-state';
import { DecktrackerState } from '../../../models/mainwindow/decktracker/decktracker-state';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { ReplaysState } from '../../../models/mainwindow/replays/replays-state';
import { SocialShareUserInfo } from '../../../models/mainwindow/social-share-user-info';
import { MercenariesState } from '../../../models/mercenaries/mercenaries-state';
import { FORCE_LOCAL_PROP, Preferences } from '../../../models/preferences';
import { AchievementsRepository } from '../../achievement/achievements-repository.service';
import { ArenaStateBuilderService } from '../../arena/arena-state-builder.service';
import { BgsBestUserStatsService } from '../../battlegrounds/bgs-best-user-stats.service';
import { BgsGlobalStatsService } from '../../battlegrounds/bgs-global-stats.service';
import { BgsInitService } from '../../battlegrounds/bgs-init.service';
import { BattlegroundsQuestsService } from '../../battlegrounds/bgs-quests.service';
import { CardsInitService } from '../../cards-init.service';
import { ArenaRunParserService } from '../../decktracker/arena-run-parser.service';
import { DecktrackerStateLoaderService } from '../../decktracker/main/decktracker-state-loader.service';
import { ReplaysStateBuilderService } from '../../decktracker/main/replays-state-builder.service';
import { DuelsLootParserService } from '../../duels/duels-loot-parser.service';
import { DuelsStateBuilderService } from '../../duels/duels-state-builder.service';
import { GlobalStatsService } from '../../global-stats/global-stats.service';
import { MercenariesMemoryCacheService } from '../../mercenaries/mercenaries-memory-cache.service';
import { MercenariesStateBuilderService } from '../../mercenaries/mercenaries-state-builder.service';
import { OverwolfService } from '../../overwolf.service';
import { PatchesConfigService } from '../../patches-config.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { PreferencesService } from '../../preferences.service';
import { GameStatsLoaderService } from '../../stats/game/game-stats-loader.service';
import { StatsStateBuilderService } from '../../stats/stats-state-builder.service';
import { UserService } from '../../user.service';
import { sleep } from '../../utils';
import { CollectionBootstrapService } from './collection-bootstrap.service';
import { MainWindowStoreEvent } from './events/main-window-store-event';
import { StoreInitEvent } from './events/store-init-event';
import { AchievementUpdateHelper } from './helper/achievement-update-helper';

@Injectable()
export class StoreBootstrapService {
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly cardsInit: CardsInitService,
		private readonly achievementsRepository: AchievementsRepository,
		private readonly achievementsHelper: AchievementUpdateHelper,
		private readonly ow: OverwolfService,
		private readonly userService: UserService,
		private readonly prefs: PreferencesService,
		private readonly gameStatsLoader: GameStatsLoaderService,
		private readonly bgsInit: BgsInitService,
		private readonly bgsGlobalStats: BgsGlobalStatsService,
		private readonly init_bgsQuestsService: BattlegroundsQuestsService,
		private readonly replaysStateBuilder: ReplaysStateBuilderService,
		private readonly decktrackerStateLoader: DecktrackerStateLoaderService,
		private readonly globalStats: GlobalStatsService,
		private readonly bestBgsStats: BgsBestUserStatsService,
		private readonly collectionBootstrap: CollectionBootstrapService,
		private readonly patchConfig: PatchesConfigService,
		private readonly duels: DuelsStateBuilderService,
		private readonly arena: ArenaStateBuilderService,
		private readonly dungeonLoot: DuelsLootParserService,
		private readonly arenaService: ArenaRunParserService,
		private readonly stats: StatsStateBuilderService,
		private readonly mercenariesService: MercenariesStateBuilderService,
		private readonly mercenariesMemory: MercenariesMemoryCacheService,
		private readonly memory: MemoryInspectionService,
		private readonly duelsMemoryCache: DuelsMemoryCacheService,
		private readonly i18n: LocalizationFacadeService,
	) {
		console.log('[store-boostrap] constructor');
		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
			console.log('[store-boostrap] retrieved state updater');
		});
	}

	private async ready() {
		while (!this.stateUpdater) {
			await sleep(100);
		}
	}

	public async initStore(initialState: MainWindowState) {
		await this.ready();
		// First load for the FTUE
		const prefs = await this.prefs.getPreferences();
		const showFtue = !prefs.ftue.hasSeenGlobalFtue;
		// Early init to avoid having the navigation jump when restoring the app to the previous tab
		const windowStateForFtue = initialState.update({
			showFtue: showFtue,
		} as MainWindowState);
		this.stateUpdater.next(new StoreInitEvent(windowStateForFtue, false));

		// First update the prefs, for local installs
		const prefsFromRemote = await this.prefs.loadRemotePrefs();

		console.debug('remote prefs', prefsFromRemote, prefs);
		const mergedPrefs = await this.mergePrefs(prefs, prefsFromRemote);

		// Load all the initial data
		const [
			[
				socialShareUserInfo,
				currentUser,
				achievementTopCategories,
				achievementHistory,
				collectionState,
				currentScene,
			],
			[constructedConfig],
			[matchStats, archetypesConfig, archetypesStats],
			[
				[duelsRunInfo, duelsRewardsInfo],
				duelsGlobalStats,
				duelsGlobalStatsDecks,
				duelsConfig,
				duelsLeaderboard,
				duelsBucketsData,
				adventuresInfo,
			],
			[arenaRewards],
			[mercenariesCollection],
		] = await Promise.all([
			Promise.all([
				this.initializeSocialShareUserInfo(),
				this.userService.getCurrentUser(),
				this.achievementsRepository.getTopLevelCategories(),
				this.achievementsHelper.buildAchievementHistory(),
				this.collectionBootstrap.initCollectionState(),
				this.memory.getCurrentSceneFromMindVision(),
			]),
			Promise.all([this.decktrackerStateLoader.loadConfig()]),
			Promise.all([
				this.gameStatsLoader.retrieveStats(),
				this.gameStatsLoader.retrieveArchetypesConfig(),
				this.gameStatsLoader.retrieveArchetypesStats(),
			]),
			Promise.all([
				this.duels.loadRuns(),
				this.duels.loadGlobalStats(),
				this.duels.loadTopDecks(),
				this.duels.loadConfig(),
				this.duels.loadLeaderboard(),
				this.duels.loadBuckets(),
				this.duelsMemoryCache.getAdventuresInfo(),
			]),
			Promise.all([this.arena.loadRewards()]),
			Promise.all([
				// this.mercenariesService.loadGlobalStats(),
				// this.mercenariesService.loadReferenceData(),
				this.mercenariesMemory.getMercenariesMergedCollectionInfo(),
			]),
		]);
		console.log('loaded info');

		const bgsGlobalStats = await this.bgsGlobalStats.loadGlobalStats(
			mergedPrefs.bgsActiveTribesFilter,
			mergedPrefs.bgsActiveTimeFilter,
		);

		const patchConfig = await this.patchConfig.getConf();
		const currentBattlegroundsMetaPatch = patchConfig?.patches
			? patchConfig.patches.find((patch) => patch.number === patchConfig.currentBattlegroundsMetaPatch)
			: null;
		const battlegroundsAppState = await this.bgsInit.initBattlegoundsAppState(
			bgsGlobalStats,
			currentBattlegroundsMetaPatch,
		);

		const newStatsState = this.stats.initState(prefs, matchStats, archetypesConfig, archetypesStats);
		const currentRankedMetaPatch = patchConfig?.patches
			? patchConfig.patches.find((patch) => patch.number === patchConfig.currentConstructedMetaPatch)
			: null;
		const decktracker = this.decktrackerStateLoader.buildState(
			new DecktrackerState(),
			newStatsState,
			constructedConfig,
			currentRankedMetaPatch,
			mergedPrefs,
		);
		const replayState: ReplaysState = await this.replaysStateBuilder.buildState(new ReplaysState(), newStatsState);

		// Update prefs to remove hidden deck codes that are not in an active deck anymore
		const allDeckCodes = newStatsState.gameStats.stats.map((match) => match.playerDecklist);
		const validHiddenCodes = mergedPrefs.desktopDeckHiddenDeckCodes.filter((deckCode) =>
			allDeckCodes.includes(deckCode),
		);
		await this.prefs.setDesktopDeckHiddenDeckCodes(validHiddenCodes);

		const newAchievementState = Object.assign(new AchievementsState(), {
			categories: achievementTopCategories,
			achievementHistory: achievementHistory,
			isLoading: false,
			filters: AchievementsState.buildFilterOptions(this.i18n),
		} as AchievementsState);

		this.arenaService.setLastArenaMatch(
			newStatsState.gameStats?.stats?.filter((stat) => stat.gameMode === 'arena'),
		);

		const currentDuelsMetaPatch = patchConfig?.patches
			? patchConfig.patches.find((patch) => patch.number === patchConfig.currentDuelsMetaPatch)
			: null;
		const duelsStats: DuelsState = this.duels.initState(
			duelsGlobalStats,
			duelsGlobalStatsDecks,
			duelsRunInfo,
			duelsRewardsInfo,
			duelsConfig,
			duelsLeaderboard,
			duelsBucketsData,
			collectionState,
			adventuresInfo,
		);
		const newDuelsState = await this.duels.updateState(
			duelsStats,
			matchStats,
			duelsStats?.currentDuelsMetaPatch || currentDuelsMetaPatch,
		);

		const currentArenaMetaPatch = patchConfig?.patches
			? patchConfig.patches.find((patch) => patch.number === patchConfig.currentArenaMetaPatch)
			: null;
		const arenaState: ArenaState = await this.arena.initState(currentArenaMetaPatch, arenaRewards);

		const mercenariesState: MercenariesState = await this.mercenariesService.initState(
			windowStateForFtue.mercenaries,
			// mercenariesGlobalStats,
			// mercenariesReferenceData,
			mercenariesCollection,
		);

		const initialWindowState = windowStateForFtue.update({
			currentScene: currentScene,
			lastNonGamePlayScene: currentScene === SceneMode.GAMEPLAY ? null : currentScene,
			currentUser: currentUser,
			showFtue: !mergedPrefs.ftue.hasSeenGlobalFtue,
			replays: replayState,
			binder: collectionState,
			achievements: newAchievementState,
			decktracker: decktracker,
			battlegrounds: battlegroundsAppState,
			duels: newDuelsState,
			arena: arenaState,
			mercenaries: mercenariesState,
			socialShareUserInfo: socialShareUserInfo,
			stats: newStatsState,
		} as MainWindowState);
		console.debug('initialWindowState', initialWindowState);
		this.stateUpdater.next(new StoreInitEvent(initialWindowState, true));
	}

	private async mergePrefs(prefs: Preferences, prefsFromRemote: Preferences): Promise<Preferences> {
		console.log('not merging prefs for now, first needs to fix a bug');
		return prefs;

		if (!prefsFromRemote) {
			console.log('no remote prefs, using local prefs');
			return prefs;
		}

		if (
			prefs?.lastUpdateDate &&
			(!prefsFromRemote?.lastUpdateDate ||
				// Can happen if the remote prefs was not updated when closing the app
				prefsFromRemote.lastUpdateDate.getTime() < prefs.lastUpdateDate.getTime())
		) {
			console.warn(
				'not using remote prefs, they are older than local prefs',
				prefsFromRemote?.lastUpdateDate,
				prefs?.lastUpdateDate,
			);
			this.prefs.updateRemotePreferences();
			return prefs;
		}

		const merged: Preferences = {
			// Use local prefs first, so that by default we have all the positions and non-synched
			// properties with the right values. We then just update with the saved remote values
			...(prefs ?? prefsFromRemote),
		} as Preferences;

		const obj = new Preferences();
		for (const prop in obj) {
			const meta = Reflect.getMetadata(FORCE_LOCAL_PROP, obj, prop);
			if (meta && obj.hasOwnProperty(prop)) {
				merged[prop] = prefsFromRemote[prop] ?? prefs[prop];
			}
		}
		await this.prefs.savePreferences(merged);
		console.debug('merged prefs', merged);
		// if (!merged?.opponentOverlayPosition) {
		// 	console.warn('no-format', 'pref missing overlay position', merged, new Error().stack);
		// }
		return merged;
	}

	private async initializeSocialShareUserInfo(): Promise<SocialShareUserInfo> {
		const twitter = await this.ow.getTwitterUserInfo();
		return Object.assign(new SocialShareUserInfo(), {
			twitter: twitter,
		} as SocialShareUserInfo);
	}
}
