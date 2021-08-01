import { CardsFacadeService } from '@services/cards-facade.service';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../../models/game-event';
import { Requirement } from '../_requirement';
import { buildCardArraysFromDeck } from './deckbuilding-helper';

export class DeckbuildingTypeReq implements Requirement {
	private doesDeckMeetSpec: boolean;

	constructor(
		private readonly targetTypeQuantity: number,
		private readonly type: string,
		private readonly qualifier: string,
		private readonly cards: CardsFacadeService,
	) {}

	public static create(rawReq: RawRequirement, cards: CardsFacadeService): Requirement {
		return new DeckbuildingTypeReq(parseInt(rawReq.values[0]), rawReq.values[1], rawReq.values[2], cards);
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
			const numberOfMatchingCards: number = cards.filter(
				(card) => card.type && card.type.toUpperCase().indexOf(this.type) !== -1,
			).length;
			if (this.qualifier === 'AT_LEAST') {
				this.doesDeckMeetSpec = numberOfMatchingCards >= this.targetTypeQuantity;
			} else if (this.qualifier === 'AT_MOST') {
				this.doesDeckMeetSpec = numberOfMatchingCards <= this.targetTypeQuantity;
			} else {
				this.doesDeckMeetSpec = numberOfMatchingCards === this.targetTypeQuantity;
			}
		} else {
			this.doesDeckMeetSpec = false;
		}
	}
}
