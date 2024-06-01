import { GameTag, ReferenceCard } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { DeckZone } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { cardIdSelector } from './card-id-selectors';
import { and, inDeck, inHand, mech, minion, or, orWithHighlight, side } from './selectors';

export abstract class CardsHighlightCommonService extends AbstractSubscriptionComponent {
	private handlers: { [uniqueId: string]: Handler } = {};

	private gameState: GameState;
	private options: SelectorOptions;

	private shouldHighlightProvider: () => Promise<boolean>;

	constructor(protected readonly allCards: CardsFacadeService) {
		super(null);
	}

	protected async setup(gameStateObs: Observable<GameState>, shouldHighlightProvider: () => Promise<boolean>) {
		this.shouldHighlightProvider = shouldHighlightProvider;
		gameStateObs.subscribe((gameState) => (this.gameState = gameState));
	}

	public async init(options?: SelectorOptions) {
		this.options = options;
	}

	register(_uniqueId: string, handler: Handler, side: 'player' | 'opponent' | 'duels') {
		this.handlers[_uniqueId] = handler;
	}

	unregister(_uniqueId: string, side: 'player' | 'opponent' | 'duels') {
		delete this.handlers[_uniqueId];
	}

	async onMouseEnter(cardId: string, side: 'player' | 'opponent' | 'duels', card?: DeckCard) {
		// Happens when using the deck-list component outside of a game
		// console.debug('[cards-highlight] mouse enter', cardId, side, card, this.options);
		if (!this.options?.skipGameState && !this.gameState) {
			console.debug('no game state, skipping highlight');
			return;
		}

		const shouldHighlight = await this.shouldHighlightProvider();
		// console.debug('[cards-highlight] should highlight', shouldHighlight, this.options);
		if (!this.options?.skipPrefs && !shouldHighlight) {
			console.debug('highlighting disabled in prefs, skipping highlight', shouldHighlight, this.options);
			return;
		}

		const playerDeckProvider = () =>
			this.options?.skipGameState ? this.buildFakeDeckStateFromRegisteredHandlers() : this.gameState.playerDeck;
		const opponentDeckProvider = () => (this.options?.skipGameState ? null : this.gameState.opponentDeck);

		const cardsToHighlight = this.buildCardsToHighlight(
			side,
			cardId,
			card,
			playerDeckProvider,
			opponentDeckProvider,
		);
		// console.debug('[cards-highlight] cards to highlight', cardsToHighlight);
		for (const card of cardsToHighlight) {
			const handler = Object.values(this.handlers).find((h) =>
				// Discovers don't have deck card providers
				h.deckCardProvider()?.internalEntityIds?.includes(card.internalEntityId),
			);
			// console.debug(
			// 	'[cards-highlight] handler',
			// 	handler,
			// 	card.internalEntityId,
			// 	card.cardId,
			// 	card.card?.name,
			// 	this.handlers,
			// 	Object.values(this.handlers)[0]?.deckCardProvider(),
			// 	Object.values(this.handlers).map(
			// 		(h) =>
			// 			// Discovers don't have deck card providers
			// 			h.deckCardProvider()?.internalEntityIds,
			// 	),
			// );
			if (!!handler) {
				handler.highlightCallback(card.highlight);
			}
		}
	}

	getHighlightedCards(
		cardId: string,
		side: 'player' | 'opponent' | 'duels',
		card?: DeckCard,
	): readonly { cardId: string; playTiming: number; highlight: SelectorOutput }[] {
		// Happens when using the deck-list component outside of a game
		if (!this.options?.skipGameState && !this.gameState) {
			return;
		}

		const playerDeckProvider = () =>
			this.options?.skipGameState ? this.buildFakeDeckStateFromRegisteredHandlers() : this.gameState.playerDeck;
		const opponentDeckProvider = () => (this.options?.skipGameState ? null : this.gameState.opponentDeck);

		const cardsToHighlight = this.buildCardsToHighlight(
			side,
			cardId,
			card,
			playerDeckProvider,
			opponentDeckProvider,
		);
		// console.debug('cardsToHighlight in getHighlightedCards', cardsToHighlight);
		return cardsToHighlight.map((i) => ({
			cardId: i.cardId,
			playTiming: i.deckCard?.playTiming ?? 0,
			highlight: i.highlight,
		}));
	}

	private buildFakeDeckStateFromRegisteredHandlers(): DeckState {
		const result = DeckState.create({
			deck: Object.values(this.handlers).map((h) => {
				return !!h.deckCardProvider()
					? h.deckCardProvider()
					: DeckCard.create({
							cardId: h.referenceCardProvider()?.id,
					  });
			}),
		});
		// console.debug('built fake deck state', result, this.handlers);
		return result;
	}

	private buildCardsToHighlight(
		side: 'player' | 'opponent' | 'duels',
		cardId: string,
		card: DeckCard,
		playerDeckProvider: () => DeckState,
		opponentDeckProvider: () => DeckState,
	): readonly SelectorInput[] {
		const result: SelectorInput[] = [];
		const selector: Selector = this.buildSelector(cardId, card, side);

		const allPlayerCards = this.getAllCards(
			!!playerDeckProvider ? playerDeckProvider() : null,
			side === 'duels' ? side : 'player',
		);
		// console.debug('[cards-highlight] all player cards', card, cardId, side, selector);
		for (const playerCard of allPlayerCards) {
			// console.debug('\t', 'considering', playerCard.card?.name, playerCard, card);
			const selectorOutput = selector(playerCard);
			playerCard.highlight = selectorOutput;
			if (selectorOutput) {
				// console.debug('\t', 'highlighting', playerCard.card?.name, selectorOutput, playerCard, card);
				result.push(playerCard);
			}
		}

		const allOpponentCards = this.getAllCards(
			!!opponentDeckProvider ? opponentDeckProvider() : null,
			side === 'duels' ? side : 'opponent',
		);
		// console.debug('[cards-highlight] all player cards', card, cardId, side, selector);
		for (const oppCard of allOpponentCards) {
			const selectorOutput = selector(oppCard);
			oppCard.highlight = selectorOutput;
			if (selectorOutput) {
				// console.debug('\t', 'highlighting', playerCard.card?.name, selectorOutput, playerCard, card);
				result.push(oppCard);
			}
		}
		return result;
	}

	onMouseLeave(cardId: string) {
		Object.values(this.handlers).forEach((handler) => handler.unhighlightCallback());
	}

	private getAllCards(deckState: DeckState, side: 'player' | 'opponent' | 'duels'): readonly SelectorInput[] {
		if (!deckState) {
			return [];
		}
		const result: SelectorInput[] = [];
		for (const card of [...deckState.deck]) {
			result.push({
				cardId: card.cardId,
				entityId: card.entityId,
				internalEntityId: card.internalEntityId,
				card: !!card.cardId ? this.allCards.getCard(card.cardId) : null,
				zone: 'deck',
				side: side,
				deckCard: card,
				deckState: deckState,
				allCards: this.allCards,
			});
		}
		for (const card of [...deckState.hand]) {
			result.push({
				cardId: card.cardId,
				entityId: card.entityId,
				internalEntityId: card.internalEntityId,
				card: !!card.cardId ? this.allCards.getCard(card.cardId) : null,
				zone: 'hand',
				side: side,
				deckCard: card,
				deckState: deckState,
				allCards: this.allCards,
			});
		}
		for (const card of [...deckState.board]) {
			result.push({
				cardId: card.cardId,
				entityId: card.entityId,
				internalEntityId: card.internalEntityId,
				card: !!card.cardId ? this.allCards.getCard(card.cardId) : null,
				zone: 'other',
				side: side,
				deckCard: card,
				deckState: deckState,
				allCards: this.allCards,
			});
		}
		for (const card of [...deckState.otherZone]) {
			result.push({
				cardId: card.cardId,
				entityId: card.entityId,
				internalEntityId: card.internalEntityId,
				card: !!card.cardId ? this.allCards.getCard(card.cardId) : null,
				zone: card.zone === 'GRAVEYARD' ? 'graveyard' : 'other',
				side: side,
				deckCard: card,
				deckState: deckState,
				allCards: this.allCards,
			});
		}
		return result;
	}

	private buildSelector(cardId: string, card: DeckCard, inputSide: 'player' | 'opponent' | 'duels'): Selector {
		const cardIdSelector = this.buildCardIdSelector(cardId, card, inputSide);
		const cardContextSelector = this.buildCardContextSelector(card);
		return orWithHighlight(cardIdSelector, cardContextSelector);
	}

	private buildCardContextSelector(card: DeckCard): Selector {
		if (card?.dredged && !card.cardId && card.linkedEntityIds?.length) {
			return (input: SelectorInput): boolean => card.linkedEntityIds.includes(input.entityId);
		}
	}

	private buildCardIdSelector(cardId: string, card: DeckCard, inputSide: 'player' | 'opponent' | 'duels'): Selector {
		const selector = cardIdSelector(cardId, card, inputSide, this.allCards);
		if (!!selector) {
			return selector;
		}

		// Mechanic-specific highlights
		if (this.allCards.getCard(cardId).mechanics?.includes(GameTag[GameTag.MODULAR])) {
			return and(side(inputSide), or(inDeck, inHand), minion, mech);
		}
	}
}

export interface Handler {
	readonly referenceCardProvider: () => ReferenceCard;
	readonly deckCardProvider: () => VisualDeckCard;
	readonly zoneProvider: () => DeckZone;
	readonly side: () => 'player' | 'opponent' | 'duels';
	readonly highlightCallback: (highlight?: SelectorOutput) => void;
	readonly unhighlightCallback: () => void;
}

export interface SelectorOptions {
	readonly uniqueZone?: boolean;
	readonly skipGameState?: boolean;
	readonly skipPrefs?: boolean;
}

export interface SelectorInput {
	side: 'player' | 'opponent' | 'duels';
	entityId: number;
	internalEntityId: string;
	cardId: string;
	zone: string;
	card: ReferenceCard;
	deckState: DeckState;
	deckCard: DeckCard;
	allCards: CardsFacadeService;
	highlight?: SelectorOutput;
}
export type SelectorOutput = boolean | number | 'tooltip';
export type Selector = (info: SelectorInput) => SelectorOutput;
