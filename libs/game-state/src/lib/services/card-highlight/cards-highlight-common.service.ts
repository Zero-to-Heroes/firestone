import {
	CardClass,
	CardIds,
	CardType,
	GameFormat,
	GameTag,
	GameType,
	Race,
	ReferenceCard,
	RELIC_IDS,
	SpellSchool,
} from '@firestone-hs/reference-data';
import { CardsFacadeService, HighlightSide } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { DeckCard } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { DeckZone } from '../../models/deck-zone';
import { FullGameState } from '../../models/full-game-state';
import { GameState } from '../../models/game-state';
import { HeroCard } from '../../models/hero-card';
import { Metadata } from '../../models/metadata';
import { VisualDeckCard } from '../../models/visual-deck-card';
import { buildContextRelatedCardIds } from '../../related-cards/related-cards';
import { cardsMapping, hasGetRelatedCards } from '../cards/global/_registers';
import { getSelectorsForArenaDraft } from './arena-draft';
import { cardIdSelectorSort } from './card-id-selector-sort';
import { cardIdSelector } from './card-id-selectors';
import {
	and,
	barrelOfSludge,
	cardIs,
	CONCOCTION_GENERATORS,
	CREWMATE_GENERATORS,
	damage,
	excavate,
	givesAbyssalCurse,
	highlightConditions,
	imbue,
	inDeck,
	inHand,
	isStarshipPieceFor,
	jadeGolem,
	kindred,
	mech,
	minion,
	not,
	or,
	orWithHighlight,
	protossDiscount,
	raceIn,
	relic,
	restoreHealthToMinion,
	riff,
	side,
	spell,
	spellDamage,
	spellSchool,
	starshipExtended,
	tooltip,
	tribeless,
} from './selectors';

export abstract class CardsHighlightCommonService {
	private handlers: { [uniqueId: string]: Handler } = {};

	private gameState: GameState;
	private options: SelectorOptions | undefined;

	private shouldHighlightProvider: () => Promise<boolean>;

	// private readonly arenaRef: ArenaRefService;

	constructor(protected readonly allCards: CardsFacadeService) {
		// this.arenaRef = AppInjector.get(ArenaRefService);
	}

	protected async setup(gameStateObs: Observable<GameState>, shouldHighlightProvider: () => Promise<boolean>) {
		this.shouldHighlightProvider = shouldHighlightProvider;
		gameStateObs.subscribe((gameState) => (this.gameState = gameState));
	}

	public async init(options?: SelectorOptions) {
		// console.log('[cards-highlight-common] init', options, new Error().stack);
		this.options = options;
	}
	public forceHeroCardId(cardId: string) {
		// console.log('[cards-highlight-common] forceHeroCardId', cardId, new Error().stack);
		this.options = { ...this.options, heroCardId: cardId };
	}

	register(_uniqueId: string, handler: Handler, side: HighlightSide) {
		this.handlers[_uniqueId] = handler;
	}

	unregister(_uniqueId: string, side: HighlightSide) {
		delete this.handlers[_uniqueId];
	}

	async onMouseEnter(
		cardId: string,
		entityId: number | null,
		side: HighlightSide,
		card?: DeckCard,
		context?: 'discover',
	) {
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
			entityId,
			card,
			playerDeckProvider,
			opponentDeckProvider,
			this.gameState.fullGameState!,
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
		gameTypeOverride: GameType | null = null,
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
					// If it's a string[], return it directly
					if (Array.isArray(result) && typeof result[0] === 'string') {
						return result;
					}

					// If it's a {cardId: string; entityId: number}[], do some stuff
					const resultWithEntityIds = result as readonly { cardId: string; entityId: number }[];
					const extendedResult: readonly string[] = resultWithEntityIds.flatMap((c) => {
						const isStarship = this.allCards
							.getCard(c.cardId)
							?.mechanics?.includes(GameTag[GameTag.STARSHIP]);
						if (isStarship) {
							const deckState = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
							const deckCard = deckState.findCard(c.entityId);
							if (!deckCard) {
								return c.cardId;
							}
							return [
								c.cardId,
								...(deckCard.card?.storedInformation?.cards
									?.map((c) => c.cardId)
									.filter(
										(c) =>
											![CardIds.AbortLaunch_GDB_906, CardIds.LaunchStarship_GDB_905].includes(
												c as CardIds,
											),
									) ?? []),
							].filter((c) => !!c);
						}
						return c.cardId;
					});
					return extendedResult;
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
			// this.arenaRef.validDiscoveryPool$$.getValueWithInit();
			// validArenaPool = this.arenaRef.validDiscoveryPool$$.value ?? [];
		}

		const updatedMetadata: Metadata =
			gameType !== metaData?.gameType
				? ({ formatType: GameFormat.FT_WILD, gameType: gameType } as Metadata)
				: metaData;
		const relatedCardIds = buildContextRelatedCardIds(
			cardId,
			entityId,
			card?.relatedCardIds ?? [],
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
		entityId: number | null,
		side: HighlightSide,
		card?: DeckCard,
	): readonly { cardId: string; playTiming: number; highlight: SelectorOutput }[] {
		// Happens when using the deck-list component outside of a game
		if (!this.options?.skipGameState && !this.gameState) {
			return [];
		}

		const playerDeckProvider = () =>
			this.options?.skipGameState ? this.buildFakeDeckStateFromRegisteredHandlers() : this.gameState.playerDeck;
		const opponentDeckProvider = () => (this.options?.skipGameState ? null : this.gameState.opponentDeck);

		const cardsToHighlight = this.buildCardsToHighlight(
			side,
			cardId,
			entityId,
			card,
			playerDeckProvider,
			opponentDeckProvider,
			this.gameState.fullGameState!,
		);
		// console.debug('cardsToHighlight in getHighlightedCards', cardsToHighlight);
		return cardsToHighlight.map((i) => ({
			cardId: i.cardId,
			playTiming: i.deckCard?.playTiming ?? 0,
			highlight: i.highlight ?? false,
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
				classes: this.allCards
					.getCard(heroCardId ?? 0)
					?.classes?.map((c) => CardClass[c]) as readonly CardClass[],
			} as HeroCard,
		});

		// console.debug('built fake deck state', result, heroCardId, this.handlers);
		return result;
	}

	private buildCardsToHighlight(
		side: HighlightSide,
		cardId: string,
		entityId: number | null,
		card: DeckCard | null | undefined,
		playerDeckProvider: () => DeckState,
		opponentDeckProvider: () => DeckState | null,
		fullGameState: FullGameState,
		context?: 'discover',
	): readonly SelectorInput[] {
		let result: SelectorInput[] = [];
		const selector: Selector | null = this.buildSelector(cardId, entityId, card, side, context);
		if (!selector) {
			return [];
		}

		const selectorSort: SelectorSort | null = cardIdSelectorSort(cardId);

		if (side !== 'opponent') {
			const allPlayerCards = this.getAllCards(
				!!playerDeckProvider ? playerDeckProvider() : null,
				side === 'single' || side === 'arena-draft' ? side : 'player',
				fullGameState,
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
		}

		const allOpponentCards = this.getAllCards(
			!!opponentDeckProvider ? opponentDeckProvider() : null,
			side === 'single' || side === 'arena-draft' ? side : 'opponent',
			fullGameState,
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

	private getAllCards(
		deckState: DeckState | null,
		side: HighlightSide,
		fullGameState: FullGameState,
	): readonly SelectorInput[] {
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
				fullGameState: fullGameState,
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
				fullGameState: fullGameState,
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
				fullGameState: fullGameState,
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
				fullGameState: fullGameState,
			});
		}
		return result;
	}

	private buildSelector(
		cardId: string,
		entityId: number | null,
		card: DeckCard | null | undefined,
		inputSide: HighlightSide,
		context?: 'discover',
	): Selector | null {
		const cardIdSelector = this.buildCardIdSelector(cardId, entityId, card, inputSide, context);
		const cardContextSelector = this.buildCardContextSelector(card);
		return orWithHighlight(cardIdSelector, cardContextSelector);
	}

	private buildCardContextSelector(card: DeckCard | null | undefined): Selector | null {
		if (card?.dredged && !card.cardId && card.linkedEntityIds?.length) {
			return (input: SelectorInput): boolean => card.linkedEntityIds.includes(input.entityId);
		}
		return null;
	}

	private buildCardIdSelector(
		cardId: string,
		entityId: number | null,
		card: DeckCard | null | undefined,
		inputSide: HighlightSide,
		context?: 'discover',
	): Selector | null {
		// Mechanic-specific highlights
		const selectors: Selector[] = [];

		// Forward synergies - what does this card want?
		const selector = cardIdSelector(cardId, entityId, card, inputSide, this.allCards);
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
			refCard.mechanics?.includes(GameTag[GameTag.JADE_GOLEM]) ||
			refCard.referencedTags?.includes(GameTag[GameTag.JADE_GOLEM])
		) {
			selectors.push(and(side(inputSide), or(inDeck, inHand), jadeGolem));
		}
		if (
			refCard.mechanics?.includes(GameTag[GameTag.RIFF]) ||
			refCard.referencedTags?.includes(GameTag[GameTag.RIFF])
		) {
			selectors.push(and(side(inputSide), or(inDeck, inHand), riff));
		}
		if (
			refCard.type?.toUpperCase() === CardType[CardType.SPELL] &&
			refCard.mechanics?.includes(GameTag[GameTag.KINDRED])
		) {
			const cardSpellSchool: SpellSchool = refCard.spellSchool ? SpellSchool[refCard.spellSchool] : null;
			selectors.push(and(side(inputSide), or(inDeck, inHand), spellSchool(cardSpellSchool)));
		}
		if (
			refCard.type?.toUpperCase() === CardType[CardType.MINION] &&
			refCard.mechanics?.includes(GameTag[GameTag.KINDRED])
		) {
			if (refCard.races?.length) {
				if (refCard.races.includes(Race[Race.ALL])) {
					selectors.push(and(side(inputSide), or(inDeck, inHand), not(tribeless)));
				} else {
					selectors.push(
						and(side(inputSide), or(inDeck, inHand), raceIn(refCard.races?.map((r) => Race[r] as Race))),
					);
				}
			}
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
		if (RELIC_IDS.includes(cardId as CardIds)) {
			selectors.push(and(side(inputSide), or(inDeck, inHand), relic));
		}
		if (
			refCard.type?.toUpperCase() === CardType[CardType.MINION] &&
			(refCard.mechanics?.includes(GameTag[GameTag.PROTOSS]) ||
				refCard.referencedTags?.includes(GameTag[GameTag.PROTOSS]))
		) {
			selectors.push(and(side(inputSide), or(inDeck, inHand), protossDiscount));
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

		if (CREWMATE_GENERATORS.includes(cardId as CardIds)) {
			selectors.push(and(side(inputSide), or(inHand, inDeck), cardIs(...CREWMATE_GENERATORS)));
		}

		if (selectors.filter((s) => !!s).length) {
			// console.debug('building card id selector', cardId, selectors);
			return highlightConditions(...selectors.filter((s) => !!s));
		}
		return null;
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
	card: ReferenceCard | null;
	deckState: DeckState;
	deckCard: DeckCard;
	allCards: CardsFacadeService;
	fullGameState: FullGameState;
	highlight?: SelectorOutput;
	depth?: number;
}
export type SelectorOutput = boolean | number | 'tooltip';
export type Selector = (info: SelectorInput) => SelectorOutput;
export type SelectorSort = (original: SelectorInput[]) => SelectorInput[];
