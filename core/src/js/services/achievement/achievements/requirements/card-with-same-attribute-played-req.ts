import { CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { QualifierType } from './_qualifier.type';
import { Requirement } from './_requirement';

export class CardWithSameAttributePlayedReq implements Requirement {
	private isCardPlayed: boolean;
	private playCounts: { [cardAttribute: string]: number };

	private readonly cardType: CardType;
	private readonly attribute: string;

	constructor(
		private readonly targetQuantity: number,
		private readonly qualifier: QualifierType,
		attribute: string,
		cardType: string,
		private readonly cards: CardsFacadeService,
	) {
		this.cardType = CardType[cardType];
		this.attribute = attribute.toLowerCase();
		this.playCounts = {};
	}

	public static create(rawReq: RawRequirement, cards: CardsFacadeService): Requirement {
		if (!rawReq.values || rawReq.values.length !== 4) {
			console.error('invalid parameters for CardWithSameAttributePlayedReq', rawReq);
		}
		return new CardWithSameAttributePlayedReq(
			parseInt(rawReq.values[0]),
			rawReq.values[1] as QualifierType,
			rawReq.values[2].toLowerCase(),
			rawReq.values[3],
			cards,
		);
	}

	reset(): void {
		this.playCounts = {};
		this.isCardPlayed = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.playCounts = {};
		this.isCardPlayed = undefined;
	}

	isCompleted(): boolean {
		return this.isCardPlayed;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.CARD_PLAYED) {
			this.detectCardPlayedEvent(gameEvent);
			return;
		}
	}

	private detectCardPlayedEvent(gameEvent: GameEvent) {
		const cardId = gameEvent.cardId;
		const controllerId = gameEvent.controllerId;
		const localPlayer = gameEvent.localPlayer;
		const card = this.cards.getCard(cardId);
		if (!card?.type) {
			return;
		}

		if (
			controllerId === localPlayer?.PlayerId &&
			CardType[card.type.toUpperCase()] === this.cardType &&
			!this.hasEcho(card)
		) {
			const attributeValue = card[this.attribute];
			// console.log('handling for attribute', attributeValue, this.attribute);
			this.playCounts[attributeValue] = (this.playCounts[attributeValue] || 0) + 1;
			// console.log('playCounts', this.playCounts, this.targetQuantity);
			this.isCardPlayed = Object.keys(this.playCounts).some(
				// TODO: only support "AT_LEAST", implicitely, for now
				(cardAttribute) => this.playCounts[cardAttribute] >= this.targetQuantity,
			);
		}
	}

	private hasEcho(card: ReferenceCard): boolean {
		return card.mechanics && card.mechanics.includes('ECHO');
	}
}
