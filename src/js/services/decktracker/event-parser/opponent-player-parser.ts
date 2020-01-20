import { AllCardsService } from '@firestone-hs/replay-parser';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { HeroCard } from '../../../models/decktracker/hero-card';
import { GameEvent } from '../../../models/game-event';
import { PreferencesService } from '../../preferences.service';
import { AiDeckService } from '../ai-deck-service.service';
import { DeckParserService } from '../deck-parser.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class OpponentPlayerParser implements EventParser {
	constructor(
		private readonly aiDecks: AiDeckService,
		private readonly deckParser: DeckParserService,
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: AllCardsService,
		private readonly prefs: PreferencesService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && state.opponentDeck && gameEvent.type === GameEvent.OPPONENT;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const battleTag = gameEvent.opponentPlayer && gameEvent.opponentPlayer.Name;
		const playerName = this.extractNameFromBTag(battleTag) || this.getNameFromCard(gameEvent.opponentPlayer.CardID);
		const newHero = Object.assign(new HeroCard(), currentState.opponentDeck.hero, {
			playerName: playerName,
		} as HeroCard);
		const shouldLoadDecklist = (await this.prefs.getPreferences()).opponentLoadAiDecklist;
		const aiDeck = this.aiDecks.getAiDeck(gameEvent.opponentPlayer.CardID, currentState.metadata.scenarioId);
		const aiDeckString = shouldLoadDecklist && aiDeck ? aiDeck.deckstring : null;
		console.log('[opponent-player] got deckstring', aiDeckString);
		// No deckstring, so don't change anything
		if (!aiDeckString) {
			const newPlayerDeck = currentState.opponentDeck.update({
				hero: newHero,
			} as DeckState);
			console.log('[opponent-player] newPlayerDeck without ai deckstring', newPlayerDeck);
			return currentState.update({
				opponentDeck: newPlayerDeck,
			} as GameState);
		}

		const decklist = this.deckParser.buildDeckList(aiDeckString);
		console.log('[opponent-player] parsed decklist', decklist);
		// And since this event usually arrives after the cards in hand were drawn, remove from the deck
		// whatever we can
		let newDeck = decklist;
		if (aiDeckString) {
			for (const card of [
				...currentState.opponentDeck.hand,
				...currentState.opponentDeck.otherZone,
				...currentState.opponentDeck.board,
			]) {
				newDeck = this.helper.removeSingleCardFromZone(newDeck, card.cardId, card.entityId)[0];
			}
		}
		console.log('[opponent-player] newDeck', newDeck);
		const newPlayerDeck = currentState.opponentDeck.update({
			hero: newHero,
			deckList: decklist,
			deck: newDeck,
		} as DeckState);
		console.log('[opponent-player] newPlayerDeck', newPlayerDeck);
		return currentState.update({
			opponentDeck: newPlayerDeck,
		} as GameState);
	}

	event(): string {
		return GameEvent.OPPONENT;
	}

	private extractNameFromBTag(battleTag: string): string {
		return battleTag && battleTag.indexOf('#') !== -1 ? battleTag.split('#')[0] : battleTag;
	}

	private getNameFromCard(cardId: string): string {
		const card = cardId ? this.allCards.getCard(cardId) : null;
		return card ? card.name : 'Unnamed player';
	}
}
