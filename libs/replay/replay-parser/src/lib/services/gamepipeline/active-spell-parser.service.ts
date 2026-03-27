import { Injectable } from '@angular/core';
import { CardType, GameTag } from '@firestone-hs/reference-data';
import { Action } from '../../models/action/action';
import { AttachingEnchantmentAction } from '../../models/action/attaching-enchantment-action';
import { CardDrawAction } from '../../models/action/card-draw-action';
import { CardPlayedFromHandAction } from '../../models/action/card-played-from-hand-action';
import { CardTargetAction } from '../../models/action/card-target-action';
import { DamageAction } from '../../models/action/damage-action';
import { HealingAction } from '../../models/action/healing-action';
import { PowerTargetAction } from '../../models/action/power-target-action';
import { SecretRevealedAction } from '../../models/action/secret-revealed-action';
import { StartTurnAction } from '../../models/action/start-turn-action';
import { SummonAction } from '../../models/action/summon-action';
import { Game } from '../../models/game/game';
import { Turn } from '../../models/game/turn';
import { AllCardsService } from '../all-cards.service';

@Injectable({
	providedIn: 'root',
})
export class ActiveSpellParserService {
	private readonly ACTIONS_THAT_RESET_ACTIVE_SPELL = [typeof StartTurnAction];

	constructor(private allCards: AllCardsService) {}

	public parseActiveSpellForLastTurn(game: Game): Game {
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
		// Don't set any active spell for these actions
		if (this.ACTIONS_THAT_RESET_ACTIVE_SPELL.indexOf(typeof action) !== -1) {
			return action;
		}

		// By default, don't show any active spell
		let activeSpell;
		if (
			action instanceof CardPlayedFromHandAction &&
			action.entities.get(action.entityId)
			//&& action.entities.get(action.entityId).getTag(GameTag.CARDTYPE) === CardType.SPELL
		) {
			activeSpell = action.entityId;
		} else if (
			action instanceof PowerTargetAction &&
			action.entities.get(action.originId) &&
			action.entities.get(action.originId).getTag(GameTag.CARDTYPE) === CardType.SPELL
		) {
			activeSpell = action.originId;
		} else if (
			action instanceof AttachingEnchantmentAction &&
			action.entities.get(action.originId) &&
			action.entities.get(action.originId).getTag(GameTag.CARDTYPE) === CardType.SPELL
		) {
			activeSpell = action.originId;
		} else if (
			action instanceof CardTargetAction &&
			action.entities.get(action.originId) &&
			action.entities.get(action.originId).getTag(GameTag.CARDTYPE) === CardType.SPELL
		) {
			activeSpell = action.originId;
		} else if (
			action instanceof SummonAction &&
			action.entities.get(action.originId) &&
			action.entities.get(action.originId).getTag(GameTag.CARDTYPE) === CardType.SPELL
		) {
			activeSpell = action.originId;
		} else if (
			action instanceof SecretRevealedAction &&
			action.entities.get(action.entityId) &&
			action.entities.get(action.entityId).getTag(GameTag.CARDTYPE) === CardType.SPELL
		) {
			activeSpell = action.entityId;
		} else if (action instanceof AttachingEnchantmentAction && previousAction && previousAction.activeSpell) {
			activeSpell = previousAction.activeSpell;
		} else if (action instanceof CardDrawAction && previousAction && previousAction.activeSpell) {
			activeSpell = previousAction.activeSpell;
		} else if (action instanceof DamageAction && previousAction && previousAction.activeSpell) {
			activeSpell = previousAction.activeSpell;
		} else if (action instanceof HealingAction && previousAction && previousAction.activeSpell) {
			activeSpell = previousAction.activeSpell;
		} else if (action instanceof PowerTargetAction && previousAction && previousAction.activeSpell) {
			activeSpell = previousAction.activeSpell;
		}

		if (activeSpell) {
			// // // console.log('Updating active spell', activeSpell);
			return action.updateAction({ activeSpell } as Action);
		}
		return action;
	}
}
