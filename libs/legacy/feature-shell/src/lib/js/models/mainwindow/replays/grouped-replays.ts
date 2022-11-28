import { GameStat } from '../stats/game-stat';

export class GroupedReplays {
	readonly header: string;
	readonly replays: readonly GameStat[];
}
