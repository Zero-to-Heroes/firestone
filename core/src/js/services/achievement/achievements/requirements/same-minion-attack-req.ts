import { CardType } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { QualifierType } from './_qualifier.type';
import { Requirement } from './_requirement';

export class SameMinionAttackReq implements Requirement {
	private hasMinionAttacked: boolean;
	private attackCounts: { [entityId: number]: number };

	constructor(
		private readonly targetQuantity: number,
		private readonly qualifier: QualifierType,
		private readonly cards: AllCardsService,
	) {
		this.attackCounts = {};
	}

	public static create(rawReq: RawRequirement, cards: AllCardsService): Requirement {
		if (!rawReq.values || rawReq.values.length !== 2) {
			console.error('invalid parameters for SameMinionAttackReq', rawReq);
		}
		return new SameMinionAttackReq(parseInt(rawReq.values[0]), rawReq.values[1] as QualifierType, cards);
	}

	reset(): void {
		this.attackCounts = {};
		this.hasMinionAttacked = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.attackCounts = {};
		this.hasMinionAttacked = undefined;
	}

	isCompleted(): boolean {
		return this.hasMinionAttacked;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.ATTACKING_HERO || gameEvent.type === GameEvent.ATTACKING_MINION) {
			this.handleEvent(gameEvent);
			return;
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		const localPlayer = gameEvent.localPlayer;
		const cardId = gameEvent.additionalData.attackerCardId;
		const entityId = gameEvent.additionalData.attackerEntityId;
		const controllerId = gameEvent.additionalData.attackerControllerId;
		const card = this.cards.getCard(cardId);
		// console.log('handling attack event', gameEvent, card);
		if (
			controllerId === localPlayer?.PlayerId &&
			card.type &&
			CardType[card.type.toUpperCase()] === CardType.MINION
		) {
			// console.log('valid minion attack');
			this.attackCounts[entityId] = (this.attackCounts[entityId] || 0) + 1;
			// console.log('attack count is', entityId, this.attackCounts);
			this.hasMinionAttacked = Object.keys(this.attackCounts).some(
				// TODO: only support "AT_LEAST", implicitely, for now
				entityId => this.attackCounts[entityId] >= this.targetQuantity,
			);
			// console.log('hasMinionAttacked', this.hasMinionAttacked);
		}
	}
}
