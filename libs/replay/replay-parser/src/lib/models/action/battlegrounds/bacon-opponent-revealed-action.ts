import { Map } from 'immutable';
import { AllCardsService } from '../../../services/all-cards.service';
import { Entity } from '../../game/entity';
import { Action } from '../action';

export class BaconOpponentRevealedAction extends Action {
	readonly opponentIds: readonly number[];

	constructor(allCards: AllCardsService) {
		super(allCards);
	}

	public static create(newAction, allCards: AllCardsService): BaconOpponentRevealedAction {
		return Object.assign(new BaconOpponentRevealedAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): BaconOpponentRevealedAction {
		return Object.assign(this.getInstance(), this, {
			entities,
		});
	}

	public enrichWithText(): BaconOpponentRevealedAction {
		return Object.assign(new BaconOpponentRevealedAction(this.allCards), this, {
			textRaw: 'Opponents revealed!',
		} as BaconOpponentRevealedAction);
	}

	protected getInstance(): Action {
		return new BaconOpponentRevealedAction(this.allCards);
	}
}
