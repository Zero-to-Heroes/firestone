import { GameEvent } from '../game-event';

export class DamageGameEvent extends GameEvent {
	override readonly additionalData: {
		sourceEntityId: number;
		sourceCardId: string;
		sourceControllerId: number;
		targets: {
			[targetCardId: string]: DamageGameEventTarget;
		};
		activePlayerId: number;
	};

	public findTarget(cardId: string): DamageGameEventTarget | null {
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
	Hits: number;
	Timestamp: string;
	IsPayingWithHealth: boolean;
}
