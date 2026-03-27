import { Map } from 'immutable';
import { ActionHelper } from '../../services/action/action-helper';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';
export class DiscoveryPickAction extends Action {
	readonly owner: number;
	readonly choice: number;

	constructor(allCards: AllCardsService) {
		super(allCards);
	}

	public static create(newAction, allCards: AllCardsService): DiscoveryPickAction {
		return Object.assign(new DiscoveryPickAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): DiscoveryPickAction {
		return Object.assign(new DiscoveryPickAction(this.allCards), this, {
			entities,
		});
	}

	public enrichWithText(allEntitiesSoFar: Map<number, Entity>): DiscoveryPickAction {
		const ownerEntity = ActionHelper.getOwner(this.entities, this.owner);
		const choiceCardId = ActionHelper.getCardId(this.entities, this.choice, allEntitiesSoFar);
		let chosenCardText = 'one card';
		if (choiceCardId) {
			chosenCardText = this.allCards.getCard(choiceCardId).name;
		}
		const textRaw = `\t${ownerEntity.name} picks ${chosenCardText}`;
		return Object.assign(new DiscoveryPickAction(this.allCards), this, {
			textRaw,
		});
	}

	protected getInstance(): Action {
		return new DiscoveryPickAction(this.allCards);
	}
}
