import { Zone } from '@firestone-hs/reference-data';
import { GameEvent } from '@firestone/game-state';

export class CopiedFromEntityIdGameEvent extends GameEvent {
	readonly additionalData: {
		copiedCardEntityId: number;
		copiedCardControllerId: number;
		copiedCardZone: Zone;
	};
}
