import { Entity } from '@firestone-hs/replay-parser';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BgsPlayer } from '../../../../../models/battlegrounds/bgs-player';
import { BgsBoard } from '../../../../../models/battlegrounds/in-game/bgs-board';
import { BgsPostMatchStatsPanel } from '../../../../../models/battlegrounds/post-match/bgs-post-match-stats-panel';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationReplays } from '../../../../../models/mainwindow/navigation/navigation-replays';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { MatchDetail } from '../../../../../models/mainwindow/replays/match-detail';
import { PreferencesService } from '../../../../preferences.service';
import { ShowMatchStatsEvent } from '../../events/replays/show-match-stats-event';
import { Processor } from '../processor';

export class ShowMatchStatsProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService, private readonly i18n: LocalizationFacadeService) {}

	public async process(
		event: ShowMatchStatsEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const matchStats = event.stats;
		const selectedInfo = currentState.findReplay(event.reviewId);
		const playerCardId = selectedInfo.playerCardId;
		const mappedBoardInfo = matchStats
			? matchStats.boardHistory.map(
					(history) =>
						({
							turn: history.turn,
							board: history.board.map((value) => Entity.fromJS(value as any)),
						} as BgsBoard),
			  )
			: [];

		const matchDetail = Object.assign(new MatchDetail(), {
			replayInfo: selectedInfo,
			bgsPostMatchStatsPanel: BgsPostMatchStatsPanel.create({
				name: this.i18n.translateString('battlegrounds.menu.live-stats'),
				stats: matchStats,
				globalStats: currentState.battlegrounds.globalStats,
				player: matchStats
					? BgsPlayer.create({
							cardId: playerCardId,
							displayedCardId: playerCardId,
							tavernUpgradeHistory: matchStats?.tavernTimings || [],
							boardHistory: mappedBoardInfo as readonly BgsBoard[],
							highestWinStreak: matchStats.highestWinStreak,
					  } as BgsPlayer)
					: null,
				selectedStats: null, // We use the navigation-level info, to avoid
				tabs: [
					'hp-by-turn',
					'winrate-per-turn',
					'warband-total-stats-by-turn',
					'warband-composition-by-turn',
					'battles',
				],
				numberOfDisplayedTabs: (await this.prefs.getPreferences()).bgsNumberOfDisplayedTabs,
				availableTribes: selectedInfo.bgsAvailableTribes,
			} as BgsPostMatchStatsPanel),
		} as MatchDetail);
		const newReplays = navigationState.navigationReplays.update({
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
