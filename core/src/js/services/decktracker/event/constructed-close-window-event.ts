import { GameStateEvent } from '../../../models/decktracker/game-state-event';

export class ConstructedCloseWindowEvent implements GameStateEvent {
	public static TYPE = 'CONSTRUCTED_CLOSE_WINDOW';

	readonly type: string = ConstructedCloseWindowEvent.TYPE;
}
