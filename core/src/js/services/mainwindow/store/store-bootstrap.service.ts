import { EventEmitter, Injectable } from '@angular/core';
import { DuelsState } from '../../../models/duels/duels-state';
import { AchievementsState } from '../../../models/mainwindow/achievements-state';
import { DecktrackerState } from '../../../models/mainwindow/decktracker/decktracker-state';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { ReplaysState } from '../../../models/mainwindow/replays/replays-state';
import { SocialShareUserInfo } from '../../../models/mainwindow/social-share-user-info';
import { StatsState } from '../../../models/mainwindow/stats/stats-state';
import { BgsBestUserStatsService } from '../../battlegrounds/bgs-best-user-stats.service';
import { BgsBuilderService } from '../../battlegrounds/bgs-builder.service';
import { BgsInitService } from '../../battlegrounds/bgs-init.service';
import { DecktrackerStateLoaderService } from '../../decktracker/main/decktracker-state-loader.service';
import { ReplaysStateBuilderService } from '../../decktracker/main/replays-state-builder.service';
import { DuelsStateBuilderService } from '../../duels/duels-state-builder.service';
import { Events } from '../../events.service';
import { GlobalStatsService } from '../../global-stats/global-stats.service';
import { OverwolfService } from '../../overwolf.service';
import { PatchesConfigService } from '../../patches-config.service';
import { PreferencesService } from '../../preferences.service';
import { GameStatsLoaderService } from '../../stats/game/game-stats-loader.service';
import { UserService } from '../../user.service';
import { CollectionBootstrapService } from './collection-bootstrap.service';
import { MainWindowStoreEvent } from './events/main-window-store-event';
import { StoreInitEvent } from './events/store-init-event';
import { AchievementUpdateHelper } from './helper/achievement-update-helper';

@Injectable()
export class StoreBootstrapService {
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly events: Events,
		private readonly achievementsHelper: AchievementUpdateHelper,
		private readonly ow: OverwolfService,
		private readonly userService: UserService,
		private readonly prefs: PreferencesService,
		private readonly gameStatsLoader: GameStatsLoaderService,
		private readonly bgsInit: BgsInitService,
		private readonly bgsBuilder: BgsBuilderService,
		private readonly replaysStateBuilder: ReplaysStateBuilderService,
		private readonly decktrackerStateLoader: DecktrackerStateLoaderService,
		private readonly globalStats: GlobalStatsService,
		private readonly bestBgsStats: BgsBestUserStatsService,
		private readonly collectionBootstrap: CollectionBootstrapService,
		private readonly patchConfig: PatchesConfigService,
		private readonly duels: DuelsStateBuilderService,
	) {
		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	public async initStore() {
		// Load all the initial data
		const [
			[
				socialShareUserInfo,
				currentUser,
				prefs,
				achievementGlobalCategories,
				achievementHistory,
				matchStats,
				globalStats,
				bgsBestUserStats,
				collectionState,
				duelsRunInfo,
			],
			duelsGlobalStats,
		] = await Promise.all([
			Promise.all([
				this.initializeSocialShareUserInfo(),
				this.userService.getCurrentUser(),
				this.prefs.getPreferences(),
				this.achievementsHelper.buildGlobalCategories(),
				this.achievementsHelper.buildAchievementHistory(),
				this.gameStatsLoader.retrieveStats(),
				this.globalStats.getGlobalStats(),
				this.bestBgsStats.getBgsBestUserStats(),
				this.collectionBootstrap.initCollectionState(),
				this.duels.loadRuns(),
			]),
			this.duels.loadGlobalStats(),
		]);
		console.log('loaded info');

		const [bgsGlobalStats] = await Promise.all([this.bgsInit.init(matchStats)]);

		const patchConfig = await this.patchConfig.getConf();
		const currentBattlegroundsMetaPatch = patchConfig?.patches
			? patchConfig.patches.find(patch => patch.number === patchConfig.currentBattlegroundsMetaPatch)
			: null;
		const battlegroundsAppState = await this.bgsInit.initBattlegoundsAppState(bgsGlobalStats);
		const bgsAppStateWithStats = await this.bgsBuilder.updateStats(
			battlegroundsAppState,
			matchStats,
			bgsGlobalStats?.currentBattlegroundsMetaPatch || currentBattlegroundsMetaPatch,
		);

		const newStatsState = StatsState.create({
			gameStats: matchStats,
			bestBgsUserStats: bgsBestUserStats,
		} as StatsState);
		const decktracker = this.decktrackerStateLoader.buildState(new DecktrackerState(), newStatsState, prefs);
		const replayState: ReplaysState = this.replaysStateBuilder.buildState(
			new ReplaysState(),
			newStatsState,
			decktracker.decks,
		);

		// Update prefs to remove hidden deck codes that are not in an active deck anymore
		const allDeckCodes = newStatsState.gameStats.stats.map(match => match.playerDecklist);
		const validHiddenCodes = prefs.desktopDeckHiddenDeckCodes.filter(deckCode => allDeckCodes.includes(deckCode));
		await this.prefs.setDesktopDeckHiddenDeckCodes(validHiddenCodes);

		const newAchievementState = Object.assign(new AchievementsState(), {
			globalCategories: achievementGlobalCategories,
			achievementHistory: achievementHistory,
			isLoading: false,
		} as AchievementsState);

		const lastGameWithDuelsRunId = newStatsState.gameStats.stats.filter(match => match.currentDuelsRunId);
		const lastRunId =
			lastGameWithDuelsRunId &&
			lastGameWithDuelsRunId.length > 0 &&
			!this.isLastMatchInRun(lastGameWithDuelsRunId[0].additionalResult, lastGameWithDuelsRunId[0].result)
				? lastGameWithDuelsRunId[0].currentDuelsRunId
				: null;
		if (lastRunId) {
			console.log('setting current duels run id', lastRunId);
			await this.prefs.setDuelsRunId(lastRunId);
		}
		const duelsStats: DuelsState = this.duels.initState(duelsGlobalStats, duelsRunInfo);
		const newDuelsState = await this.duels.updateState(duelsStats, matchStats, collectionState);

		const initialWindowState = Object.assign(new MainWindowState(), {
			currentUser: currentUser,
			showFtue: !prefs.ftue.hasSeenGlobalFtue,
			replays: replayState,
			binder: collectionState,
			achievements: newAchievementState,
			decktracker: decktracker,
			battlegrounds: bgsAppStateWithStats,
			duels: newDuelsState,
			socialShareUserInfo: socialShareUserInfo,
			stats: newStatsState,
			globalStats: globalStats,
		} as MainWindowState);
		this.stateUpdater.next(new StoreInitEvent(initialWindowState));
	}

	private isLastMatchInRun(additionalResult: string, result: 'won' | 'lost' | 'tied'): boolean {
		if (!additionalResult) {
			return false;
		}
		const [wins, losses] = additionalResult.split('-').map(info => parseInt(info));
		if (wins === 11 && result === 'won') {
			console.log(
				'[store-bootstrap] last duels match was the last of the run, not forwarding run id',
				additionalResult,
				result,
			);
			return true;
		}
		if (losses === 2 && result === 'lost') {
			return false;
		}
	}

	private async initializeSocialShareUserInfo(): Promise<SocialShareUserInfo> {
		const twitter = await this.ow.getTwitterUserInfo();
		return Object.assign(new SocialShareUserInfo(), {
			twitter: twitter,
		} as SocialShareUserInfo);
	}
}
