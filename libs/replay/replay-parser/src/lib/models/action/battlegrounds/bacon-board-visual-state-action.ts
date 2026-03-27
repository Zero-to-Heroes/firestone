import { Map } from 'immutable';
import { AllCardsService } from '../../../services/all-cards.service';
import { Entity } from '../../game/entity';
import { Action } from '../action';

export class BaconBoardVisualStateAction extends Action {
	readonly newState: number;

	constructor(allCards: AllCardsService) {
		super(allCards);
	}

	public static create(newAction, allCards: AllCardsService): BaconBoardVisualStateAction {
		return Object.assign(new BaconBoardVisualStateAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): BaconBoardVisualStateAction {
		return Object.assign(this.getInstance(), this, {
			entities,
		});
	}

	public enrichWithText(allEntitiesSoFar: Map<number, Entity>): BaconBoardVisualStateAction {
		const textRaw = this.newState === 1 ? 'Recruit' : 'Combat';
		return Object.assign(new BaconBoardVisualStateAction(this.allCards), this, {
			textRaw,
		} as BaconBoardVisualStateAction);
	}

	protected getInstance(): Action {
		return new BaconBoardVisualStateAction(this.allCards);
	}
}
