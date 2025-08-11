import { GameStateEvent } from '@firestone/shared/common/service';
import { ConstructedTab } from '../../../models/constructed/constructed-tab.type';

export class ConstructedChangeTabEvent implements GameStateEvent {
	public static EVENT_NAME = 'CONSTRUCTED_CHANGE_TAB';

	readonly type: string = ConstructedChangeTabEvent.EVENT_NAME;

	constructor(public readonly newTab: ConstructedTab) {}
}
