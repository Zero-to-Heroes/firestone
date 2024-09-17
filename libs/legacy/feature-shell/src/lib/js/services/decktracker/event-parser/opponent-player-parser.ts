import { CardClass, getWhizbangHeroesTemplateDeckId, isKnownTwistList } from '@firestone-hs/reference-data';
import { DeckCard, DeckHandlerService, DeckState, GameState, HeroCard } from '@firestone/game-state';
import { MemoryInspectionService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { GameEvent } from '../../../models/game-event';
import { AiDeckService } from '../ai-deck-service.service';
import { DeckParserService } from '../deck-parser.service';
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
		private readonly deckParser: DeckParserService,
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
			cardId: gameEvent.opponentPlayer.CardID,
			classes: classes?.map((c) => CardClass[c]) ?? ([CardClass.NEUTRAL] as readonly CardClass[]),
		} as HeroCard);

		// Total cards before setting the decklist
		const cardsInDeck = currentState.opponentDeck.hand.length + currentState.opponentDeck.deck.length;

		const prefs = await this.prefs.getPreferences();
		console.debug('opponentLoadAiDecklist', currentState.metadata);
		let opponentDeckString = prefs.opponentLoadAiDecklist
			? (await this.aiDecks.getAiDeck(gameEvent.opponentPlayer.CardID, currentState.metadata.scenarioId))
					?.deckstring
			: null;
		if (
			opponentDeckString == null &&
			isKnownTwistList(currentState.metadata.scenarioId) &&
			prefs.opponentLoadKnownDecklist
		) {
			const deckTemplateId = getWhizbangHeroesTemplateDeckId(
				currentState.metadata.scenarioId,
				gameEvent.opponentPlayer.CardID,
			);
			console.debug('deckTemplateId', deckTemplateId);
			const templateDeck = !!deckTemplateId
				? await this.deckParser.getTemplateDeck(
						-deckTemplateId,
						currentState.metadata.scenarioId,
						currentState.metadata.gameType,
						currentState.metadata.formatType,
				  )
				: null;
			console.debug('templateDeck', templateDeck);
			opponentDeckString = templateDeck?.deckstring;
		}
		if (opponentDeckString == null && prefs.opponentLoadKnownDecklist) {
			opponentDeckString =
				currentState.opponentDeck.deckstring ??
				(await this.deckParser.getOpenDecklist(newHero.cardId, currentState.metadata));
		}

		// No deckstring, so don't change anything
		if (!opponentDeckString) {
			const newPlayerDeck = currentState.opponentDeck.update({
				hero: newHero,
			} as DeckState);

			return currentState.update({
				opponentDeck: newPlayerDeck,
			} as GameState);
		}

		console.log('[opponent-player] got AI deckstring', opponentDeckString, currentState.metadata);
		const board = await this.memory.getCurrentBoard();
		const decklist = await this.handler.postProcessDeck(this.handler.buildDeckList(opponentDeckString), board);

		// And since this event usually arrives after the cards in hand were drawn, remove from the deck
		// whatever we can
		let newDeck = decklist;
		if (opponentDeckString) {
			for (const card of [
				...currentState.opponentDeck.hand,
				...currentState.opponentDeck.otherZone,
				...currentState.opponentDeck.board,
			]) {
				newDeck = this.helper.removeSingleCardFromZone(newDeck, card.cardId, card.entityId)[0];
			}
		}

		const hand = opponentDeckString
			? this.flagCards(currentState.opponentDeck.hand)
			: currentState.opponentDeck.hand;
		const deck = opponentDeckString ? this.flagCards(newDeck) : newDeck;

		const newPlayerDeck = currentState.opponentDeck.update({
			hero: newHero,
			deckstring: opponentDeckString,
			deckList: decklist,
			deck: deck,
			hand: hand,
			otherZone: opponentDeckString
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
