import { Map } from 'immutable';
import { ActionHelper } from '../../services/action/action-helper';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';
import { Action } from './action';

export class CardDrawAction extends Action {
	readonly data: readonly number[];
	readonly controller: number;

	constructor(allCards: AllCardsService) {
		super(allCards);
	}

	public static create(newAction, allCards: AllCardsService): CardDrawAction {
		return Object.assign(new CardDrawAction(allCards), newAction);
	}

	public update(entities: Map<number, Entity>): CardDrawAction {
		return Object.assign(new CardDrawAction(this.allCards), this, {
			entities,
		});
	}

	public enrichWithText(allEntitiesSoFar: Map<number, Entity>): CardDrawAction {
		const playerEntity = this.data.map((entityId) => ActionHelper.getOwner(this.entities, entityId));
		if (!playerEntity || playerEntity.length === 0) {
			console.warn('[card-draw-action] could not find player owner', this.data);
			return this;
		}
		const ownerNames: string[] = this.data
			.map((entityId) => ActionHelper.getOwner(this.entities, entityId))
			.map((entity) => {
				if (!entity) {
					console.warn(
						'[card-draw-action] no player entity',
						entity,
						this.data,
						this.entities.get(this.data[0]).tags,
					);
					return '';
				}
				return entity.name;
			})
			.filter((name, index, self) => self.indexOf(name) === index);
		if (ownerNames.length !== 1) {
			console.warn('[card-draw-action] Invalid grouping of cards ' + ownerNames + ', ' + this.data);
			return this;
		}
		const ownerName = ownerNames[0];
		const drawnCards = this.data
			.map((entityId) => ActionHelper.getCardId(this.entities, entityId, allEntitiesSoFar))
			.map((cardId) => this.allCards.getCard(cardId));
		let drawInfo = '';
		// We don't have the mulligan info, so we just display the amount of cards being mulliganed
		if (drawnCards.some((card) => !card || !card.name)) {
			drawInfo = `${drawnCards.length} cards`;
		} else {
			drawInfo = drawnCards.map((card) => card.name).join(', ');
		}

		const textRaw = `\t${ownerName} draws ` + drawInfo;
		return Object.assign(new CardDrawAction(this.allCards), this, {
			textRaw,
		});
	}

	protected getInstance(): Action {
		return new CardDrawAction(this.allCards);
	}
}
