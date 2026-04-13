import { Zone } from '@firestone-hs/reference-data';
import { GameEvent } from '../game-event';

export class CopiedFromEntityIdGameEvent extends GameEvent {
	override readonly additionalData: {
		copiedCardEntityId: number;
		copiedCardControllerId: number;
		copiedCardZone: Zone;
		/** True when the power-log parser synthesizes this event (DISPLAYED_CREATOR-only Azalina lines). */
		syntheticAzalinaHandCopy?: boolean;
		/** From SHOW_ENTITY / entity tags: copy has DREDGE (opponent self-dredge obfuscation). */
		copyDredgeTag?: boolean;
	};
}
