import { GameStat } from '@firestone/stats/data-access';

export class GroupedReplays {
	readonly header: string;
	readonly replays: readonly GameStat[];
}
