import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { GameStats } from '../../../../models/mainwindow/stats/game-stats';
import { StatGameFormatType } from '../../../../models/mainwindow/stats/stat-game-format.type';
import { StatGameModeType } from '../../../../models/mainwindow/stats/stat-game-mode.type';
import { Requirement } from './_requirement';

export class WinStreakReq implements Requirement {
	private currentWinStreak = 0;

	constructor(
		private readonly targetWinStreak: number,
		private readonly qualifier: string,
		private readonly gameFormat: StatGameFormatType,
		private readonly gameMode: StatGameModeType,
	) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 4) {
			console.error('invalid numebr of parameters for WinStreakReq', rawReq);
		}
		return new WinStreakReq(
			parseInt(rawReq.values[0]),
			rawReq.values[1],
			rawReq.values[2] as StatGameFormatType,
			rawReq.values[3] as StatGameModeType,
		);
	}

	reset(): void {
		this.currentWinStreak = 0;
	}

	afterAchievementCompletionReset(): void {
		this.currentWinStreak = 0;
	}

	isCompleted(): boolean {
		if (this.qualifier === 'AT_LEAST') {
			return this.currentWinStreak >= this.targetWinStreak;
		}
		return this.currentWinStreak === this.targetWinStreak;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.GAME_STATS_UPDATED) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		if (!gameEvent.additionalData || !gameEvent.additionalData.gameStats) {
			return;
		}
		const stats = (gameEvent.additionalData.gameStats as GameStats).stats;
		const standardRanked = stats
			.filter((stat) => !this.gameFormat || stat.gameFormat === this.gameFormat)
			.filter((stat) => !this.gameMode || stat.gameMode === this.gameMode);
		// The most recent event is first
		const i = standardRanked.findIndex((stat) => stat.result !== 'won');
		this.currentWinStreak = i === -1 ? standardRanked.length : i;
	}
}
