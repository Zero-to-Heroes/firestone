import { GameEvent } from "../../../models/game-event";
import { GameState } from "../../../models/decktracker/game-state";

export interface EventParser {
    applies(gameEvent: GameEvent): boolean;
	parse(currentState: GameState, gameEvent: GameEvent): GameState;
    event(): string;
}