import { GroupedReplays } from './grouped-replays';
import { ReplayInfo } from './replay-info';

export class ReplaysState {
	readonly allReplays: readonly ReplayInfo[];
	readonly groupedReplays: readonly GroupedReplays[];
	readonly groupByCriteria: 'creation-date' = 'creation-date';
}
