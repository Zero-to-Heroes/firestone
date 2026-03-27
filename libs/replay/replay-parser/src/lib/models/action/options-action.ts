import { Map } from 'immutable';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';

export class OptionsAction extends Action {
	readonly options: readonly number[];

	constructor(allCards: AllCardsService) {
		super(allCards);
	}

	public static create(newAction, allCards: AllCardsService): OptionsAction {
		return Object.assign(new OptionsAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): OptionsAction {
		return Object.assign(this.getInstance(), this, { entities });
	}

	public enrichWithText(allEntitiesSoFar: Map<number, Entity>): OptionsAction {
		const textRaw = '';
		return Object.assign(this.getInstance(), this, { textRaw });
	}

	protected getInstance(): Action {
		return new OptionsAction(this.allCards);
	}
}
