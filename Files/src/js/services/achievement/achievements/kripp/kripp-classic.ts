import { AbstractChallenge } from "../abstract-challenge";
import { GameEvent } from "../../../../models/game-event";
import { Events } from "../../../events.service";
import { GameType } from "../../../../models/enums/game-type";
import { DeckParserService } from "../../../decktracker/deck-parser.service";
import { AllCardsService } from "../../../all-cards.service";


export class KrippClassic extends AbstractChallenge {

	private readonly cardId: string;

	private gameStartTime: number;
	private isDeckClassic: boolean = false;

	constructor(achievement, events: Events, private deckParser: DeckParserService, private allCards: AllCardsService) {
		super(achievement, [GameType.RANKED], events, [GameEvent.GAME_END]);
		this.cardId = achievement.cardId;
	}

	protected resetState() {
        this.gameStartTime = 0;
		this.isDeckClassic = false;
	}

	protected detectEvent(gameEvent: GameEvent, callback: Function) {
        if (gameEvent.type === GameEvent.MATCH_METADATA) {
			console.log('in metadata event')
			this.gameStartTime = Date.now();
			this.isDeckClassic = this.hasDeckOnlyClassicCards(this.deckParser.currentDeck);
			console.log('is deck classic?', this.isDeckClassic, this.deckParser.currentDeck);
        }
		if (gameEvent.type === GameEvent.GAME_START) {
			this.gameStartTime = Date.now();
			return;
		}
		if (gameEvent.type === GameEvent.WINNER) {
			this.detectGameResultEvent(gameEvent, callback);
			return;
		}
	}

	public getRecordPastDurationMillis(): number {
		return Date.now() - this.gameStartTime;
	}

	private detectGameResultEvent(gameEvent: GameEvent, callback: Function) {
		let winner = gameEvent.additionalData.winner;
		let localPlayer = gameEvent.localPlayer;
		if (localPlayer.Id === winner.Id) {
			this.callback = callback;
			this.handleCompletion();
		}
	}

	private hasDeckOnlyClassicCards(deckContainer): boolean {
		if (!deckContainer || !deckContainer.deck) {
			console.log('no deck conainer')
			return false;
		}
		console.log('detecting deck', deckContainer);
		return deckContainer.deck.cards
				.map((pair) => this.allCards.getCardFromDbfId(pair[0]))
				.every((card) => card.set === 'Expert1' || card.set === 'Core');
	}

	protected additionalCheckForCompletion(): boolean {
		return this.isDeckClassic;
	}
}
