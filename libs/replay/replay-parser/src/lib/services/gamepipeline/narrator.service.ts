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

	public populateActionTextForTurn(game: Game, turnIndex: number): Game {
		const turn = game.turns.get(turnIndex);
		if (!turn) {
			return game;
		}
		let allEntitiesSoFar: Map<number, Entity> = Map();
		const enrichedActions = turn.actions.map((action) => {
			try {
				allEntitiesSoFar = allEntitiesSoFar.merge(action.entities);
				return action.enrichWithText(allEntitiesSoFar);
			} catch (e) {
				console.warn('Could not enrich action with text', e, action);
				return action;
			}
		});
		const enrichedTurn = turn.update({ actions: enrichedActions });
		return Game.createGame(game, { turns: game.turns.set(turnIndex, enrichedTurn) } as Game);
	}

	public buildFullStory(game: Game): Game {
		const storyParts: string[] = [];
		for (let turnIndex = 0; turnIndex < game.turns.size; turnIndex++) {
			const turn = game.turns.get(turnIndex);
			if (!turn?.actions?.length) {
				continue;
			}
			storyParts.push(turn.actions.map((action) => action.textRaw).join('\n'));
		}
		return Game.createGame(game, { fullStoryRaw: storyParts.join('\n') } as Game);
	}

	public enrichAllActionText(game: Game): Game {
		let enrichedGame = game;
		for (let turnIndex = 0; turnIndex < enrichedGame.turns.size; turnIndex++) {
			enrichedGame = this.populateActionTextForTurn(enrichedGame, turnIndex);
		}
		return enrichedGame;
	}
}
