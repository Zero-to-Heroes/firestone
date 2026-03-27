import { Map } from 'immutable';
import { ActionHelper } from '../../services/action/action-helper';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';
import { HasTarget } from './has-target';

export class AttackAction extends Action implements HasTarget {
	readonly originId: number;
	readonly targetId: number;

	constructor(allCards: AllCardsService) {
		super(allCards);
	}

	public static create(newAction, allCards: AllCardsService): AttackAction {
		return Object.assign(new AttackAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): AttackAction {
		return Object.assign(new AttackAction(this.allCards), this, {
			entities,
		});
	}

	public enrichWithText(allEntitiesSoFar: Map<number, Entity>): AttackAction {
		const originCardId = ActionHelper.getCardId(this.entities, this.originId, allEntitiesSoFar);
		const targetCardId = ActionHelper.getCardId(this.entities, this.targetId, allEntitiesSoFar);
		const originCard = this.allCards.getCard(originCardId);
		const targetCard = this.allCards.getCard(targetCardId);
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
		const textRaw = `\t${originCard.name} attacks ${targetCard.name}. ${damageText}`;
		return Object.assign(new AttackAction(this.allCards), this, {
			textRaw,
		});
	}

	protected getInstance(): Action {
		return new AttackAction(this.allCards);
	}
}
