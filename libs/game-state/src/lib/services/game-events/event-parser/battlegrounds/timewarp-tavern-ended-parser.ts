import { GameState } from "../../../../models/game-state";
import { ChoosingOptionsGameEvent } from "../../events/choosing-options-game-event";
import { GameEvent } from "../../game-event";
import { EventParser } from "../_event-parser";

export class TimewarpTavernEndedParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: ChoosingOptionsGameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const opponentDeck = currentState.opponentDeck.update({
			board: [],
		});
		return currentState.update({
			opponentDeck: opponentDeck,
			bgState: currentState.bgState.update({
				currentGame: currentState.bgState.currentGame?.update({
					inTimewarpedTavern: false,
				}),
			}),
		});
	}

	event(): string {
		return GameEvent.TIMEWARPED_TAVERN_ENDED;
	}
}
