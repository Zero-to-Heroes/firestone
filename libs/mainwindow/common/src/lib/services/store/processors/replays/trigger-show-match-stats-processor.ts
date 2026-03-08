import { BgsPostMatchStatsPanel } from '@firestone/game-state';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { GameStatsLoaderService } from '@firestone/stats/data-access';
import { BgsPerfectGamesService } from '@firestone/battlegrounds/data-access';
import { BgsRunStatsService } from '@firestone/battlegrounds/services';
import {
	MainWindowNavigationService,
	MainWindowState,
	MatchDetail,
	NavigationReplays,
	NavigationState,
	TriggerShowMatchStatsEvent,
} from '../../store-internal';
import { Processor } from '../processor';

export class TriggerShowMatchStatsProcessor implements Processor {
	constructor(
		private readonly bgsRunStats: BgsRunStatsService,
		private readonly prefs: PreferencesService,
		private readonly i18n: ILocalizationService,
		private readonly gameStats: GameStatsLoaderService,
		private readonly perfectGames: BgsPerfectGamesService,
		private readonly mainNav: MainWindowNavigationService,
	) {}

	public async process(
		event: TriggerShowMatchStatsEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
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
				stats: undefined,
				player: undefined,
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
			currentView: 'match-details',
			selectedTab: 'match-stats',
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
