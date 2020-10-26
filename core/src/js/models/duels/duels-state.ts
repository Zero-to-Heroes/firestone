import { DuelsRun } from './duels-run';

export class DuelsState {
	readonly runs: readonly DuelsRun[];

	public static create(base: DuelsState): DuelsState {
		return Object.assign(new DuelsState(), base);
	}
}
