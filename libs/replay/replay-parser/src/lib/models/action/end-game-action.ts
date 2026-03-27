import { PlayState } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { ActionHelper } from '../../services/action/action-helper';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';

export class EndGameAction extends Action {
	readonly winStatus: readonly [number, number][];
	readonly entityId: number;
	readonly opponentId: number;

	constructor(allCards: AllCardsService) {
		super(allCards);
	}

	public static create(newAction, allCards: AllCardsService): EndGameAction {
		return Object.assign(new EndGameAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): EndGameAction {
		return Object.assign(this.getInstance(), this, { entities });
	}

	public enrichWithText(allEntitiesSoFar: Map<number, Entity>): EndGameAction {
		let concededText = '';
		for (const status of this.winStatus) {
			if (status[1] === PlayState.CONCEDED) {
				const name = ActionHelper.getOwner(this.entities, status[0]).name;
				concededText = `${name} conceded, `;
			}
		}
		let winText = '';
		for (const status of this.winStatus) {
			if (status[1] !== PlayState.CONCEDED && status[1] !== PlayState.TIED && status[0] === this.entityId) {
				const name = ActionHelper.getOwner(this.entities, this.entityId).name;
				const statusString = status[1] === PlayState.WON ? 'won' : 'lost';
				winText = `${name} ${statusString}!`;
			}
		}

		let textRaw = '';
		if (!winText && this.winStatus.some(status => status[1] === PlayState.TIED)) {
			textRaw = 'Both players tied';
		} else {
			textRaw = `${concededText}${winText}`;
		}
		return Object.assign(this.getInstance(), this, { textRaw });
	}

	protected getInstance(): Action {
		return new EndGameAction(this.allCards);
	}
}
