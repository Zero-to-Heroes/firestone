import { ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../../models/game-event';
import { QualifierType } from '../_qualifier.type';
import { Requirement } from '../_requirement';
import { TextQualifierType } from '../_text-qualifier.type';
import { buildCardArraysFromDeck } from './deckbuilding-helper';

export class DeckbuildingCardNameReq implements Requirement {
	private doesDeckMeetSpec: boolean;

	private readonly text: string[];

	constructor(
		private readonly targetCardQuantity: number,
		private readonly qualifier: QualifierType,
		private readonly textQualifier: TextQualifierType,
		text: string,
		private readonly cards: CardsFacadeService,
	) {
		this.text = text.split('|');
	}

	public static create(rawReq: RawRequirement, cards: CardsFacadeService): Requirement {
		return new DeckbuildingCardNameReq(
			parseInt(rawReq.values[0]),
			rawReq.values[1] as QualifierType,
			rawReq.values[2] as TextQualifierType,
			rawReq.values[3],
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
		if (gameEvent.type === GameEvent.MATCH_INFO) {
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
		if (this.textQualifier === 'STARTS_WITH') {
			return this.text.some((text) => card.name && card.name.toLowerCase().startsWith(text.toLowerCase()));
		}
		console.error('No support for textQualifier', this.textQualifier);
		return false;
	}
}
