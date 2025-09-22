import { GameStateEvent } from '@firestone/app/common';
export class ConstructedCloseWindowEvent implements GameStateEvent {
	public static TYPE = 'CONSTRUCTED_CLOSE_WINDOW';

	readonly type: string = ConstructedCloseWindowEvent.TYPE;
}
