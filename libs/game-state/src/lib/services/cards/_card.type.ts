import { AllCardsService, CardIds, GameFormat, GameTag, GameType, Zone } from '@firestone-hs/reference-data';
import { HighlightSide } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo, StoredInformation } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GameState } from '../../models/game-state';
import { Metadata } from '../../models/metadata';
import { Selector } from '../card-highlight/cards-highlight-common.service';
import { GameEvent } from '../game-events/game-event';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Card {
	cardIds: readonly CardIds[];
}
export type GeneratingCard = Card & {
	publicCreator?: boolean;
	publicTutor?: boolean;
	hasSequenceInfo?: boolean;
} & (
		| { guessInfo: GuessInfoFunction; guessCardId?: GuessCardIdFunction }
		| { guessInfo?: GuessInfoFunction; guessCardId: GuessCardIdFunction }
		| { guessInfo: GuessInfoFunction; guessCardId: GuessCardIdFunction }
		| { guessInfo?: GuessInfoFunction; guessCardId?: GuessCardIdFunction }
	);
export const hasGeneratingCard = (card: Card): card is GeneratingCard =>
	(card as GeneratingCard)?.guessInfo !== undefined ||
	(card as GeneratingCard)?.guessCardId !== undefined ||
	!!(card as GeneratingCard)?.publicCreator ||
	!!(card as GeneratingCard)?.publicTutor;
// export type GameEventCard = Card & {
// }

// When drawing a card
export interface GuessInfoInput {
	card: DeckCard;
	deckState: DeckState;
	opponentDeckState: DeckState;
	gameState: GameState;
	allCards: AllCardsService;
	creatorEntityId: number | undefined | null;
	options: {
		positionInHand?: number;
		creatorZone?: Zone | null;
		tags?: readonly { Name: GameTag; Value: number }[];
		metadata?: Metadata;
		validArenaPool: readonly string[];
		creatorTags?: readonly { Name: GameTag; Value: number }[];
		/** Same derivation as dynamic pools (`getDynamicRelatedCardIdsInternal`); callers may override. */
		currentClass?: string;
		initialDecklist?: readonly string[];
	};
}
export interface GuessCardIdInput {
	cardId: string | undefined;
	deckState: DeckState;
	opponentDeckState: DeckState;
	gameState: GameState;
	creatorCardId: string;
	creatorEntityId: number;
	createdIndex: number;
	allCards: AllCardsService;
}
type GuessInfoFunction = (input: GuessInfoInput) => GuessedInfo | null;
type GuessCardIdFunction = (input: GuessCardIdInput) => string | null;

export interface SelectorCard extends Card {
	selector: (info: HighlightSide) => Selector;
}
export const hasSelector = (card: Card): card is SelectorCard => (card as SelectorCard)?.selector !== undefined;

export interface StaticGeneratingCard extends Card {
	publicCreator?: boolean;
	summonInPlay?: boolean;
	overrideDefaultDynamicPool?: boolean;
	dynamicPool: (input: StaticGeneratingCardInput) => readonly string[];
}
export const hasDynamicPool = (card: Card): card is StaticGeneratingCard =>
	(card as StaticGeneratingCard)?.dynamicPool !== undefined;
export interface StaticGeneratingCardInput {
	cardId: string;
	entityId: number;
	allCards: AllCardsService;
	inputOptions: {
		trueEntityId: number | null | undefined;
		format: GameFormat;
		gameType: GameType;
		scenarioId: number;
		currentClass: string;
		deckState: DeckState;
		opponentDeckState: DeckState;
		gameState: GameState;
		validArenaPool: readonly string[];
		initialDecklist: readonly string[];
	};
}

/** @deprecated */
export interface SpecialCaseParserCard extends Card {
	specialCaseParser: (deck: DeckState) => DeckState;
}
export const hasSpecialCaseParser = (card: Card): card is SpecialCaseParserCard =>
	(card as SpecialCaseParserCard)?.specialCaseParser !== undefined;

export interface WillBeActiveCard extends Card {
	willBeActive: (input: WillBeActiveInput) => boolean;
}
export const hasWillBeActive = (card: Card): card is WillBeActiveCard =>
	(card as WillBeActiveCard)?.willBeActive !== undefined;
export interface WillBeActiveInput {
	cardId: string;
	entityId: number;
	playerDeck: DeckState;
	currentTurn: number;
	allCards: AllCardsService;
}

export interface ChainParsingCard extends Card {
	chainParser: (allCards: AllCardsService) => ActionChainParser;
}
export const hasChainParsingCard = (card: Card): card is ChainParsingCard =>
	(card as ChainParsingCard)?.chainParser !== undefined;
export interface ActionChainParser {
	appliesOnEvent(): GameEvent['type'];
	parse(currentState: GameState, events: GameEvent[]): Promise<GameState>;
}

export interface OnCardPlayedWhileInHandCard extends Card {
	onCardPlayedWhileInHand: (input: OnCardPlayedWhileInHandInput) => DeckState;
}
export const hasOnCardPlayedWhileInHand = (card: Card): card is OnCardPlayedWhileInHandCard =>
	(card as OnCardPlayedWhileInHandCard)?.onCardPlayedWhileInHand !== undefined;
export interface OnCardPlayedWhileInHandInput {
	card: DeckCard;
	cardIdPlayed: string;
	entityIdPlayed: number | null;
	deckState: DeckState;
	opponentDeckState: DeckState | null;
	allCards: AllCardsService;
}

export interface CustomEffectCard extends Card {
	effects: readonly string[];
	customEffect: (input: CustomEffectInput) => GameState;
}
export const hasCustomEffect = (card: Card): card is CustomEffectCard =>
	(card as CustomEffectCard)?.customEffect !== undefined;
export interface CustomEffectInput {
	currentState: GameState;
	gameEvent: GameEvent;
	allCards: AllCardsService;
}

export interface PowerEndCard extends Card {
	powerEnd: (input: PowerEndInput) => GameState;
}
export const hasPowerEnd = (card: Card): card is PowerEndCard => (card as PowerEndCard)?.powerEnd !== undefined;
export interface PowerEndInput {
	currentState: GameState;
	gameEvent: GameEvent;
	allCards: AllCardsService;
}

/** @deprecated */
// The timing for this doesn't work, because the entityChosen is is emitted by the GameState log
// so we don't have all the information to handle this event
export interface OnChosenEntityCard extends Card {
	onChosenEntity: (input: OnChosenEntityInput) => GameState;
}
export const hasOnChosenEntity = (card: Card): card is OnChosenEntityCard =>
	(card as OnChosenEntityCard)?.onChosenEntity !== undefined;
export interface OnChosenEntityInput {
	currentState: GameState;
	gameEvent: GameEvent;
	allCards: AllCardsService;
}

export interface OnCardPlayedCard extends Card {
	onCardPlayed: (input: OnCardPlayedInput) => StoredInformation | null;
}
export const hasOnCardPlayed = (card: Card): card is OnCardPlayedCard =>
	(card as OnCardPlayedCard)?.onCardPlayed !== undefined;
export interface OnCardPlayedInput {
	card: DeckCard;
	deckState: DeckState;
	opponentDeckState: DeckState;
	gameState: GameState;
}
