import { Action } from '../action/action';

export abstract class Turn {
	readonly turn: string;
	readonly timestamp: number;
	readonly index: number;
	readonly actions: readonly Action[];

	abstract update(newTurn): Turn;
}
