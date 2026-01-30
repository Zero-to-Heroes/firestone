import { AllCardsService, CardIds, GameFormat, GameTag, GameType } from '@firestone-hs/reference-data';
import { HighlightSide } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
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
	);
export const hasGeneratingCard = (card: Card): card is GeneratingCard =>
	(card as GeneratingCard)?.guessInfo !== undefined || (card as GeneratingCard)?.guessCardId !== undefined;
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
	options?: {
		positionInHand?: number;
		tags?: readonly { Name: GameTag; Value: number }[];
		metadata?: Metadata;
	};
}
export interface GuessCardIdInput {
	cardId: string;
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

// export interface ActionChainParser {
// 	appliesOnEvent(): GameEvent['type'];
// 	parse(currentState: GameState, events: GameEvent[]): Promise<GameState>;
// }
export interface StaticGeneratingCard extends Card {
	publicCreator?: boolean;
	dynamicPool: (input: StaticGeneratingCardInput) => readonly string[];
}
export const hasDynamicPool = (card: Card): card is StaticGeneratingCard =>
	(card as StaticGeneratingCard)?.dynamicPool !== undefined;
export interface StaticGeneratingCardInput {
	cardId: string;
	entityId: number;
	allCards: AllCardsService;
	inputOptions: {
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
