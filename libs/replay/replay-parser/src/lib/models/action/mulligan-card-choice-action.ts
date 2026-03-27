import { Map } from 'immutable';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';

export class MulliganCardChoiceAction extends Action {
	readonly playerMulligan: readonly number[];
	readonly opponentMulligan: readonly number[];

	constructor(allCards: AllCardsService) {
		super(allCards);
	}

	public static create(newAction, allCards: AllCardsService): MulliganCardChoiceAction {
		return Object.assign(new MulliganCardChoiceAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): MulliganCardChoiceAction {
		return Object.assign(new MulliganCardChoiceAction(this.allCards), this, { entities });
	}

	public enrichWithText(allEntitiesSoFar: Map<number, Entity>): MulliganCardChoiceAction {
		const textRaw = '';
		return Object.assign(new MulliganCardChoiceAction(this.allCards), this, { textRaw });
	}

	protected getInstance(): Action {
		return new MulliganCardChoiceAction(this.allCards);
	}
}
