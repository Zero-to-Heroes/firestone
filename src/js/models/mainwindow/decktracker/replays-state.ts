import { DeckReplayInfo } from './deck-replay-info';
import { GroupedReplays } from './grouped-replays';

export class ReplaysState {
	readonly allReplays: readonly DeckReplayInfo[];
	readonly groupedReplays: readonly GroupedReplays[];
	readonly groupByCriteria: 'creation-date' = 'creation-date';
}
