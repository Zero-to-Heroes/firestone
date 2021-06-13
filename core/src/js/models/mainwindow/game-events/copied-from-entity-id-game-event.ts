import { GameEvent } from '../../game-event';

export class CopiedFromEntityIdGameEvent extends GameEvent {
	readonly additionalData: {
		copiedCardEntityId: number;
		copiedCardControllerId: number;
	};
}
