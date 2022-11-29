import { CardsFacadeService } from '@services/cards-facade.service';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../../models/game-event';
import { Requirement } from '../_requirement';

export class DeckbuildingClassicReq implements Requirement {
	private doesDeckMeetSpec: boolean;

	constructor(private readonly cards: CardsFacadeService) {}

	public static create(rawReq: RawRequirement, cards: CardsFacadeService): Requirement {
		return new DeckbuildingClassicReq(cards);
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
			const dbfIds = deck.cards.map((pair) => pair[0]);
			const cards: any[] = this.cards.getCardsFromDbfIds(dbfIds);
			this.doesDeckMeetSpec =
				cards.length > 0 &&
				cards.every((card) => card.set && ['core', 'expert1'].indexOf(card.set.toLowerCase()) !== -1);
		} else {
			this.doesDeckMeetSpec = false;
		}
	}
}
