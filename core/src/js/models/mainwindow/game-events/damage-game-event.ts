import { GameEvent } from '../../game-event';

export class DamageGameEvent extends GameEvent {
	readonly additionalData: {
		sourceEntityId: number;
		sourceCardId: string;
		sourceControllerId: number;
		targets: {
			[targetCardId: string]: DamageGameEventTarget;
		};
	};

	public findTarget(cardId: string): DamageGameEventTarget {
		const result = Object.values(this.additionalData.targets).find((target) => target.TargetCardId === cardId);
		if (!result) {
			return null;
		}

		return !!result.SourceCardId ? result : { ...result, SourceCardId: this.additionalData.sourceCardId };
	}
}

export interface DamageGameEventTarget {
	SourceCardId: string;
	SourceEntityId: number;
	SourceControllerId: number;
	TargetCardId: string;
	TargetEntityId: number;
	TargetControllerId: number;
	Damage: number;
	Timestamp: string;
}
