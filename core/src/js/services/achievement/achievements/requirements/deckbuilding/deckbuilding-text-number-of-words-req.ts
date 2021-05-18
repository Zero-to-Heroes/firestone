import { ReferenceCard } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../../models/game-event';
import { QualifierType } from '../_qualifier.type';
import { Requirement } from '../_requirement';
import { buildCardArraysFromDeck } from './deckbuilding-helper';

export class DeckbuildingTextNumberOfWordsReq implements Requirement {
	private doesDeckMeetSpec: boolean;

	constructor(
		private readonly targetCardQuantity: number,
		private readonly qualifier: QualifierType,
		private readonly targetNumberOfWords: number,
		private readonly numberOfWordsQualifier: QualifierType,
		private readonly cards: AllCardsService,
	) {}

	public static create(rawReq: RawRequirement, cards: AllCardsService): Requirement {
		return new DeckbuildingTextNumberOfWordsReq(
			parseInt(rawReq.values[0]),
			rawReq.values[1] as QualifierType,
			parseInt(rawReq.values[2]),
			rawReq.values[3] as QualifierType,
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
		if (gameEvent.type === GameEvent.LOCAL_PLAYER) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		const deck = gameEvent.localPlayer?.deck ? gameEvent.localPlayer.deck.deck : null;
		if (deck && deck.cards && deck.cards.length > 0) {
			const cards = buildCardArraysFromDeck(deck, this.cards);
			const numberOfMatchingCards: number = cards.filter((card) => this.cardMatches(card)).length;
			if (this.qualifier === 'AT_LEAST') {
				this.doesDeckMeetSpec = numberOfMatchingCards >= this.targetCardQuantity;
			} else if (this.qualifier === 'AT_MOST') {
				this.doesDeckMeetSpec = numberOfMatchingCards <= this.targetCardQuantity;
			} else {
				this.doesDeckMeetSpec = numberOfMatchingCards === this.targetCardQuantity;
			}
		} else {
			this.doesDeckMeetSpec = false;
		}
	}

	private cardMatches(card: ReferenceCard): boolean {
		const numberOfWords = (card.text || '').replace('\n', ' ').split(' ').length;
		if (this.numberOfWordsQualifier === 'AT_LEAST') {
			return numberOfWords >= this.targetNumberOfWords;
		} else if (this.numberOfWordsQualifier === 'AT_MOST') {
			return numberOfWords <= this.targetNumberOfWords;
		} else {
			return numberOfWords === this.targetNumberOfWords;
		}
	}
}
