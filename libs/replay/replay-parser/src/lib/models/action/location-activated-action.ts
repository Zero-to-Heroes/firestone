import { Map } from 'immutable';
import { ActionHelper } from '../../services/action/action-helper';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';

export class LocationActivatedAction extends Action {
	constructor(allCards: AllCardsService) {
		super(allCards);
	}

	public static create(newAction, allCards: AllCardsService): LocationActivatedAction {
		return Object.assign(new LocationActivatedAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): LocationActivatedAction {
		return Object.assign(new LocationActivatedAction(this.allCards), this, {
			entities,
		});
	}

	public enrichWithText(allEntitiesSoFar: Map<number, Entity>): LocationActivatedAction {
		const playerEntity = ActionHelper.getOwner(this.entities, this.originId);
		if (!playerEntity) {
			return this;
		}
		const ownerName: string = playerEntity.name;
		const drawnCard = ActionHelper.getCardId(this.entities, this.originId, allEntitiesSoFar);
		const cardName = this.allCards.getCard(drawnCard)?.name || 'Unknown Card';
		const textRaw = `\t${ownerName} activates ${cardName}`;
		return Object.assign(new LocationActivatedAction(this.allCards), this, {
			textRaw,
		});
	}

	protected getInstance(): Action {
		return new LocationActivatedAction(this.allCards);
	}
}
