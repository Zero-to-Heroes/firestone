import { CardsFacadeService } from '@services/cards-facade.service';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../../models/game-event';
import { Requirement } from '../_requirement';
import { buildCardArraysFromDeck } from './deckbuilding-helper';

export class DeckbuildingCardAttributeReq implements Requirement {
	private doesDeckMeetSpec: boolean;

	constructor(
		private readonly targetNumberOfCards: number,
		private readonly qualifier: string,
		private readonly targetAttribute: string,
		private readonly targetAttributeValue: number,
		private readonly attributeQualifier: string,
		private readonly cards: CardsFacadeService,
	) {}

	public static create(rawReq: RawRequirement, cards: CardsFacadeService): Requirement {
		return new DeckbuildingCardAttributeReq(
			parseInt(rawReq.values[0]),
			rawReq.values[1],
			rawReq.values[2],
			parseInt(rawReq.values[3]),
			rawReq.values[4],
			cards,
		);
	}

	reset(): void {
		this.doesDeckMeetSpec = undefined;
	}

	afterAchievementCompletionReset(): void {
		this.doesDeckMeetSpec = undefined;
	}

	isCompleted(): boolean {
		return this.doesDeckMeetSpec;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.PLAYERS_INFO) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		const deck = gameEvent.localPlayer?.deck ? gameEvent.localPlayer.deck.deck : null;
		if (deck && deck.cards && deck.cards.length > 0) {
			const cards = buildCardArraysFromDeck(deck, this.cards);
			const numberOfMatchingCards: number = cards
				.filter((card) => card[this.targetAttribute] != null)
				.filter((card) =>
					this.attributeQualifier === 'AT_LEAST'
						? parseInt(card[this.targetAttribute]) >= this.targetAttributeValue
						: this.attributeQualifier === 'AT_MOST'
						? parseInt(card[this.targetAttribute]) <= this.targetAttributeValue
						: parseInt(card[this.targetAttribute]) === this.targetAttributeValue,
				).length;
			if (this.qualifier === 'AT_LEAST') {
				this.doesDeckMeetSpec = numberOfMatchingCards >= this.targetNumberOfCards;
			} else if (this.qualifier === 'AT_MOST') {
				this.doesDeckMeetSpec = numberOfMatchingCards <= this.targetNumberOfCards;
			} else {
				this.doesDeckMeetSpec = numberOfMatchingCards === this.targetNumberOfCards;
			}
		} else {
			this.doesDeckMeetSpec = false;
		}
	}
}
