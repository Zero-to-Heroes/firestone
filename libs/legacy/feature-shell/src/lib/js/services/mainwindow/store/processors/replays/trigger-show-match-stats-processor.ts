import { LocalizationService } from '@services/localization.service';
import { BgsPostMatchStatsPanel } from '../../../../../models/battlegrounds/post-match/bgs-post-match-stats-panel';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationReplays } from '../../../../../models/mainwindow/navigation/navigation-replays';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { MatchDetail } from '../../../../../models/mainwindow/replays/match-detail';
import { Preferences } from '../../../../../models/preferences';
import { BgsPerfectGamesService } from '../../../../battlegrounds/bgs-perfect-games.service';
import { BgsRunStatsService } from '../../../../battlegrounds/bgs-run-stats.service';
import { PreferencesService } from '../../../../preferences.service';
import { GameStatsLoaderService } from '../../../../stats/game/game-stats-loader.service';
import { TriggerShowMatchStatsEvent } from '../../events/replays/trigger-show-match-stats-event';
import { Processor } from '../processor';

export class TriggerShowMatchStatsProcessor implements Processor {
	constructor(
		private readonly bgsRunStats: BgsRunStatsService,
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationService,
		private readonly gameStats: GameStatsLoaderService,
		private readonly perfectGames: BgsPerfectGamesService,
	) {}

	public async process(
		event: TriggerShowMatchStatsEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		// Figure out if we have already loaded the stats, or if we need a refresh
		if (navigationState.navigationReplays.selectedReplay?.replayInfo?.reviewId === event.reviewId) {
			return [
				null,
				navigationState.update({
					navigationReplays: navigationState.navigationReplays.update({
						currentView: 'match-details',
						selectedTab: 'match-stats',
					} as NavigationReplays),
				} as NavigationState),
			];
		}

		const prefs: Preferences = await this.prefs.getPreferences();
		this.bgsRunStats.retrieveReviewPostMatchStats(event.reviewId);
		const selectedInfo =
			(await this.gameStats.gameStats$$.getValueWithInit())?.stats?.find(
				(replay) => replay.reviewId === event.reviewId,
			) ??
			(await this.perfectGames.perfectGames$$.getValueWithInit())?.find(
				(replay) => replay.reviewId === event.reviewId,
			);
		if (!selectedInfo) {
			console.error('Could not find selected info for replay', event.reviewId);
			return [null, null];
		}
		const matchDetail = Object.assign(new MatchDetail(), {
			replayInfo: selectedInfo,
			bgsPostMatchStatsPanel: BgsPostMatchStatsPanel.create({
				name: this.i18n.translateString('battlegrounds.menu.live-stats'),
				stats: null,
				// globalStats: currentState.battlegrounds.globalStats,
				player: null,
				// isComputing: true,
				selectedStats: null, // We use the navigation-level info, to avoid
				tabs: [
					'hp-by-turn',
					'winrate-per-turn',
					'warband-total-stats-by-turn',
					'warband-composition-by-turn',
					'battles',
				],
				numberOfDisplayedTabs: prefs.bgsNumberOfDisplayedTabs,
				availableTribes: selectedInfo.bgsAvailableTribes,
				anomalies: selectedInfo.bgsAnomalies,
			} as BgsPostMatchStatsPanel),
		} as MatchDetail);
		const newReplays = navigationState.navigationReplays.update({
			currentView: 'match-details',
			selectedTab: 'match-stats',
			selectedStatsTabs: prefs.bgsSelectedTabs2,
			selectedReplay: matchDetail,
		} as NavigationReplays);
		return [
			null,
			navigationState.update({
				isVisible: true,
				currentApp: 'replays',
				navigationReplays: newReplays,
				text: new Date(selectedInfo.creationTimestamp).toLocaleDateString(this.i18n.formatCurrentLocale(), {
					month: 'short',
					day: '2-digit',
					year: 'numeric',
				}),
				image: null,
			} as NavigationState),
		];
	}
}
