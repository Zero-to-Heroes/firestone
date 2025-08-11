import { Zone } from '@firestone-hs/reference-data';
import { GameEvent } from '../game-event';

export class CopiedFromEntityIdGameEvent extends GameEvent {
	override readonly additionalData: {
		copiedCardEntityId: number;
		copiedCardControllerId: number;
		copiedCardZone: Zone;
	};
}
