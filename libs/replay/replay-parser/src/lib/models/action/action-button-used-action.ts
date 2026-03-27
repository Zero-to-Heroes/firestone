import { Map } from 'immutable';
import { ActionHelper } from '../../services/action/action-helper';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';

export class ActionButtonUsedAction extends Action {
	readonly entityId: number;

	constructor(allCards: AllCardsService) {
		super(allCards);
	}

	public static create(newAction, allCards: AllCardsService): ActionButtonUsedAction {
		return Object.assign(new ActionButtonUsedAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): ActionButtonUsedAction {
		return Object.assign(new ActionButtonUsedAction(this.allCards), this, {
			entities,
		});
	}

	public enrichWithText(allEntitiesSoFar: Map<number, Entity>): ActionButtonUsedAction {
		const ownerName: string = ActionHelper.getOwner(this.entities, this.entityId).name;
		const cardId: string = ActionHelper.getCardId(this.entities, this.entityId, allEntitiesSoFar);
		const card = this.allCards.getCard(cardId);
		const verb = this.buildVerb(card);
		let actionTarget = '';
		if (this.targetIds && this.targetIds.length > 0) {
			const targetCardIds = this.targetIds.map((entityId) =>
				ActionHelper.getCardId(this.entities, entityId, allEntitiesSoFar),
			);
			const cardIds = targetCardIds.map((cardId) => this.allCards.getCard(cardId));
			const targetCardNames = cardIds.some((card) => !card || !card.name)
				? `${cardIds.length} cards`
				: cardIds.map((card) => card.name).join(', ');
			actionTarget = ` on ${targetCardNames}`;
		}
		const textRaw = `\t${ownerName} ${verb} ${card.name}${actionTarget}`
			// Sugar for Battlegrounds
			.replace('uses Drag To Buy on', 'buys')
			.replace('uses Drag To Buy Spell on', 'buys')
			.replace('uses Drag To Sell on', 'sells');
		return Object.assign(new ActionButtonUsedAction(this.allCards), this, {
			textRaw,
		});
	}

	protected getInstance(): Action {
		return new ActionButtonUsedAction(this.allCards);
	}

	private buildVerb(card): string {
		// // console.log('building verb for', card, card.name && card.name.toLowerCase().indexOf('tavern tier'));
		if (!card.name) {
			return 'uses';
		}
		if (card.name.toLowerCase().indexOf('tavern tier') !== -1) {
			return 'upgrades to';
		}
		return 'uses';
	}
}
