import { Map } from 'immutable';
import { ActionHelper } from '../../services/action/action-helper';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';
import { HasTargets } from './has-targets';

export class PowerTargetAction extends Action implements HasTargets {
	readonly originId: number;

	constructor(allCards: AllCardsService) {
		super(allCards);
	}

	public static create(newAction, allCards: AllCardsService): PowerTargetAction {
		return Object.assign(new PowerTargetAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): PowerTargetAction {
		return Object.assign(new PowerTargetAction(this.allCards), this, { entities });
	}

	public enrichWithText(allEntitiesSoFar: Map<number, Entity>): PowerTargetAction {
		const originCardId = ActionHelper.getCardId(this.entities, this.originId, allEntitiesSoFar);
		const targetCardIds = this.targetIds.map(entityId =>
			ActionHelper.getCardId(this.entities, entityId, allEntitiesSoFar),
		);
		const originCardName = this.allCards.getCard(originCardId).name;
		const cardIds = targetCardIds.map(cardId => this.allCards.getCard(cardId));
		const targetCardNames = cardIds.some(card => !card || !card.name)
			? `${cardIds.length} cards`
			: cardIds.map(card => card.name).join(', ');
		let damageText = '';
		if (this.damages) {
			damageText = this.damages
				.map((amount, entityId) => {
					const entityCardId = ActionHelper.getCardId(this.entities, entityId, allEntitiesSoFar);
					const entityCard = this.allCards.getCard(entityCardId);
					return `${entityCard.name} takes ${amount} damage`;
				})
				.join(', ');
		}
		const textRaw = `\t${originCardName} targets ${targetCardNames}. ${damageText}`;
		return Object.assign(new PowerTargetAction(this.allCards), this, { textRaw });
	}

	protected getInstance(): Action {
		return new PowerTargetAction(this.allCards);
	}
}
