import { RarityTYpe } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../../models/game-event';
import { QualifierType } from '../_qualifier.type';
import { Requirement } from '../_requirement';
import { buildCardArraysFromDeck } from './deckbuilding-helper';

export class DeckbuildingRarityReq implements Requirement {
	private doesDeckMeetSpec: boolean;

	constructor(
		private readonly targetNumberOfCards: number,
		private readonly qualifier: QualifierType,
		private readonly rarity: RarityTYpe,
		private readonly cards: CardsFacadeService,
	) {}

	public static create(rawReq: RawRequirement, cards: CardsFacadeService): Requirement {
		if (!rawReq.values || rawReq.values.length !== 3) {
			console.error('invalid parameters for DeckbuildingRarityReq', rawReq);
		}
		return new DeckbuildingRarityReq(
			parseInt(rawReq.values[0]),
			rawReq.values[1] as QualifierType,
			rawReq.values[2] as RarityTYpe,
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
			const numberOfMatchingCards: number = cards.filter(
				// We still want to use lower case rarities outside, until we can migrate
				// evreything to lower case
				(card) => card.rarity && card.rarity?.toLowerCase() === this.rarity?.toLowerCase(),
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
