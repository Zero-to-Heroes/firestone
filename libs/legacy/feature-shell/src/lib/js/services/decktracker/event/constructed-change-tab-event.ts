import { ConstructedTab } from '../../../models/constructed/constructed-tab.type';
import { GameStateEvent } from '../../../models/decktracker/game-state-event';

export class ConstructedChangeTabEvent implements GameStateEvent {
	public static EVENT_NAME = 'CONSTRUCTED_CHANGE_TAB';

	readonly type: string = ConstructedChangeTabEvent.EVENT_NAME;

	constructor(public readonly newTab: ConstructedTab) {}
}
