import { Map } from 'immutable';
import { ActionHelper } from '../../services/action/action-helper';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';

export class SummonAction extends Action {
	readonly entityIds: readonly number[];

	constructor(allCards: AllCardsService) {
		super(allCards);
	}

	public static create(newAction, allCards: AllCardsService): SummonAction {
		return Object.assign(new SummonAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): SummonAction {
		return Object.assign(new SummonAction(this.allCards), this, {
			entities,
		});
	}

	public enrichWithText(allEntitiesSoFar: Map<number, Entity>): SummonAction {
		const originCardId = ActionHelper.getCardId(this.entities, this.originId, allEntitiesSoFar);
		// // console.log('enriching summon', this.originId, originCardId);
		const originCardName = this.allCards.getCard(originCardId).name;
		const summonCardNames = this.entityIds
			.map(entityId => ActionHelper.getCardId(this.entities, entityId, allEntitiesSoFar))
			.map(cardId => this.allCards.getCard(cardId).name)
			.join(', ');
		const textRaw = `\t${originCardName} summons ${summonCardNames}`;
		return Object.assign(new SummonAction(this.allCards), this, {
			textRaw,
		});
	}

	protected getInstance(): Action {
		return new SummonAction(this.allCards);
	}
}
