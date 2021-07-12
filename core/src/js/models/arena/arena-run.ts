import { ArenaRewardInfo } from '@firestone-hs/api-arena-rewards';
import { GameStat } from '../mainwindow/stats/game-stat';

export class ArenaRun {
	readonly id: string;
	readonly initialDeckList: string;
	readonly steps: readonly GameStat[];
	readonly rewards: readonly ArenaRewardInfo[];
	readonly creationTimestamp: number;
	readonly heroCardId: string;
	// TODO: add support for hero power for dual arena
	// readonly heroPowerCardId: string;
	readonly wins: number;
	readonly losses: number;

	public static create(base: ArenaRun): ArenaRun {
		return Object.assign(new ArenaRun(), base);
	}

	public getFirstMatch(): GameStat {
		return this.steps.filter((step) => (step as GameStat).buildNumber).map((step) => step as GameStat)[0];
	}
}
