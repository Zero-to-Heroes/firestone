import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { HeroCard } from '../../../models/decktracker/hero-card';
import { GameEvent } from '../../../models/game-event';
import { AiDeckService } from '../ai-deck-service.service';
import { DeckParserService } from '../deck-parser.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class OpponentPlayerParser implements EventParser {
	constructor(
		private readonly aiDecks: AiDeckService,
		private readonly deckParser: DeckParserService,
		private readonly helper: DeckManipulationHelper,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && state.playerDeck && gameEvent.type === GameEvent.OPPONENT;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const battleTag = gameEvent.opponentPlayer && gameEvent.opponentPlayer.Name;
		const playerName = battleTag && battleTag.indexOf('#') !== -1 ? battleTag.split('#')[0] : battleTag;
		const newHero = Object.assign(new HeroCard(), currentState.playerDeck.hero, {
			playerName: playerName,
		} as HeroCard);
		const aiDeckString = this.aiDecks.getAiDeck(gameEvent.opponentPlayer.CardID, currentState.metadata.scenarioId);
		const decklist = this.deckParser.buildDeckList(aiDeckString);
		// And since this event usually arrives after the cards in hand were drawn, remove from the deck
		// whatever we can
		let newDeck = decklist;
		for (const card of currentState.opponentDeck.hand) {
			newDeck = this.helper.removeSingleCardFromZone(newDeck, card.cardId, card.entityId)[0];
		}
		const newPlayerDeck = Object.assign(new DeckState(), currentState.opponentDeck, {
			hero: newHero,
			deckList: decklist,
			deck: newDeck,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			opponentPlayer: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.OPPONENT;
	}
}
