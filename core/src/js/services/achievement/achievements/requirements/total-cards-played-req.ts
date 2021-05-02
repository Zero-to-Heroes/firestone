import { CardType } from '@firestone-hs/reference-data';
import { ReferenceCard } from '@firestone-hs/reference-data/lib/models/reference-cards/reference-card';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { QualifierType } from './_qualifier.type';
import { Requirement } from './_requirement';

export class TotalCardsPlayedReq implements Requirement {
	private playCounts = 0;

	constructor(
		private readonly targetQuantity: number,
		private readonly qualifier: QualifierType,
		private readonly cardType: string,
		private readonly cards: AllCardsService,
	) {}

	public static create(rawReq: RawRequirement, cards: AllCardsService): Requirement {
		if (!rawReq.values || rawReq.values.length !== 3) {
			console.error('invalid parameters for CardWithSameAttributePlayedReq', rawReq);
		}
		return new TotalCardsPlayedReq(
			parseInt(rawReq.values[0]),
			rawReq.values[1] as QualifierType,
			rawReq.values[2],
			cards,
		);
	}

	reset(): void {
		this.playCounts = 0;
	}

	afterAchievementCompletionReset(): void {
		this.playCounts = 0;
	}

	isCompleted(): boolean {
		// console.log('is completed?', this.qualifier, this.playCounts, this.targetQuantity);
		if (this.qualifier === 'AT_LEAST') {
			return this.playCounts >= this.targetQuantity;
		} else if (this.qualifier === 'AT_MOST') {
			return this.playCounts <= this.targetQuantity;
		} else {
			console.error('invalid qualifier for total-cards-played-req', this.qualifier);
			return false;
		}
	}

	test(gameEvent: GameEvent): void {
		if (
			gameEvent.type === GameEvent.CARD_PLAYED ||
			gameEvent.type === GameEvent.SECRET_PLAYED ||
			gameEvent.type === GameEvent.SECRET_PLAYED_FROM_DECK
		) {
			this.detectCardPlayedEvent(gameEvent);
			return;
		}
	}

	private detectCardPlayedEvent(gameEvent: GameEvent) {
		const cardId = gameEvent.cardId;
		if (!cardId) {
			return;
		}

		const controllerId = gameEvent.controllerId;
		const localPlayer = gameEvent.localPlayer;
		const card = this.cards.getCard(cardId);
		if (controllerId === localPlayer?.PlayerId && this.getCardType(card) === this.cardType) {
			this.playCounts++;
		}
	}

	private getCardType(card: ReferenceCard): string {
		if (!card?.type) {
			return null;
		}
		if (
			CardType[card.type.toUpperCase()] === CardType.SPELL &&
			card.mechanics &&
			card.mechanics.includes('SECRET') &&
			this.cardType !== 'SPELL'
		) {
			return 'SECRET';
		}
		return card.type.toUpperCase();
	}
}
