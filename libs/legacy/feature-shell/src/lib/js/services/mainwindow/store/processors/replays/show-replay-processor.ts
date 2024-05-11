import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { LocalizationService } from '@services/localization.service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationReplays } from '../../../../../models/mainwindow/navigation/navigation-replays';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { MatchDetail } from '../../../../../models/mainwindow/replays/match-detail';
import { BgsPerfectGamesService } from '../../../../battlegrounds/bgs-perfect-games.service';
import { BgsRunStatsService } from '../../../../battlegrounds/bgs-run-stats.service';
import { GameStatsLoaderService } from '../../../../stats/game/game-stats-loader.service';
import { ShowReplayEvent } from '../../events/replays/show-replay-event';
import { Processor } from '../processor';

export class ShowReplayProcessor implements Processor {
	constructor(
		private readonly bgsRunStats: BgsRunStatsService,
		private readonly i18n: LocalizationService,
		private readonly gameStats: GameStatsLoaderService,
		private readonly perfectGames: BgsPerfectGamesService,
		private readonly mainNav: MainWindowNavigationService,
	) {}

	public async process(
		event: ShowReplayEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const gameStats = await this.gameStats.gameStats$$.getValueWithInit();
		const selectedInfo =
			gameStats?.stats?.find((replay) => replay.reviewId === event.reviewId) ??
			(await this.perfectGames.perfectGames$$.getValueWithInit())?.find(
				(replay) => replay.reviewId === event.reviewId,
			);
		if (!selectedInfo) {
			console.warn('Could not find selected info for replay', event.reviewId);
			return [currentState, navigationState];
		}

		// Figure out if we have already loaded the stats, or if we need a refresh
		if (navigationState.navigationReplays.selectedReplay?.replayInfo?.reviewId === event.reviewId) {
			this.mainNav.text$$.next(
				new Date(selectedInfo.creationTimestamp).toLocaleDateString(this.i18n.formatCurrentLocale(), {
					month: 'short',
					day: '2-digit',
					year: 'numeric',
				}),
			);
			return [
				null,
				navigationState.update({
					navigationReplays: navigationState.navigationReplays.update({
						currentView: 'match-details',
						selectedTab: 'replay',
					} as NavigationReplays),
				} as NavigationState),
			];
		}

		if (
			selectedInfo.gameMode === 'battlegrounds' ||
			selectedInfo.gameMode === 'battlegrounds-friendly' ||
			selectedInfo.gameMode === 'battlegrounds-duo'
		) {
			this.bgsRunStats.retrieveReviewPostMatchStats(event.reviewId);
		}

		const matchDetail = Object.assign(new MatchDetail(), {
			replayInfo: selectedInfo,
		} as MatchDetail);
		const newReplays = navigationState.navigationReplays.update({
			currentView: 'match-details',
			selectedTab: 'replay',
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
		return [
			null,
			navigationState.update({
				currentApp: 'replays',
				navigationReplays: newReplays,
			} as NavigationState),
		];
	}
}
