import { Map } from 'immutable';
import { ActionHelper } from '../../services/action/action-helper';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';

export class MinionDeathAction extends Action {
	readonly deadMinions: readonly number[];

	constructor(allCards: AllCardsService) {
		super(allCards);
	}

	public static create(newAction, allCards: AllCardsService): MinionDeathAction {
		return Object.assign(new MinionDeathAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): MinionDeathAction {
		return Object.assign(new MinionDeathAction(this.allCards), this, {
			entities,
		});
	}

	public enrichWithText(allEntitiesSoFar: Map<number, Entity>): MinionDeathAction {
		const deadMinionNames = this.deadMinions
			.map(entityId => ActionHelper.getCardId(this.entities, entityId, allEntitiesSoFar))
			.map(cardId => this.allCards.getCard(cardId))
			.map(card => card.name)
			.join(', ');
		const textRaw = `\t${deadMinionNames} die`;
		return Object.assign(new MinionDeathAction(this.allCards), this, {
			textRaw,
		});
	}

	protected getInstance(): Action {
		return new MinionDeathAction(this.allCards);
	}
}
