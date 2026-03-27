import { Map } from 'immutable';
import { AllCardsService } from '../../../services/all-cards.service';
import { Entity } from '../../game/entity';
import { Action } from '../action';

export class BaconBattleOverAction extends Action {
	constructor(allCards: AllCardsService) {
		super(allCards);
	}

	public static create(newAction, allCards: AllCardsService): BaconBattleOverAction {
		return Object.assign(new BaconBattleOverAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): BaconBattleOverAction {
		return Object.assign(this.getInstance(), this, {
			entities,
		});
	}

	public enrichWithText(allEntitiesSoFar: Map<number, Entity>): BaconBattleOverAction {
		return Object.assign(new BaconBattleOverAction(this.allCards), this, {
			textRaw: 'Battle over',
		} as BaconBattleOverAction);
	}

	protected getInstance(): Action {
		return new BaconBattleOverAction(this.allCards);
	}
}
