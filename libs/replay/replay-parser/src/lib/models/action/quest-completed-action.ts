import { Map } from 'immutable';
import { ActionHelper } from '../../services/action/action-helper';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';

export class QuestCompletedAction extends Action {
	readonly originId: number;

	constructor(allCards: AllCardsService) {
		super(allCards);
	}

	public static create(newAction, allCards: AllCardsService): QuestCompletedAction {
		return Object.assign(new QuestCompletedAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): QuestCompletedAction {
		return Object.assign(this.getInstance(), this, { entities });
	}

	public enrichWithText(allEntitiesSoFar: Map<number, Entity>): QuestCompletedAction {
		const questCardId = ActionHelper.getCardId(this.entities, this.originId, allEntitiesSoFar);
		const questName = this.allCards.getCard(questCardId).name;
		const playerName = ActionHelper.getOwner(this.entities, this.originId).name;
		const textRaw = `\t${playerName} completes ${questName}!`;
		return Object.assign(this.getInstance(), this, { textRaw });
	}

	protected getInstance(): Action {
		return new QuestCompletedAction(this.allCards);
	}
}
