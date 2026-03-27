import { Turn } from './turn';

export class ActionTurn extends Turn {
	readonly activePlayer: number;

	public static create(base: ActionTurn): ActionTurn {
		return Object.assign(new ActionTurn(), base);
	}

	public update(newTurn): ActionTurn {
		return Object.assign(new ActionTurn(), this, newTurn);
	}
}
