import { GameStat } from '../stats/game-stat';

export class ReplaysState {
	readonly allReplays: readonly GameStat[];
	readonly isLoading: boolean = true;

	public update(base: ReplaysState): ReplaysState {
		return Object.assign(new ReplaysState(), this, base);
	}
}
