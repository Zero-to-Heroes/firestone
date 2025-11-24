import { GameType, CardIds, GameTag, AllCardsService, GameFormat } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
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
// export type GameEventCard = Card & {
// }

// When drawing a card
type GuessInfoFunction = (
	card: DeckCard,
	deckState: DeckState,
	opponentDeckState: DeckState,
	allCards: AllCardsService,
	creatorEntityId: number,
	options?: {
		positionInHand?: number;
		tags?: readonly { Name: GameTag; Value: number }[];
	},
) => GuessedInfo | null;
type GuessCardIdFunction = (
	cardId: string,
	deckState: DeckState,
	opponentDeckState: DeckState,
	creatorCardId: string,
	creatorEntityId: number,
	createdIndex: number,
	allCards: AllCardsService,
) => string | null;
export interface GuessInfoInput {
	card: DeckCard;
	deckState: DeckState;
	opponentDeckState: DeckState;
	allCards: AllCardsService;
	creatorEntityId: number;
	options?: {
		positionInHand?: number;
		tags?: readonly { Name: GameTag; Value: number }[];
	};
}
// Wait until this is correctly refactored
// export interface SelectorCard extends Card {
// 	selector: (info: HighlightSide) => Selector;
// }
// export interface ActionChainParser {
// 	appliesOnEvent(): GameEvent['type'];
// 	parse(currentState: GameState, events: GameEvent[]): Promise<GameState>;
// }
export interface StaticGeneratingCard extends Card {
	dynamicPool: (input: StaticGeneratingCardInput) => readonly string[];
}
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
		gameState: GameState;
		validArenaPool: readonly string[];
	};
}
export interface SpecialCaseParserCard extends Card {
	specialCaseParser: (deck: DeckState) => DeckState;
}
