import { Map } from 'immutable';
import { ActionHelper } from '../../services/action/action-helper';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';

export class HealingAction extends Action {
	constructor(allCards: AllCardsService) {
		super(allCards);
	}

	public static create(newAction, allCards: AllCardsService): HealingAction {
		return Object.assign(new HealingAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): HealingAction {
		return Object.assign(new HealingAction(this.allCards), this, {
			entities,
		});
	}

	public enrichWithText(allEntitiesSoFar: Map<number, Entity>): HealingAction {
		const textRaw =
			'\t' +
			this.damages
				.map((amount, entityId) => {
					const entityCardId = ActionHelper.getCardId(this.entities, entityId, allEntitiesSoFar);
					const entityCard = this.allCards.getCard(entityCardId);
					return `${entityCard.name} heals for ${-amount}`;
				})
				.join(', ');
		return Object.assign(new HealingAction(this.allCards), this, {
			textRaw,
		});
	}

	protected getInstance(): Action {
		return new HealingAction(this.allCards);
	}
}
