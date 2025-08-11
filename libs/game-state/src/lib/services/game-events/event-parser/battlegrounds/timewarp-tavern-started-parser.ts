import { GameState } from "../../../../models/game-state";
import { GameEvent } from "../../game-event";
import { EventParser } from "../_event-parser";

export class TimewarpTavernStartedParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: currentState.bgState.currentGame?.update({
					inTimewarpedTavern: true,
				}),
			}),
		});
	}

	event(): string {
		return GameEvent.TIMEWARPED_TAVERN_STARTED;
	}
}
