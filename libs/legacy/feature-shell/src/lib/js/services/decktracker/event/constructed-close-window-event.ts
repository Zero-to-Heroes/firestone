import { GameStateEvent } from '@firestone/shared/common/service';

export class ConstructedCloseWindowEvent implements GameStateEvent {
	public static TYPE = 'CONSTRUCTED_CLOSE_WINDOW';

	readonly type: string = ConstructedCloseWindowEvent.TYPE;
}
