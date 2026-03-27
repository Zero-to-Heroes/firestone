import { Injectable } from '@angular/core';
import { Action } from '../../models/action/action';
import { HasTarget } from '../../models/action/has-target';
import { HasTargets } from '../../models/action/has-targets';
import { Game } from '../../models/game/game';
import { Turn } from '../../models/game/turn';
import { AllCardsService } from '../all-cards.service';

@Injectable({
	providedIn: 'root',
})
export class TargetsParserService {
	constructor(private allCards: AllCardsService) {}

	public parseTargetsForLastTurn(game: Game): Game {
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
		if (this.hasTarget(action)) {
			const targetPair: readonly [number, number][] = [[action.originId, action.targetId]];
			return action.updateAction({ targets: targetPair } as Action);
		} else if (this.hasTargets(action)) {
			const targetPairs = action.targetIds.map(
				targetId => [action.originId, targetId] as [number, number],
			) as readonly [number, number][];
			return action.updateAction({ targets: targetPairs } as Action);
		}
		return action;
	}

	private hasTarget(action: any): action is HasTarget {
		return 'originId' in action && 'targetId' in action && action.originId && action.targetId;
	}

	private hasTargets(action: any): action is HasTargets {
		return 'originId' in action && 'targetIds' in action && action.originId && action.targetIds;
	}
}
