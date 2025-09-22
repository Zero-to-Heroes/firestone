import { Zone } from '@firestone-hs/reference-data';
import { GameEvent } from '@firestone/shared/common/service';

export class CopiedFromEntityIdGameEvent extends GameEvent {
	readonly additionalData: {
		copiedCardEntityId: number;
		copiedCardControllerId: number;
		copiedCardZone: Zone;
	};
}
