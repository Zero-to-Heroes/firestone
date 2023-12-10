import { CardClass } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState, HeroCard } from '@firestone/game-state';
import { MemoryInspectionService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { GameEvent } from '../../../models/game-event';
import { AiDeckService } from '../ai-deck-service.service';
import { DeckHandlerService } from '../deck-handler.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class OpponentPlayerParser implements EventParser {
	constructor(
		private readonly aiDecks: AiDeckService,
		private readonly handler: DeckHandlerService,
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationFacadeService,
		private readonly memory: MemoryInspectionService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && !!state.opponentDeck;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		console.log('will process OPPONENT event');
		const battleTag = gameEvent.opponentPlayer && gameEvent.opponentPlayer.Name;
		const playerName = this.extractNameFromBTag(battleTag) || this.getNameFromCard(gameEvent.opponentPlayer.CardID);
		const classes = this.allCards.getCard(gameEvent.opponentPlayer.CardID).classes;
		const newHero = Object.assign(new HeroCard(), currentState.opponentDeck.hero, {
			playerName: playerName,
			classes: classes?.map((c) => CardClass[c]) ?? ([CardClass.NEUTRAL] as readonly CardClass[]),
		} as HeroCard);

		// Total cards before setting the decklist
		const cardsInDeck = currentState.opponentDeck.hand.length + currentState.opponentDeck.deck.length;

		const shouldLoadDecklist = (await this.prefs.getPreferences()).opponentLoadAiDecklist;
		const aiDeck = shouldLoadDecklist
			? await this.aiDecks.getAiDeck(gameEvent.opponentPlayer.CardID, currentState.metadata.scenarioId)
			: null;
		const aiDeckString = aiDeck?.deckstring;

		// No deckstring, so don't change anything
		if (!aiDeckString) {
			const newPlayerDeck = currentState.opponentDeck.update({
				hero: newHero,
			} as DeckState);

			return currentState.update({
				opponentDeck: newPlayerDeck,
			} as GameState);
		}

		console.log('[opponent-player] got AI deckstring', aiDeckString, currentState.metadata);
		const board = await this.memory.getCurrentBoard();
		const decklist = await this.handler.postProcessDeck(this.handler.buildDeckList(aiDeckString), board);

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
		return card ? card.name : this.i18n.translateString('decktracker.unnamed-player');
	}

	private flagCards(cards: readonly DeckCard[]): readonly DeckCard[] {
		return cards.map((card) =>
			card.update({
				inInitialDeck: true,
			} as DeckCard),
		);
	}
}
