import { AllCardsService, CardIds, GameFormat, GameTag, GameType } from '@firestone-hs/reference-data';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GameState } from '../../models/game-state';

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
	creatorEntityId: number;
	options?: {
		positionInHand?: number;
		tags?: readonly { Name: GameTag; Value: number }[];
	};
}
type GuessInfoFunction = (input: GuessInfoInput) => GuessedInfo | null;
type GuessCardIdFunction = (
	cardId: string,
	deckState: DeckState,
	opponentDeckState: DeckState,
	creatorCardId: string,
	creatorEntityId: number,
	createdIndex: number,
	allCards: AllCardsService,
) => string | null;
// Wait until this is correctly refactored
// export interface SelectorCard extends Card {
// 	selector: (info: HighlightSide) => Selector;
// }
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
