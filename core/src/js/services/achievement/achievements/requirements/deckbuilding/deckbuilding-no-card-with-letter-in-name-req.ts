import { CardsFacadeService } from '@services/cards-facade.service';
import { RawRequirement } from '../../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../../models/game-event';
import { Requirement } from '../_requirement';

export class DeckbuildingNoCardWithLetterInNameReq implements Requirement {
	private doesDeckMeetSpec: boolean;

	constructor(private readonly letterToAvoid: string, private readonly cards: CardsFacadeService) {}

	public static create(rawReq: RawRequirement, cards: CardsFacadeService): Requirement {
		return new DeckbuildingNoCardWithLetterInNameReq(rawReq.values[0], cards);
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
		if (deck && deck.cards && deck.cards.length > 0 && this.letterToAvoid) {
			const dbfIds = deck.cards.map((pair) => pair[0]);
			const cards: any[] = this.cards.getCardsFromDbfIds(dbfIds);
			this.doesDeckMeetSpec =
				cards.length > 0 &&
				cards.every((card) => card.name.toLowerCase().indexOf(this.letterToAvoid.toLowerCase()) === -1);
			if (this.doesDeckMeetSpec) {
				console.log(
					'[deckbuilding-no-card-req',
					'deck matches condition',
					this.doesDeckMeetSpec,
					this.letterToAvoid,
					deck,
					cards,
				);
			}
		} else {
			this.doesDeckMeetSpec = false;
		}
	}
}
