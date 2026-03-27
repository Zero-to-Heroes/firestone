import { Map } from 'immutable';
import { ActionHelper } from '../../services/action/action-helper';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';

export class TradeAction extends Action {
	constructor(allCards: AllCardsService) {
		super(allCards);
	}

	public static create(newAction, allCards: AllCardsService): TradeAction {
		return Object.assign(new TradeAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): TradeAction {
		return Object.assign(new TradeAction(this.allCards), this, {
			entities,
		});
	}

	public enrichWithText(allEntitiesSoFar: Map<number, Entity>): TradeAction {
		const playerEntity = ActionHelper.getOwner(this.entities, this.originId);
		if (!playerEntity) {
			console.warn('[card-draw-action] could not find player owner', this.originId);
			return this;
		}
		const ownerName: string = playerEntity.name;
		const drawnCard = ActionHelper.getCardId(this.entities, this.originId, allEntitiesSoFar);
		const cardName = this.allCards.getCard(drawnCard)?.name || 'Unknown Card';
		const textRaw = `\t${ownerName} trades ${cardName}`;
		return Object.assign(new TradeAction(this.allCards), this, {
			textRaw,
		});
	}

	protected getInstance(): Action {
		return new TradeAction(this.allCards);
	}
}
