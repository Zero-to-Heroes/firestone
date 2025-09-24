import {
	CardClass,
	CardIds,
	CardType,
	GameFormat,
	GameTag,
	GameType,
	Race,
	ReferenceCard,
	SpellSchool,
} from '@firestone-hs/reference-data';
import { ArenaRefService } from '@firestone/arena/common';
import { buildContextRelatedCardIds, DeckCard, DeckState, GameState, HeroCard, Metadata } from '@firestone/game-state';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { AppInjector, CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { DeckZone } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { getSelectorsForArenaDraft } from './arena-draft';
import { cardIdSelectorSort } from './card-id-selector-sort';
import { cardIdSelector } from './card-id-selectors';
import { cardsMapping, hasGetRelatedCards } from './global/_registers';
import {
	and,
	barrelOfSludge,
	cardIs,
	CONCOCTION_GENERATORS,
	damage,
	excavate,
	givesAbyssalCurse,
	highlightConditions,
	imbue,
	inDeck,
	inHand,
	isStarshipPieceFor,
	kindred,
	mech,
	minion,
	or,
	orWithHighlight,
	raceIn,
	restoreHealthToMinion,
	riff,
	side,
	spell,
	spellDamage,
	spellSchool,
	starshipExtended,
	tooltip,
} from './selectors';

export abstract class CardsHighlightCommonService extends AbstractSubscriptionComponent {
	private handlers: { [uniqueId: string]: Handler } = {};

	private gameState: GameState;
	private options: SelectorOptions;

	private shouldHighlightProvider: () => Promise<boolean>;

	private readonly arenaRef: ArenaRefService;

	constructor(protected readonly allCards: CardsFacadeService) {
		super(null);
		this.arenaRef = AppInjector.get(ArenaRefService);
	}

	protected async setup(gameStateObs: Observable<GameState>, shouldHighlightProvider: () => Promise<boolean>) {
		this.shouldHighlightProvider = shouldHighlightProvider;
		gameStateObs.subscribe((gameState) => (this.gameState = gameState));
	}

	public async init(options?: SelectorOptions) {
		this.options = options;
	}
	public forceHeroCardId(cardId: string) {
		this.options = { ...this.options, heroCardId: cardId };
	}

	register(_uniqueId: string, handler: Handler, side: HighlightSide) {
		this.handlers[_uniqueId] = handler;
	}

	unregister(_uniqueId: string, side: HighlightSide) {
		delete this.handlers[_uniqueId];
	}

	async onMouseEnter(cardId: string, side: HighlightSide, card?: DeckCard, context?: 'discover') {
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
			this.options?.skipGameState
				? this.buildFakeDeckStateFromRegisteredHandlers(this.options.heroCardId)
				: this.gameState.playerDeck;
		// console.debug('[cards-highlight] playerDeckProvider', playerDeckProvider(), this.options);
		const opponentDeckProvider = () => (this.options?.skipGameState ? null : this.gameState.opponentDeck);

		const cardsToHighlight = this.buildCardsToHighlight(
			side,
			cardId,
			card,
			playerDeckProvider,
			opponentDeckProvider,
			context,
		);
		// console.debug('[cards-highlight] cards to highlight', cardsToHighlight);
		for (const card of cardsToHighlight) {
			const handler = Object.values(this.handlers).find((h) =>
				// Discovers don't have deck card providers
				h.deckCardProvider()?.internalEntityIds?.includes(card.internalEntityId),
			);
			// console.debug('[cards-highlight] handler', card.card?.name, card.highlight);
			if (!!handler) {
				handler.highlightCallback(card.highlight);
			}
		}
	}

	getGlobalRelatedCards(
		entityId: number,
		cardId: string,
		side: HighlightSide,
		gameTypeOverride: GameType = null,
	): readonly string[] {
		let gameState = this.gameState;
		if (this.options?.skipGameState) {
			gameState = gameState.update({
				playerDeck: this.buildFakeDeckStateFromRegisteredHandlers(this.options.heroCardId),
			});
		}
		// These don't work in a draft environment, as they rely on stuff that happen during the game
		if (side === 'player' || side === 'opponent') {
			const cardImpl = cardsMapping[cardId];
			if (hasGetRelatedCards(cardImpl)) {
				const result = cardImpl.getRelatedCards(entityId, side, gameState, this.allCards);
				if (result != null) {
					return result;
				}
			}
		}

		const deck = side === 'opponent' ? gameState?.opponentDeck : gameState?.playerDeck;
		const metaData =
			this.options?.skipGameState && this.options?.metadata ? this.options.metadata : gameState?.metadata;
		const deckCards = deck?.getAllCardsInDeckWithoutOptions() ?? [];
		const card =
			deckCards.find((c) => !!entityId && c.entityId === entityId) ?? deckCards.find((c) => c.cardId === cardId);

		let validArenaPool: readonly string[] = [];
		const gameType = gameTypeOverride ?? metaData?.gameType;
		if (gameType === GameType.GT_ARENA || gameType === GameType.GT_UNDERGROUND_ARENA) {
			// This will fail the first time, because the pool is not initialized yet, but we'll try it like that to avoid
			// blocking the call
			this.arenaRef.validDiscoveryPool$$.getValueWithInit();
			validArenaPool = this.arenaRef.validDiscoveryPool$$.value ?? [];
		}

		const updatedMetadata: Metadata =
			gameType !== metaData?.gameType
				? ({ formatType: GameFormat.FT_WILD, gameType: gameType } as Metadata)
				: metaData;
		const relatedCardIds = buildContextRelatedCardIds(
			cardId,
			entityId,
			card?.relatedCardIds,
			deck,
			updatedMetadata,
			this.allCards,
			gameState,
			validArenaPool,
		);
		return relatedCardIds?.length ? relatedCardIds : [];
	}

	getHighlightedCards(
		cardId: string,
		side: HighlightSide,
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

	private buildFakeDeckStateFromRegisteredHandlers(heroCardId?: string): DeckState {
		const result = DeckState.create({
			deck: Object.values(this.handlers).map((h) => {
				return !!h.deckCardProvider()
					? h.deckCardProvider()
					: DeckCard.create({
							cardId: h.referenceCardProvider()?.id,
						});
			}),
			hero: {
				cardId: heroCardId,
				classes: this.allCards.getCard(heroCardId)?.classes?.map((c) => CardClass[c]) as readonly CardClass[],
			} as HeroCard,
		});

		// console.debug('built fake deck state', result, heroCardId, this.handlers);
		return result;
	}

	private buildCardsToHighlight(
		side: HighlightSide,
		cardId: string,
		card: DeckCard,
		playerDeckProvider: () => DeckState,
		opponentDeckProvider: () => DeckState,
		context?: 'discover',
	): readonly SelectorInput[] {
		let result: SelectorInput[] = [];
		const selector: Selector = this.buildSelector(cardId, card, side, context);
		const selectorSort: SelectorSort = cardIdSelectorSort(cardId);

		const allPlayerCards = this.getAllCards(
			!!playerDeckProvider ? playerDeckProvider() : null,
			side === 'single' || side === 'arena-draft' ? side : 'player',
		);
		// console.debug('[cards-highlight] all player cards', card, cardId, side, selector, allPlayerCards);
		for (const playerCard of allPlayerCards) {
			const selectorOutput = selector(playerCard);
			// console.debug('\t', 'considering', playerCard.card?.name, playerCard, card, selectorOutput);
			playerCard.highlight = selectorOutput;
			if (selectorOutput) {
				// console.debug('\t', 'highlighting', playerCard.card?.name, selectorOutput, playerCard, card);
				result.push(playerCard);
			}
		}

		const allOpponentCards = this.getAllCards(
			!!opponentDeckProvider ? opponentDeckProvider() : null,
			side === 'single' || side === 'arena-draft' ? side : 'opponent',
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

		if (!!selectorSort) {
			let timing = 0;
			result = selectorSort(result).map((info) => ({
				...info,
				deckCard: DeckCard.create({ ...info.deckCard, playTiming: timing++ }),
			}));
		}
		return result;
	}

	onMouseLeave(cardId: string) {
		Object.values(this.handlers).forEach((handler) => handler.unhighlightCallback());
	}

	private getAllCards(deckState: DeckState, side: HighlightSide): readonly SelectorInput[] {
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

	private buildSelector(cardId: string, card: DeckCard, inputSide: HighlightSide, context?: 'discover'): Selector {
		const cardIdSelector = this.buildCardIdSelector(cardId, card, inputSide, context);
		const cardContextSelector = this.buildCardContextSelector(card);
		return orWithHighlight(cardIdSelector, cardContextSelector);
	}

	private buildCardContextSelector(card: DeckCard): Selector {
		if (card?.dredged && !card.cardId && card.linkedEntityIds?.length) {
			return (input: SelectorInput): boolean => card.linkedEntityIds.includes(input.entityId);
		}
	}

	private buildCardIdSelector(
		cardId: string,
		card: DeckCard,
		inputSide: HighlightSide,
		context?: 'discover',
	): Selector {
		// Mechanic-specific highlights
		const selectors: Selector[] = [];

		// Forward synergies - what does this card want?
		const selector = cardIdSelector(cardId, card, inputSide, this.allCards);
		// console.debug('cardIdSelector', selector);
		if (!!selector) {
			selectors.push(selector);
		}

		const refCard = this.allCards.getCard(cardId);
		if (refCard.mechanics?.includes(GameTag[GameTag.MODULAR])) {
			selectors.push(and(side(inputSide), or(inDeck, inHand), minion, mech));
		}
		if (refCard.mechanics?.includes(GameTag[GameTag.SPELLPOWER])) {
			selectors.push(and(side(inputSide), or(inDeck, inHand), spell, damage));
			selectors.push(and(side(inputSide), or(inDeck, inHand), cardIs(CardIds.EversongPortal)));
		}
		if (refCard.mechanics?.includes(GameTag[GameTag.SPELLBURST])) {
			selectors.push(and(side(inputSide), or(inDeck, inHand), spell));
		}
		if (refCard.mechanics?.includes(GameTag[GameTag.OVERHEAL])) {
			selectors.push(and(side(inputSide), or(inDeck, inHand), restoreHealthToMinion));
		}
		if (!!card && refCard.mechanics?.includes(GameTag[GameTag.STARSHIP])) {
			selectors.push(tooltip(and(side(inputSide), isStarshipPieceFor(card.entityId))));
		}
		if (refCard.mechanics?.includes(GameTag[GameTag.DEAL_DAMAGE]) && refCard.type === CardType[CardType.SPELL]) {
			selectors.push(and(side(inputSide), or(inDeck, inHand), spellDamage));
		}
		// Looks like this can still be useful in-game
		if (
			refCard.mechanics?.includes(GameTag[GameTag.IMBUE]) ||
			refCard.referencedTags?.includes(GameTag[GameTag.IMBUE])
		) {
			selectors.push(and(side(inputSide), or(inDeck, inHand), imbue));
		}
		if (
			refCard.mechanics?.includes(GameTag[GameTag.GIVES_ABYSSAL_CURSE]) ||
			refCard.referencedTags?.includes(GameTag[GameTag.GIVES_ABYSSAL_CURSE])
		) {
			selectors.push(and(side(inputSide), or(inDeck, inHand), givesAbyssalCurse));
		}
		if (
			refCard.mechanics?.includes(GameTag[GameTag.EXCAVATE]) ||
			refCard.referencedTags?.includes(GameTag[GameTag.EXCAVATE])
		) {
			selectors.push(and(side(inputSide), or(inDeck, inHand), excavate));
		}
		if (
			refCard.mechanics?.includes(GameTag[GameTag.RIFF]) ||
			refCard.referencedTags?.includes(GameTag[GameTag.RIFF])
		) {
			selectors.push(and(side(inputSide), or(inDeck, inHand), riff));
		}
		if (refCard.mechanics?.includes(GameTag[GameTag.KINDRED])) {
			const cardSpellSchool: SpellSchool = refCard.spellSchool ? SpellSchool[refCard.spellSchool] : null;
			selectors.push(
				and(
					side(inputSide),
					or(inDeck, inHand),
					or(spellSchool(cardSpellSchool), raceIn(refCard.races?.map((r) => Race[r] as Race))),
				),
			);
		}
		if (refCard.spellSchool) {
			selectors.push(
				and(side(inputSide), or(inDeck, inHand), kindred, spellSchool(SpellSchool[refCard.spellSchool])),
			);
		}
		if (
			refCard.mechanics?.includes(GameTag[GameTag.STARSHIP_PIECE]) ||
			refCard.referencedTags?.includes(GameTag[GameTag.STARSHIP_PIECE]) ||
			refCard.mechanics?.includes(GameTag[GameTag.STARSHIP]) ||
			refCard.referencedTags?.includes(GameTag[GameTag.STARSHIP])
		) {
			// console.debug('[cards-highlight] building starship selector', cardId, card, inputSide);
			selectors.push(and(side(inputSide), or(inDeck, inHand), starshipExtended));
		}
		if (refCard.mechanics?.includes('BARREL_OF_SLUDGE')) {
			selectors.push(and(side(inputSide), or(inDeck, inHand), barrelOfSludge));
		}
		// Specific highlights for draft
		if (inputSide === 'single' || inputSide === 'arena-draft') {
			// Reverse kindred
			if (refCard.races?.length) {
				selectors.push(
					and(
						side(inputSide),
						or(inDeck, inHand),
						kindred,
						raceIn(refCard.races?.map((r) => Race[r] as Race)),
					),
				);
			}

			const draftSelectors = getSelectorsForArenaDraft(cardId, card, this.allCards);
			// console.debug('draftSelectors', draftSelectors);
			selectors.push(...draftSelectors);
		}

		if (CONCOCTION_GENERATORS.includes(cardId as CardIds)) {
			selectors.push(and(side(inputSide), or(inHand, inDeck), cardIs(...CONCOCTION_GENERATORS)));
		}

		if (selectors.filter((s) => !!s).length) {
			// console.debug('building card id selector', cardId, selectors);
			return highlightConditions(...selectors.filter((s) => !!s));
		}
	}
}

export interface Handler {
	readonly referenceCardProvider: () => ReferenceCard;
	readonly deckCardProvider: () => VisualDeckCard;
	readonly zoneProvider: () => DeckZone;
	readonly side: () => HighlightSide;
	readonly highlightCallback: (highlight?: SelectorOutput) => void;
	readonly unhighlightCallback: () => void;
}

export interface SelectorOptions {
	readonly uniqueZone?: boolean;
	readonly skipGameState?: boolean;
	readonly skipPrefs?: boolean;
	readonly heroCardId?: string;
	readonly metadata?: Metadata;
}

export interface SelectorInput {
	side: HighlightSide;
	entityId: number;
	internalEntityId: string;
	cardId: string;
	zone: string;
	card: ReferenceCard;
	deckState: DeckState;
	deckCard: DeckCard;
	allCards: CardsFacadeService;
	highlight?: SelectorOutput;
	depth?: number;
}
export type SelectorOutput = boolean | number | 'tooltip';
export type Selector = (info: SelectorInput) => SelectorOutput;
export type SelectorSort = (original: SelectorInput[]) => SelectorInput[];
