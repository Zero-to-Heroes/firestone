import { CardType, GameTag } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { ActionHelper } from '../../services/action/action-helper';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';

export class CardPlayedFromHandAction extends Action {
	readonly entityId: number;

	constructor(allCards: AllCardsService) {
		super(allCards);
	}

	public static create(newAction, allCards: AllCardsService): CardPlayedFromHandAction {
		return Object.assign(new CardPlayedFromHandAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): CardPlayedFromHandAction {
		return Object.assign(new CardPlayedFromHandAction(this.allCards), this, {
			entities,
		});
	}

	public enrichWithText(allEntitiesSoFar: Map<number, Entity>): CardPlayedFromHandAction {
		const ownerName: string = ActionHelper.getOwner(this.entities, this.entityId).name;
		const cardEntity = this.entities.get(this.entityId);
		const cardId: string = ActionHelper.getCardId(this.entities, this.entityId, allEntitiesSoFar);
		const card = this.allCards.getCard(cardId);
		const cardName = card ? card.name : 'one card';
		let playVerb = 'plays';
		if (cardEntity.getTag(GameTag.CARDTYPE) === CardType.WEAPON) {
			playVerb = 'equips';
		}
		const targetText = super.generateTargetsText(allEntitiesSoFar);
		const targetTextToDisplay = targetText && targetText.length > 0 ? `\n${targetText}` : '';
		const textRaw = `\t${ownerName} ${playVerb} ${cardName}${targetTextToDisplay}`;
		// if (this.entityId === 38) {
		// 	console.warn('defile action', ownerName, cardEntity, cardId, card, cardName, targetText);
		// }
		// // console.log('enriching card played from hand action text', targetText, textRaw);
		return Object.assign(new CardPlayedFromHandAction(this.allCards), this, {
			textRaw,
		});
	}

	protected getInstance(): Action {
		return new CardPlayedFromHandAction(this.allCards);
	}
}
