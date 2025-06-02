import { ArenaRewardInfo } from '@firestone-hs/api-arena-rewards';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { GameStat } from '@firestone/stats/data-access';
import { ExtendedDraftDeckStats } from './arena-draft';

export class ArenaRun {
	readonly id: string;
	readonly gameMode: 'arena' | 'arena-underground';
	readonly initialDeckList: string;
	readonly steps: readonly GameStat[];
	readonly rewards: readonly ArenaRewardInfo[];
	readonly draftStat: ExtendedDraftDeckStats;
	// TODO: add support for cards added / removed during the run
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
