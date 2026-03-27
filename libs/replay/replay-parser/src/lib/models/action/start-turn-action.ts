import { Map } from 'immutable';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';

export class StartTurnAction extends Action {
	readonly turn: number;
	readonly isStartOfMulligan: boolean;

	constructor(allCards: AllCardsService) {
		super(allCards);
	}

	public static create(newAction, allCards: AllCardsService): StartTurnAction {
		return Object.assign(new StartTurnAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): StartTurnAction {
		return Object.assign(this.getInstance(), this, { entities });
	}

	public enrichWithText(allEntitiesSoFar: Map<number, Entity>): StartTurnAction {
		const textRaw = this.isHeroSelection
			? 'Hero selection'
			: this.isMulligan
			? 'Start of mulligan'
			: 'Start of turn ' + this.turn;
		return Object.assign(this.getInstance(), this, { textRaw });
	}

	protected getInstance(): Action {
		return new StartTurnAction(this.allCards);
	}
}
