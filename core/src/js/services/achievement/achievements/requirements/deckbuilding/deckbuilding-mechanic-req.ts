import { AllCardsService } from '@firestone-hs/replay-parser';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../../models/game-event';
import { Requirement } from '../_requirement';
import { buildCardArraysFromDeck } from './deckbuilding-helper';

export class DeckbuildingMechanicReq implements Requirement {
	private doesDeckMeetSpec: boolean;

	constructor(
		private readonly targetLifestealMinions: number,
		private readonly mechanic: string,
		private readonly qualifier: string,
		private readonly cards: AllCardsService,
	) {}

	public static create(rawReq: RawRequirement, cards: AllCardsService): Requirement {
		return new DeckbuildingMechanicReq(parseInt(rawReq.values[0]), rawReq.values[1], rawReq.values[2], cards);
	}

	reset(): void {
		// console.log('[debug] [mechanic] reset');
		this.doesDeckMeetSpec = undefined;
	}

	afterAchievementCompletionReset(): void {
		// console.log('[debug] [mechanic] afterAchievementCompletionReset');
		this.doesDeckMeetSpec = undefined;
	}

	isCompleted(): boolean {
		// console.log('[debug] [mechanic] isCompleted', this.doesDeckMeetSpec);
		return this.doesDeckMeetSpec;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.LOCAL_PLAYER) {
			// console.log('[debug] [mechanic] handling local_player event?', gameEvent);
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		const deck = gameEvent.localPlayer?.deck ? gameEvent.localPlayer.deck.deck : null;
		if (deck && deck.cards && deck.cards.length > 0) {
			const cards = buildCardArraysFromDeck(deck, this.cards);
			const numberOfMatchingCards: number = cards.filter(
				(card) => card.mechanics && card.mechanics.indexOf(this.mechanic) !== -1,
			).length;
			if (this.qualifier === 'AT_LEAST') {
				this.doesDeckMeetSpec = numberOfMatchingCards >= this.targetLifestealMinions;
			} else if (this.qualifier === 'AT_MOST') {
				this.doesDeckMeetSpec = numberOfMatchingCards <= this.targetLifestealMinions;
			} else {
				this.doesDeckMeetSpec = numberOfMatchingCards === this.targetLifestealMinions;
			}
		} else {
			this.doesDeckMeetSpec = false;
		}
	}
}
