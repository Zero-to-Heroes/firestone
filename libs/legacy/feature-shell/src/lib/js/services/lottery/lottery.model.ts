import { NonFunctionProperties } from '@firestone/shared/framework/common';

export class LotteryState {
	readonly shouldTrack: boolean = true;
	readonly lastUpdateDate: string;
	readonly resourcesUsedThisTurn: number = 0;
	readonly totalResourcesUsed: number = 0;
	readonly quilboardsPlayed: number = 0;
	readonly spellsPlayed: number = 0;

	public static create(base: Partial<NonFunctionProperties<LotteryState>>): LotteryState {
		return Object.assign(new LotteryState(), base);
	}

	public update(base: Partial<NonFunctionProperties<LotteryState>>): LotteryState {
		return Object.assign(new LotteryState(), this, base);
	}

	public currentPoints(): number {
		return Math.floor(
			(this.totalResourcesUsed + this.resourcesUsedThisTurn) / 10 + this.quilboardsPlayed + this.spellsPlayed,
		);
	}
}
