import { Injectable } from '@angular/core';
import { Action } from '../../models/action/action';
import { Game } from '../../models/game/game';
import { Turn } from '../../models/game/turn';
import { AllCardsService } from '../all-cards.service';

@Injectable({
	providedIn: 'root',
})
export class ActivePlayerParserService {
	constructor(private allCards: AllCardsService) {}

	public parseActivePlayerForLastTurn(game: Game): Game {
		let turns = game.turns;
		const numberOfTurns = turns.size;
		const turn = game.turns.get(numberOfTurns - 1);
		const enrichedTurn = this.enrichTurn(turn);
		turns = turns.set(numberOfTurns - 1, enrichedTurn);
		return Game.createGame(game, { turns } as Game);
	}

	private enrichTurn(turn: Turn): Turn {
		const newActions = [];
		for (let i = 0; i < turn.actions.length; i++) {
			const previousAction = i === 0 ? null : newActions[i - 1];
			const newAction = this.enrichAction(turn.actions[i], previousAction);
			newActions.push(newAction);
		}
		return turn.update({ actions: newActions as readonly Action[] } as Turn);
	}

	private enrichAction(action: Action, previousAction: Action): Action {
		if (action.activePlayer) {
			return action;
		} else if (previousAction && previousAction.activePlayer) {
			return action.updateAction({
				activePlayer: previousAction.activePlayer,
			} as Action);
		} else {
			return action;
		}
	}
}
