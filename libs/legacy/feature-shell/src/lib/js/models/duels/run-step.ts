import { GameStat } from '@firestone/stats/data-access';

export interface RunStep extends GameStat {
	readonly treasureCardId: string;
	readonly lootCardIds: readonly string[];
}
