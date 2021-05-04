import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { GameStats } from '../../../../models/mainwindow/stats/game-stats';
import { Requirement } from './_requirement';

export class WinAgsinstClassInRankedStandardInLimitedTimeReq implements Requirement {
	private currentWinsAgainstClass = 0;

	constructor(
		private readonly targetVictories: number,
		private readonly qualifier: string,
		private readonly opponentClass: string,
		private readonly periodOfTimeInHours: number,
	) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 4) {
			console.error('invalid parameters for WinAgsinstClassInRankedStandardInLimitedTimeReq', rawReq);
		}
		return new WinAgsinstClassInRankedStandardInLimitedTimeReq(
			parseInt(rawReq.values[0]),
			rawReq.values[1],
			rawReq.values[2],
			parseInt(rawReq.values[3]),
		);
	}

	reset(): void {
		this.currentWinsAgainstClass = 0;
	}

	afterAchievementCompletionReset(): void {
		this.currentWinsAgainstClass = 0;
	}

	isCompleted(): boolean {
		if (this.qualifier === 'AT_LEAST') {
			return this.currentWinsAgainstClass >= this.targetVictories;
		}
		return this.currentWinsAgainstClass === this.targetVictories;
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
		// Add a bit of slack
		const referenceDate = Date.now() - (this.periodOfTimeInHours + 0.5) * 60 * 60 * 1000;
		const filtered = stats
			.filter((stat) => stat.gameFormat === 'standard')
			.filter((stat) => stat.gameMode === 'ranked')
			.filter((stat) => stat.creationTimestamp > referenceDate)
			.filter((stat) => stat.opponentClass === this.opponentClass)
			.filter((stat) => stat.result === 'won');
		this.currentWinsAgainstClass = filtered.length;
	}
}
