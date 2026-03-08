import { defaultStartingHp, GameType } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsBoard, BgsPlayer, BgsPostMatchStatsPanel } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameStatsLoaderService } from '@firestone/stats/data-access';
import { BgsPerfectGamesService } from '@firestone/battlegrounds/data-access';
import {
	MainWindowNavigationService,
	MainWindowState,
	MatchDetail,
	NavigationReplays,
	NavigationState,
	ShowMatchStatsEvent,
} from '../../store-internal';
import { Processor } from '../processor';

export class ShowMatchStatsProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly gameStats: GameStatsLoaderService,
		private readonly perfectGames: BgsPerfectGamesService,
		private readonly mainNav: MainWindowNavigationService,
	) {}

	public async process(
		event: ShowMatchStatsEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const matchStats = event.stats;
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

		const playerCardId = selectedInfo.playerCardId;
		const mappedBoardInfo = matchStats
			? matchStats.boardHistory.map(
					(history) =>
						({
							turn: history.turn,
							board: history.board.map((value) => Entity.create(value as Entity)),
						}) as BgsBoard,
				)
			: [];

		const matchDetail = Object.assign(new MatchDetail(), {
			replayInfo: selectedInfo,
			bgsPostMatchStatsPanel: BgsPostMatchStatsPanel.create({
				name: this.i18n.translateString('battlegrounds.menu.live-stats'),
				stats: matchStats,
				// globalStats: currentState.battlegrounds.globalStats,
				player: matchStats
					? BgsPlayer.create({
							cardId: playerCardId,
							displayedCardId: playerCardId,
							tavernUpgradeHistory: matchStats?.tavernTimings || [],
							boardHistory: mappedBoardInfo as readonly BgsBoard[],
							highestWinStreak: matchStats?.highestWinStreak,
							initialHealth: defaultStartingHp(GameType.GT_BATTLEGROUNDS, playerCardId, this.allCards),
							// questRewards: matchStats.qu TODO: implement this
						} as BgsPlayer)
					: undefined,
				tabs: [
					'hp-by-turn',
					'winrate-per-turn',
					'warband-total-stats-by-turn',
					'warband-composition-by-turn',
					'battles',
				],
				availableTribes: selectedInfo.bgsAvailableTribes,
				anomalies: selectedInfo.bgsAnomalies,
			}),
		} as MatchDetail);
		const newReplays = navigationState.navigationReplays.update({
			selectedReplay: matchDetail,
		} as NavigationReplays);
		this.mainNav.text$$.next(
			new Date(selectedInfo.creationTimestamp).toLocaleDateString(this.i18n.formatCurrentLocale(), {
				month: 'short',
				day: '2-digit',
				year: 'numeric',
			}),
		);
		this.mainNav.image$$.next(null);
		this.mainNav.isVisible$$.next(true);
		this.mainNav.currentApp$$.next('replays');
		return [
			null,
			navigationState.update({
				navigationReplays: newReplays,
			} as NavigationState),
		];
	}
}
