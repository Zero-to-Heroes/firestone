import { StatContext } from '@firestone-hs/build-global-stats/dist/model/context.type';
import { GlobalStatKey } from '@firestone-hs/build-global-stats/dist/model/global-stat-key.type';
import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../../models/game-event';
import { Requirement } from '../_requirement';

export class GlobalStatReq implements Requirement {
	private isValid: boolean;

	constructor(
		private readonly targetKey: GlobalStatKey,
		private readonly targetContext: StatContext,
		private readonly targetValue: number,
	) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length !== 3) {
			console.error('invalid parameters for TotalDamageToEnemyHeroesReq', rawReq);
		}
		return new GlobalStatReq(
			rawReq.values[0] as GlobalStatKey,
			rawReq.values[1] as StatContext,
			parseInt(rawReq.values[2]),
		);
	}

	reset(): void {
		this.isValid = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.isValid = undefined;
	}

	isCompleted(): boolean {
		return this.isValid;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.GLOBAL_STATS_UPDATED) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		const stats: GlobalStats = gameEvent.additionalData.stats;
		const relevantStat = stats.stats.find(
			(stat) => stat.statContext === this.targetContext && stat.statKey === this.targetKey,
		);
		this.isValid = relevantStat && relevantStat.value >= this.targetValue;
	}
}
