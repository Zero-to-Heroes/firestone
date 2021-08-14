import { DuelsRewardsInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-rewards-info';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { GameStat } from '../mainwindow/stats/game-stat';

export class DuelsRun {
	readonly id: string;
	readonly type: 'duels' | 'paid-duels';
	readonly initialDeckList: string;
	readonly steps: readonly (GameStat | DuelsRunInfo)[];
	readonly rewards: readonly DuelsRewardsInfo[];
	readonly creationTimestamp: number;
	readonly buildNumberAtStart: number;
	readonly heroCardId: string;
	readonly heroPowerCardId: string;
	readonly signatureTreasureCardId: string;
	readonly wins: number;
	readonly losses: number;
	readonly ratingAtStart: number;
	readonly ratingAtEnd: number;

	public static create(base: DuelsRun): DuelsRun {
		return Object.assign(new DuelsRun(), base);
	}
}
