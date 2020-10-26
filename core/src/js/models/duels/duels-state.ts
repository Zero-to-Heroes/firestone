import { DuelsCategory } from '../mainwindow/duels/duels-category';
import { DuelsRun } from './duels-run';

export class DuelsState {
	readonly loading: boolean = true;
	readonly categories: readonly DuelsCategory[];
	readonly runs: readonly DuelsRun[];

	public static create(base: DuelsState): DuelsState {
		return Object.assign(new DuelsState(), base);
	}

	public update(base: DuelsState): DuelsState {
		return Object.assign(new DuelsState(), this, base);
	}
}
