import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { GameStat } from '../../../../../models/mainwindow/stats/game-stat';
import { GameStats } from '../../../../../models/mainwindow/stats/game-stats';
import { MatchStats } from '../../../../../models/mainwindow/stats/match-stats';
import { StatsState } from '../../../../../models/mainwindow/stats/stats-state';
import { OwNotificationsService } from '../../../../notifications.service';
import { MatchStatsAvailableEvent } from '../../events/stats/match-stats-available-event';
import { ShowMatchStatsEvent } from '../../events/stats/show-match-stats-event';
import { Processor } from '../processor';

export class MatchStatsAvailableProcessor implements Processor {
	constructor(private readonly notifs: OwNotificationsService) {
		// setTimeout(() => this.sendNotification({ reviewId: 'hop' } as MatchStats), 1000);
	}

	public async process(event: MatchStatsAvailableEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const newStats: readonly GameStat[] = this.updateStats(currentState.stats.gameStats.stats, event.stats);
		const newGameStats: GameStats = Object.assign(new GameStats(), currentState.stats.gameStats, {
			stats: newStats,
		} as GameStats);
		const newStatsState: StatsState = Object.assign(new StatsState(), currentState.stats, {
			gameStats: newGameStats,
		} as StatsState);
		// Also send a notification
		// TODO: only do so if prefs say so
		// this.sendNotification(event.stats);
		console.log('[match-stats-available-processor] sending new state');
		return Object.assign(new MainWindowState(), currentState, {
			stats: newStatsState,
		} as MainWindowState);
	}

	private updateStats(gameStats: readonly GameStat[], matchStats: MatchStats): readonly GameStat[] {
		return gameStats.map(gameStat => this.updateStat(gameStat, matchStats));
	}

	private updateStat(gameStat: GameStat, matchStats: MatchStats): GameStat {
		if (!matchStats || !gameStat) {
			return gameStat;
		}
		// The only case this happens is when
		if (!gameStat.reviewId || gameStat.reviewId === matchStats.reviewId) {
			return this.updateGameStat(gameStat, matchStats);
		}
		return gameStat;
	}

	private updateGameStat(gameStat: GameStat, matchStats: MatchStats): GameStat {
		console.log('[match-stats-available-processor] enriching gameStat with matchStat', gameStat, matchStats);
		return Object.assign(new GameStat(), gameStat, {
			reviewId: matchStats.reviewId,
			matchStat: matchStats,
		} as GameStat);
	}

	private sendNotification(stats: MatchStats) {
		console.log('[match-stats-available-processor] showing notif', stats);
		const content = `
			<div class="decktracker-message-container">
				<div class="message">
					<div class="title">
						<span>Game replay saved!</span>
					</div>
					<div class="recap-text">
						<span>Click to watch it</span>
					</div>
				</div>
				<button class="i-30 close-button">
					<svg class="svg-icon-fill">
						<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="/Files/assets/svg/sprite.svg#window-control_close"></use>
					</svg>
				</button>
			</div>`;
		this.notifs.emitNewNotification({
			notificationId: `game-replay-saved-${stats.reviewId}`,
			content: content,
			type: 'game-replay-saved',
			app: 'decktracker',
			timeout: 10000,
			eventToSendOnClick: () => new ShowMatchStatsEvent(stats.reviewId),
		});
	}
}
