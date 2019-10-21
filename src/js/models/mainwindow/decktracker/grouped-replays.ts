import { DeckReplayInfo } from './deck-replay-info';

export class GroupedReplays {
	readonly header: string;
	readonly replays: readonly DeckReplayInfo[];
}
