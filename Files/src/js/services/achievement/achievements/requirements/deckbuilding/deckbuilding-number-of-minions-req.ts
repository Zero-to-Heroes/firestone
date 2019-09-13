import { RawRequirement } from '../../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../../models/game-event';
import { AllCardsService } from '../../../../all-cards.service';
import { Requirement } from '../_requirement';

export class DeckbuildingNumberOfMinionsReq implements Requirement {
	private doesDeckMeetSpec: boolean;

	constructor(
		private readonly targetNumberOfMinions: number,
		private readonly qualifier: string,
		private readonly cards: AllCardsService,
	) {}

	public static create(rawReq: RawRequirement, cards: AllCardsService): Requirement {
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
		if (gameEvent.type === GameEvent.LOCAL_PLAYER) {
			this.handleEvent(gameEvent);
		}
	}

	private handleEvent(gameEvent: GameEvent) {
		const deck = gameEvent.localPlayer.deck ? gameEvent.localPlayer.deck.deck : null;
		if (deck && deck.cards && deck.cards.length > 0) {
			const cards = deck.cards
				.map(pair => this.fillArray(this.cards.getCardFromDbfId(pair[0]), pair[1]))
				.reduce((a, b) => a.concat(b));
			const numberOfMatchingCards: number = cards.filter(card => card.type === 'Minion').length;
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

	private fillArray(value, len) {
		var arr = [];
		for (var i = 0; i < len; i++) {
			arr.push(value);
		}
		return arr;
	}
}
