import { Injectable } from '@angular/core';
import { PlayState } from '@firestone-hs/reference-data';
import { Action } from '../../models/action/action';
import { EndGameAction } from '../../models/action/end-game-action';
import { Game } from '../../models/game/game';
import { Turn } from '../../models/game/turn';
import { AllCardsService } from '../all-cards.service';

@Injectable({
	providedIn: 'root',
})
export class EndGameParserService {
	constructor(private allCards: AllCardsService) {}

	public parseEndGame(game: Game): Game {
		let turns = game.turns;
		const lastTurn = turns.get(turns.size - 1);
		const enrichedLastTurn = this.enrichTurn(lastTurn);
		// // console.log('previous', turns.get(turns.size - 2));
		turns = turns.set(turns.size - 1, enrichedLastTurn);
		return Game.createGame(game, { turns } as Game);
	}

	private enrichTurn(turn: Turn): Turn {
		const newActions = [];
		for (let i = 0; i < turn.actions.length - 1; i++) {
			newActions.push(turn.actions[i]);
		}
		if (!turn.actions[turn.actions.length - 1]) {
			console.warn('missing last action' + turn.actions[turn.actions.length - 1], turn);
			return turn;
		}

		if (!(turn.actions[turn.actions.length - 1] instanceof EndGameAction)) {
			// // console.log('last action is not an endgame, returning');
			return turn;
		}
		const newEndGame = this.enrichAction(turn.actions[turn.actions.length - 1] as EndGameAction);
		newActions.push(newEndGame);
		return turn.update({ actions: newActions as readonly Action[] } as Turn);
	}

	private enrichAction(action: EndGameAction): EndGameAction {
		const status: PlayState = action.winStatus.filter(st => st[0] === action.entityId).map(st => st[1])[0];
		return action.updateAction<EndGameAction>({
			isEndGame: true,
			endGameStatus: status,
		} as EndGameAction);
	}
}
