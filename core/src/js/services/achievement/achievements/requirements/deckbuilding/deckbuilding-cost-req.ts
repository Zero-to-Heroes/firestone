import { ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../../models/game-event';
import { QualifierType } from '../_qualifier.type';
import { Requirement } from '../_requirement';
import { buildCardArraysFromDeck } from './deckbuilding-helper';

export class DeckbuildingCostReq implements Requirement {
	private doesDeckMeetSpec: boolean;

	constructor(
		private readonly targetNumberOfCards: number,
		private readonly qualifier: QualifierType,
		private readonly targetCost: number,
		private readonly costQualifier: QualifierType,
		private readonly cards: CardsFacadeService,
	) {}

	public static create(rawReq: RawRequirement, cards: CardsFacadeService): Requirement {
		if (!rawReq.values || rawReq.values.length !== 4) {
			console.error('invalid parameters for DeckbuildingCostReq', rawReq);
		}
		return new DeckbuildingCostReq(
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

	private cardMatches(card: ReferenceCard): boolean {
		switch (this.costQualifier) {
			case 'AT_LEAST':
				return card.cost >= this.targetCost;
			case 'AT_MOST':
				return card.cost <= this.targetCost;
			default:
				console.error('Invalid cost qualifier for deckbuilding-cost-req', this.costQualifier);
				return false;
		}
	}
}
