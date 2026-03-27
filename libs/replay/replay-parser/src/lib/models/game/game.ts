import { Map } from 'immutable';
import { Entity } from './entity';
import { PlayerEntity } from './player-entity';
import { Turn } from './turn';

export class Game {
	readonly players: readonly PlayerEntity[] = [];
	readonly turns: Map<number, Turn> = Map<number, Turn>();
	readonly fullStoryRaw: string;
	readonly buildNumber: number;
	readonly gameType: number;
	readonly formatType: number;
	readonly scenarioID: number;

	readonly entitiesBeforeMulligan: Map<number, Entity> = Map();

	private constructor() {}

	public static createGame(baseGame: Game, newAttributes?: any): Game {
		return Object.assign(new Game(), baseGame, newAttributes);
	}

	public update(base: Game): Game {
		return Object.assign(new Game(), this, base);
	}

	public getLatestParsedState(): Map<number, Entity> {
		if (this.turns.size === 0 || this.turns.last().actions.length === 0) {
			return this.entitiesBeforeMulligan;
		}
		const lastTurn = this.turns.get(this.turns.size - 1);
		// // console.log('last turn', lastTurn, this.turns.toJS());
		return lastTurn.actions[lastTurn.actions.length - 1].entities;
	}
}
