import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { GameStats } from '../../../../models/mainwindow/stats/game-stats';
import { Requirement } from './_requirement';

export class WinStreakReq implements Requirement {
	private currentWinStreak: number = 0;

	constructor(private readonly targetWinStreak: number, private readonly qualifier: string) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 2) {
			console.error('invalid parameters for WinStreakReq', rawReq);
		}
		return new WinStreakReq(parseInt(rawReq.values[0]), rawReq.values[1]);
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
		const stats = (gameEvent.additionalData.gameStats as GameStats).stats;
		const standardRanked = stats.filter(stat => stat.gameFormat === 'standard').filter(stat => stat.gameMode === 'ranked');
		// The most recent event is first
		const i = standardRanked.findIndex(stat => stat.result !== 'won');
		this.currentWinStreak = i === -1 ? standardRanked.length : i;
		console.debug('received stats', standardRanked, i, this.currentWinStreak);
	}
}
