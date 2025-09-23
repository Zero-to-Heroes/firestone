import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '@firestone/game-state';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement';
import { Requirement } from '../_requirement';
import { buildCardArraysFromDeck } from './deckbuilding-helper';

export class DeckbuildingNumberOfMinionsReq implements Requirement {
	private doesDeckMeetSpec: boolean;

	constructor(
		private readonly targetNumberOfMinions: number,
		private readonly qualifier: string,
		private readonly cards: CardsFacadeService,
	) {}

	public static create(rawReq: RawRequirement, cards: CardsFacadeService): Requirement {
		return new DeckbuildingNumberOfMinionsReq(parseInt(rawReq.values[0]), rawReq.values[1], cards);
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
			const numberOfMatchingCards: number = cards.filter((card) => card?.type === 'Minion').length;
			if (this.qualifier === 'AT_LEAST') {
				this.doesDeckMeetSpec = numberOfMatchingCards >= this.targetNumberOfMinions;
			} else if (this.qualifier === 'AT_MOST') {
				this.doesDeckMeetSpec = numberOfMatchingCards <= this.targetNumberOfMinions;
			} else {
				this.doesDeckMeetSpec = numberOfMatchingCards === this.targetNumberOfMinions;
			}
		} else {
			this.doesDeckMeetSpec = false;
		}
	}
}
