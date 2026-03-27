import { Map } from 'immutable';
import { ActionHelper } from '../../services/action/action-helper';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';

export class SecretRevealedAction extends Action {
	readonly entityId: number;

	constructor(allCards: AllCardsService) {
		super(allCards);
	}

	public static create(newAction, allCards: AllCardsService): SecretRevealedAction {
		return Object.assign(new SecretRevealedAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): SecretRevealedAction {
		return Object.assign(new SecretRevealedAction(this.allCards), this, {
			entities,
		});
	}

	public enrichWithText(allEntitiesSoFar: Map<number, Entity>): SecretRevealedAction {
		const cardId = ActionHelper.getCardId(this.entities, this.entityId, allEntitiesSoFar);
		const cardName = this.allCards.getCard(cardId).name;
		const textRaw = `\t... which triggers ${cardName}!`;
		return Object.assign(new SecretRevealedAction(this.allCards), this, {
			textRaw,
		});
	}

	protected getInstance(): Action {
		return new SecretRevealedAction(this.allCards);
	}
}
