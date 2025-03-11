import { ArenaRewardInfo } from '@firestone-hs/api-arena-rewards';
import { DraftDeckStats } from '@firestone-hs/arena-draft-pick';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { GameStat } from '@firestone/stats/data-access';

export class ArenaRun {
	readonly id: string;
	readonly initialDeckList: string;
	readonly steps: readonly GameStat[];
	readonly rewards: readonly ArenaRewardInfo[];
	readonly draftStat: DraftDeckStats;
	readonly creationTimestamp: number;
	readonly heroCardId: string;
	// TODO: add support for hero power for dual arena
	// readonly heroPowerCardId: string;
	readonly wins: number;
	readonly losses: number;
	readonly totalCardsInDeck: number;

	public static create(base: Partial<NonFunctionProperties<ArenaRun>>): ArenaRun {
		return Object.assign(new ArenaRun(), base);
	}

	public getFirstMatch(): GameStat {
		return this.steps.filter((step) => (step as GameStat).buildNumber).map((step) => step as GameStat)[0];
	}
}
