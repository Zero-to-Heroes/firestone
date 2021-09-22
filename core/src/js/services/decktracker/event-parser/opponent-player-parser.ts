import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
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
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && state.opponentDeck && gameEvent.type === GameEvent.OPPONENT;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		console.log('will process OPPONENT event');
		const battleTag = gameEvent.opponentPlayer && gameEvent.opponentPlayer.Name;
		const playerName = this.extractNameFromBTag(battleTag) || this.getNameFromCard(gameEvent.opponentPlayer.CardID);
		const playerClass = this.allCards.getCard(gameEvent.opponentPlayer.CardID).playerClass;
		const newHero = Object.assign(new HeroCard(), currentState.opponentDeck.hero, {
			playerName: playerName,
			playerClass: playerClass ? playerClass.toLowerCase() : null,
		} as HeroCard);

		// Total cards before setting the decklist
		const cardsInDeck = currentState.opponentDeck.hand.length + currentState.opponentDeck.deck.length;
		// console.log('[opponent-player] total cards in actual deck + hand', cardsInDeck);
		const shouldLoadDecklist = (await this.prefs.getPreferences()).opponentLoadAiDecklist;
		const aiDeck = this.aiDecks.getAiDeck(gameEvent.opponentPlayer.CardID, currentState.metadata.scenarioId);
		const aiDeckString = shouldLoadDecklist && aiDeck ? aiDeck.deckstring : null;

		// No deckstring, so don't change anything
		if (!aiDeckString) {
			const newPlayerDeck = currentState.opponentDeck.update({
				hero: newHero,
			} as DeckState);
			// console.log('[opponent-player] newPlayerDeck without ai deckstring', newPlayerDeck);
			return currentState.update({
				opponentDeck: newPlayerDeck,
			} as GameState);
		}

		console.log('[opponent-player] got AI deckstring', aiDeckString, currentState.metadata);
		const decklist = await this.deckParser.postProcessDeck(this.deckParser.buildDeckList(aiDeckString));
		// console.log('[opponent-player] parsed decklist', decklist);
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
		// console.log('[opponent-player] newDeck', newDeck);
		const hand = aiDeckString ? this.flagCards(currentState.opponentDeck.hand) : currentState.opponentDeck.hand;
		const deck = aiDeckString ? this.flagCards(newDeck) : newDeck;

		const newPlayerDeck = currentState.opponentDeck.update({
			hero: newHero,
			deckstring: aiDeckString,
			deckList: decklist,
			deck: deck,
			hand: hand,
			otherZone: aiDeckString
				? this.flagCards(currentState.opponentDeck.otherZone)
				: currentState.opponentDeck.otherZone,
			showDecklistWarning: cardsInDeck < decklist.length,
		} as DeckState);
		// console.log('[opponent-player] newPlayerDeck', newPlayerDeck);
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

	private flagCards(cards: readonly DeckCard[]): readonly DeckCard[] {
		return cards.map((card) =>
			card.update({
				inInitialDeck: true,
			} as DeckCard),
		);
	}

	// private extractCardsInDeck(gameEvent: GameEvent): number {
	// 	try {
	// 		console.log('getting cards in deck', gameEvent);
	// 		return gameEvent.additionalData.gameState.Opponent.Deck.length;
	// 	} catch (e) {
	// 		console.log('could not get cards in deck', gameEvent, e);
	// 		return null;
	// 	}
	// }
}
