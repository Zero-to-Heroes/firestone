import { defaultStartingHp, GameType } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { BgsBoard, BgsPlayer, BgsPostMatchStatsPanel } from '@firestone/game-state';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationService } from '@services/localization.service';

import { GameStatsLoaderService } from '@firestone/stats/data-access';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationReplays } from '../../../../../models/mainwindow/navigation/navigation-replays';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { MatchDetail } from '../../../../../models/mainwindow/replays/match-detail';
import { BgsPerfectGamesService } from '../../../../battlegrounds/bgs-perfect-games.service';
import { ShowMatchStatsEvent } from '../../events/replays/show-match-stats-event';
import { Processor } from '../processor';

export class ShowMatchStatsProcessor implements Processor {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly gameStats: GameStatsLoaderService,
		private readonly perfectGames: BgsPerfectGamesService,
		private readonly mainNav: MainWindowNavigationService,
	) {}

	public async process(
		event: ShowMatchStatsEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
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
							board: history.board.map((value) => Entity.fromJS(value as any)),
						} as BgsBoard),
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
					: null,
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
