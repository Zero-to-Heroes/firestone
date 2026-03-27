import { PlayState } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
import { ActionHelper } from '../../services/action/action-helper';
import { AllCardsService } from '../../services/all-cards.service';
import { Entity } from '../game/entity';

export abstract class Action {
	readonly timestamp: number;
	readonly index: number;
	readonly textRaw: string;

	readonly playerId?: number;
	readonly opponentId?: number;

	// Since we want to make actions more compact and show everything at once, we store
	// this data in possibly any action
	readonly originId: number;
	readonly targetIds: readonly number[];

	// Game state information
	readonly entities: Map<number, Entity>;
	readonly crossedEntities: readonly number[] = [];
	readonly highlightedEntities: readonly number[];
	readonly activeSpell: number;
	readonly activePlayer: number;
	readonly isMulligan: boolean;
	readonly isHeroSelection: boolean;
	readonly isEndGame: boolean;
	readonly endGameStatus: PlayState;
	readonly targets: readonly [number, number][];
	readonly options: readonly number[] = [];
	// This is part of the global action, because damage actions can be merged
	// into non-damage ones
	readonly damages: Map<number, number> = Map();

	protected abstract getInstance(): Action;
	abstract update(entities: Map<number, Entity>): Action;
	// The list of entities is useful when trying to find the name of an entity that died,
	// but whose deathrattle effect triggers and is logged in text
	abstract enrichWithText(allEntitiesSoFar: Map<number, Entity>): Action;

	constructor(protected readonly allCards?: AllCardsService) {}

	public updateAction<T extends Action>(newAction: T): T {
		return Object.assign(this.getInstance(), this, newAction);
	}

	protected generateTargetsText(allEntitiesSoFar: Map<number, Entity>): string {
		if (!this.targetIds || this.targetIds.length === 0) {
			return null;
		}
		const originCardId = ActionHelper.getCardId(this.entities, this.originId, allEntitiesSoFar);
		const originCardName = this.allCards.getCard(originCardId).name;
		const targetCardIds = this.targetIds.map((entityId) =>
			ActionHelper.getCardId(this.entities, entityId, allEntitiesSoFar),
		);
		const cardIds = targetCardIds.map((cardId) => this.allCards.getCard(cardId));
		const targetCardNames = cardIds.some((card) => !card || !card.name)
			? `${cardIds.length} cards`
			: cardIds.map((card) => card.name).join(', ');
		let damageText = '';
		if (this.damages) {
			damageText = this.damages
				.map((amount, entityId) => {
					const entityCardId = ActionHelper.getCardId(this.entities, entityId, allEntitiesSoFar);
					const entityCard = this.allCards.getCard(entityCardId);
					return `${entityCard.name} takes ${amount} damage`;
				})
				.join(', ');
		}
		const textRaw = `\t${originCardName} targets ${targetCardNames}. \n${damageText}`;
		return textRaw;
	}
}
