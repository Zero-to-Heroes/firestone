import { Injectable } from '@angular/core';
import { Map } from 'immutable';
import { Entity } from '../../models/game/entity';
import { Game } from '../../models/game/game';

@Injectable({
	providedIn: 'root',
})
export class NarratorService {
	constructor() {}

	public populateActionTextForLastTurn(game: Game) {
		let turnsWithActions = game.turns;
		const numberOfTurns = turnsWithActions.size;
		// // // console.log('getting turn', i, game.turns.toJS());
		const turn = game.turns.get(numberOfTurns - 1);
		let allEntitiesSoFar: Map<number, Entity> = Map();
		const enrichedActions = turn.actions.map(action => {
			try {
				allEntitiesSoFar = allEntitiesSoFar.merge(action.entities);
				return action.enrichWithText(allEntitiesSoFar);
			} catch (e) {
				console.warn('Could not enrich action with text', e, action);
				return action;
			}
		});
		const enrichedTurn = turn.update({ actions: enrichedActions });
		turnsWithActions = turnsWithActions.set(numberOfTurns - 1, enrichedTurn);
		return Game.createGame(game, { turns: turnsWithActions } as Game);
	}

	public createGameStoryForLastTurn(game: Game): Game {
		const allActionsInLastTurn = game.turns.last().actions;
		const fullStoryRawForLastTurn: string = allActionsInLastTurn.map(action => action.textRaw).join('\n');
		// // // console.log('[narrator] full story', fullStoryRaw);
		return Game.createGame(game, { fullStoryRaw: game.fullStoryRaw + '\n' + fullStoryRawForLastTurn } as Game);
	}
}
