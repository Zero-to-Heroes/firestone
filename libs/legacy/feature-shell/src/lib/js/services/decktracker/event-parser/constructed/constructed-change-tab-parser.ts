import { GameState } from '../../../../models/decktracker/game-state';
import { GameStateEvent } from '../../../../models/decktracker/game-state-event';
import { ConstructedChangeTabEvent } from '../../event/constructed-change-tab-event';
import { EventParser } from '../event-parser';

export class ConstructedChangeTabParser implements EventParser {
	applies(gameEvent: GameStateEvent, state: GameState): boolean {
		return state && gameEvent.type === ConstructedChangeTabEvent.EVENT_NAME;
	}

	async parse(currentState: GameState, event: ConstructedChangeTabEvent): Promise<GameState> {
		// const constructedState = currentState.constructedState.update({
		// 	currentTab: event.newTab,
		// } as ConstructedState);
		return currentState.update({
			// constructedState: constructedState,
		} as GameState);
	}

	event(): string {
		return ConstructedChangeTabEvent.EVENT_NAME;
	}
}
